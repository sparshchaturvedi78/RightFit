package com.rightFit.service;

import com.rightFit.dto.CreateEmployeeRequest;
import com.rightFit.dto.UpdateEmployeeRequest;
import com.rightFit.dto.ChangeRmgRequest;
import com.rightFit.dto.DeactivateEmployeeRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.User;
import com.rightFit.entity.Department;
import com.rightFit.entity.Location;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.UserRepository;
import com.rightFit.repository.DepartmentRepository;
import com.rightFit.repository.LocationRepository;
import com.rightFit.audit.Auditable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeManagementService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleService userRoleService;
    private final AuditLogService auditLogService;
    private final EmployeeExitService employeeExitService;
    private final RequirementAccessGuard accessGuard;
    private final ResourcePoolService resourcePoolService;
    private final com.rightFit.repository.UserRoleRepository userRoleRepository;
    private final com.rightFit.repository.RoleRepository roleRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final com.rightFit.repository.ProjectRepository projectRepository;
    private final com.rightFit.repository.AllocationRepository allocationRepository;
    private final com.rightFit.repository.ProjectMemberRepository projectMemberRepository;
    private final ProjectMembershipService projectMembershipService;
    private final WorkforceBucketService workforceBucketService;

    @Auditable(action = "CREATE", entityType = "EMPLOYEE", entityIdParamName = "result.id")
    public EmployeeDTO createEmployee(CreateEmployeeRequest request) {
        log.info("Creating employee: {}", request.getEmployeeId());

        validateEmployeeUniqueness(request.getEmployeeId(), request.getEmail());

        String roleCode = request.getOptionalRoleId() == null ? null
                : roleRepository.findById(request.getOptionalRoleId()).map(r -> r.getCode()).orElse(null);
        boolean newAdmin = "ADMIN".equalsIgnoreCase(roleCode);
        // A manager runs projects and does not report to an RMG, so they are never tagged to one and never go to the pool.
        boolean manager = "MANAGER".equalsIgnoreCase(roleCode);
        if (request.getRmgId() == null && !newAdmin && !manager) {
            throw new com.rightFit.exception.BusinessRuleException("An RMG is required for everyone except a new Admin or Manager");
        }
        Employee rmg = manager || request.getRmgId() == null ? null : employeeRepository.findById(request.getRmgId())
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("RMG", String.valueOf(request.getRmgId())));
        // Optional: the project this manager is named to. They still claim it themselves.
        com.rightFit.entity.Project targetProject = request.getProjectId() == null || request.getProjectId().isBlank() ? null
                : projectRepository.findByProjectId(request.getProjectId().trim())
                        .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Project", request.getProjectId()));
        if (targetProject != null && !manager) {
            throw new com.rightFit.exception.BusinessRuleException("Only a manager can be given a project when they are created");
        }
        String actor = actorLabel();
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found: " + request.getDepartmentId()));
        Location location = request.getLocationId() == null ? null : locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found: " + request.getLocationId()));

        Employee employee = Employee.builder()
                .employeeId(request.getEmployeeId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .grade(request.getGrade())
                .designation(request.getDesignation())
                .domain(request.getDomain())
                .yearsOfExperience(request.getYearsOfExperience())
                .dateOfJoining(request.getDateOfJoining() != null ? request.getDateOfJoining() : LocalDate.now())
                .poolStatus("NOT_IN_RESOURCE_POOL")
                .workingHoursPerDay(request.getWorkingHoursPerDay() != null ? request.getWorkingHoursPerDay() : 8.0)
                .rmgManager(rmg)
                .createdBy(actor)
                .updatedBy(actor)
                .department(department)
                .location(location)
                .employmentStatus(request.getEmploymentStatus() != null ? request.getEmploymentStatus() : "ACTIVE")
                .allocationStatus(request.getAllocationStatus() != null ? request.getAllocationStatus() : "UNALLOCATED")
                .availabilityStatus(request.getAvailabilityStatus() != null ? request.getAvailabilityStatus() : "AVAILABLE")
                .build();

        Employee savedEmployee = employeeRepository.save(employee);
        log.info("Employee created successfully: {} (ID: {})", savedEmployee.getEmployeeId(), savedEmployee.getId());

        // Create User account with hashed password
        User user = User.builder()
                .email(request.getEmail())
                .employeeId(savedEmployee.getEmployeeId())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .build();
        User savedUser = userRepository.save(user);
        savedEmployee.setUser(savedUser);
        employeeRepository.save(savedEmployee);
        log.info("User account created for employee: {}", request.getEmployeeId());

        // A new, active, available and unallocated employee is on the bench from day one: enter the pool through
        // the same path every other pool entry uses, so the pool and bench-aging rows exist too.
        if (!manager) {
            resourcePoolService.enterIfEligible(savedEmployee, "MANUAL_ENTRY");
        }

        if (request.getOptionalRoleId() != null) {
            try {
                userRoleService.assignRoleToUser(savedUser.getId(), request.getOptionalRoleId(),
                        getCurrentUserId());
                log.info("Role assigned to new employee: {}", request.getOptionalRoleId());
            } catch (Exception e) {
                log.warn("Failed to assign role to employee {}: {}", savedEmployee.getId(), e.getMessage());
            }
        }

        if (targetProject != null) {
            assignManagerToProject(targetProject, savedEmployee);
        }
        sendWelcomeEmail(savedEmployee, request.getPassword(), request.getOptionalRoleId());

        return mapToDTO(savedEmployee);
    }

    /**
     * Emails the new employee their ID and temporary password with the sign-in link. A mail failure is logged and
     * does not undo the account: the admin can share the details another way.
     */
    private void sendWelcomeEmail(Employee employee, String temporaryPassword, Long roleId) {
        String roleLabel = roleId == null ? "a team member"
                : roleRepository.findById(roleId).map(r -> r.getName()).orElse("a team member");
        try {
            emailService.sendAccountCreated(employee.getEmail(), employee.getFirstName(), employee.getEmployeeId(),
                    temporaryPassword, roleLabel);
        } catch (RuntimeException e) {
            log.warn("Welcome email not sent to {} ({}): {}", employee.getEmployeeId(), employee.getEmail(), e.getMessage());
        }
    }

    /** The new manager is named to the project and asked to claim it; they become its manager once they claim it. */
    private void assignManagerToProject(com.rightFit.entity.Project project, Employee manager) {
        project.assignManager(manager);
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        projectRepository.save(project);
        notificationService.notify(manager, "PROJECT_ASSIGNED", "Claim your project: " + project.getProjectName(),
                "You have been named manager of " + project.getProjectId() + ". Open Projects to claim it.",
                "PROJECT", project.getProjectId());
    }

    public EmployeeDTO updateEmployee(String employeeId, UpdateEmployeeRequest request) {
        log.info("Updating employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        if (request.getFirstName() != null) {
            employee.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            employee.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            validateEmailUniquenessForEmployeeId(request.getEmail(), employeeId);
            employee.setEmail(request.getEmail());
        }
        if (request.getDesignation() != null) {
            employee.setDesignation(request.getDesignation());
        }
        if (request.getGrade() != null) {
            employee.setGrade(request.getGrade());
        }
        if (request.getDomain() != null) {
            employee.setDomain(request.getDomain());
        }
        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }
        if (request.getYearsOfExperience() != null) {
            employee.setYearsOfExperience(request.getYearsOfExperience());
        }
        if (request.getDateOfJoining() != null) {
            employee.setDateOfJoining(request.getDateOfJoining());
        }
        if (request.getWorkingHoursPerDay() != null) {
            employee.setWorkingHoursPerDay(request.getWorkingHoursPerDay());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found: " + request.getDepartmentId()));
            employee.setDepartment(department);
        }
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found: " + request.getLocationId()));
            employee.setLocation(location);
        }
        if (request.getRmgId() != null) {
            Long previousRmgId = employee.getRmgManager() != null ? employee.getRmgManager().getId() : null;
            if (!request.getRmgId().equals(previousRmgId)) {
                Employee newRmg = employeeRepository.findById(request.getRmgId())
                        .orElseThrow(() -> new RuntimeException("RMG not found: " + request.getRmgId()));
                employee.setRmgManager(newRmg);
                auditLogService.logAction(getCurrentUserId(), "RMG_CHANGED", "EMPLOYEE", employee.getId(),
                        previousRmgId, request.getRmgId(), "Updated via employee edit");
            }
        }
        if (request.getPoolStatus() != null) {
            employee.setPoolStatus(request.getPoolStatus());
        }
        if (request.getEmploymentStatus() != null) {
            employee.setEmploymentStatus(request.getEmploymentStatus());
        }
        if (request.getAllocationStatus() != null) {
            employee.setAllocationStatus(request.getAllocationStatus());
        }
        if (request.getAvailabilityStatus() != null) {
            employee.setAvailabilityStatus(request.getAvailabilityStatus());
        }
        if (request.getAvailableFromDate() != null) {
            employee.setAvailableFromDate(request.getAvailableFromDate());
        }

        employee.setUpdatedAt(LocalDateTime.now());
        employee.setUpdatedBy(actorLabel());
        Employee updated = employeeRepository.save(employee);
        log.info("Employee updated successfully: {}", employeeId);

        return mapToDTO(updated);
    }

    public EmployeeDTO changeRmg(String employeeId, ChangeRmgRequest request) {
        log.info("Changing RMG for employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", employeeId));

        Employee newRmg;
        if (request.getNewRmgEmployeeId() != null && !request.getNewRmgEmployeeId().isBlank()) {
            newRmg = employeeRepository.findByEmployeeId(request.getNewRmgEmployeeId())
                    .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", request.getNewRmgEmployeeId()));
        } else if (request.getNewRmgId() != null) {
            newRmg = employeeRepository.findById(request.getNewRmgId())
                    .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", String.valueOf(request.getNewRmgId())));
        } else {
            throw new com.rightFit.exception.BusinessRuleException("Either newRmgEmployeeId or newRmgId is required");
        }

        Long previousRmgId = employee.getRmgManager() != null ? employee.getRmgManager().getId() : null;
        employee.setRmgManager(newRmg);
        employee.setUpdatedAt(LocalDateTime.now());
        employee.setUpdatedBy(actorLabel());
        Employee updated = employeeRepository.save(employee);

        log.info("RMG changed for employee {} to {}", employeeId, newRmg.getEmployeeId());
        auditLogService.logAction(getCurrentUserId(), "RMG_CHANGED", "EMPLOYEE", employee.getId(),
                previousRmgId, newRmg.getId(), request.getReason());

        return mapToDTO(updated);
    }

    public EmployeeDTO deactivateEmployee(String employeeId, DeactivateEmployeeRequest request) {
        log.info("Deactivating employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        employee.setEmploymentStatus("INACTIVE");
        employee.setAvailabilityStatus("UNAVAILABLE");
        employee.setUpdatedAt(LocalDateTime.now());
        employee.setUpdatedBy(actorLabel());
        Employee updated = employeeRepository.save(employee);

        if (employee.getUser() != null) {
            userRoleService.deactivateUserRoles(employee.getUser().getId());
            // Deactivating an employee also switches off their sign-in, not just their roles.
            var account = employee.getUser();
            account.setStatus("INACTIVE");
            account.setBlockReason(AdminUserAccountService.EMPLOYEE_DEACTIVATED_PREFIX + request.getReason());
            account.setBlockedBy(actorLabel());
            account.setBlockedAt(LocalDateTime.now());
            userRepository.save(account);
            log.info("User roles deactivated and sign-in blocked for employee: {}", employeeId);
        }

        log.info("Employee deactivated successfully: {}", employeeId);
        auditLogService.logAction(getCurrentUserId(), "EMPLOYEE_DEACTIVATED", "EMPLOYEE", employee.getId(),
                null, "INACTIVE", request.getReason());

        employeeExitService.processExit(updated, accessGuard.currentEmployeeOrNull(), request.getReason());

        return mapToDTO(updated);
    }

    public EmployeeDTO reactivateEmployee(String employeeId, DeactivateEmployeeRequest request) {
        log.info("Reactivating employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        employee.setEmploymentStatus("ACTIVE");
        employee.setAvailabilityStatus("AVAILABLE");
        employee.setUpdatedAt(LocalDateTime.now());
        employee.setUpdatedBy(actorLabel());
        Employee updated = employeeRepository.save(employee);

        if (employee.getUser() != null) {
            userRoleService.reactivateUserRoles(employee.getUser().getId());
            // Only lift a block that came from the deactivation itself; an Admin's separate block stays in place.
            var account = employee.getUser();
            String reason = account.getBlockReason();
            if (reason != null && reason.startsWith(AdminUserAccountService.EMPLOYEE_DEACTIVATED_PREFIX)) {
                account.setStatus("ACTIVE");
                account.setBlockReason(null);
                account.setBlockedBy(null);
                account.setBlockedAt(null);
                userRepository.save(account);
            }
            log.info("User roles reactivated for employee: {}", employeeId);
        }

        log.info("Employee reactivated successfully: {}", employeeId);
        auditLogService.logAction(getCurrentUserId(), "EMPLOYEE_REACTIVATED", "EMPLOYEE", employee.getId(),
                null, "ACTIVE", request.getReason());

        return mapToDTO(updated);
    }

    /** Projects the employee manages and the ones they are allocated to right now (for the Admin profile view). */
    @Transactional(readOnly = true)
    public com.rightFit.dto.EmployeeProjectsDTO getEmployeeProjects(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", employeeId));

        var managing = projectRepository.findByManagerId(employee.getId()).stream()
                .map(p -> com.rightFit.dto.EmployeeProjectsDTO.ProjectRefDTO.builder()
                        .projectId(p.getProjectId())
                        .projectName(p.getProjectName())
                        .status(p.getStatus())
                        .clientName(p.getClientName())
                        .build())
                .toList();

        var managedIds = managing.stream().map(com.rightFit.dto.EmployeeProjectsDTO.ProjectRefDTO::getProjectId)
                .collect(java.util.stream.Collectors.toSet());

        // Everything they belong to: capacity allocations first (they carry hours), then plain team membership.
        // One entry per project; a project they manage is listed under "managing" only.
        java.util.Map<String, com.rightFit.dto.EmployeeProjectsDTO.AllocationRefDTO> byProject = new java.util.LinkedHashMap<>();
        for (var a : allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE")) {
            String pid = a.getProject().getProjectId();
            if (managedIds.contains(pid)) continue;
            byProject.put(pid, com.rightFit.dto.EmployeeProjectsDTO.AllocationRefDTO.builder()
                    .projectId(pid)
                    .projectName(a.getProject().getProjectName())
                    .projectStatus(a.getProject().getStatus())
                    .hoursPerDay(a.getHoursPerDay())
                    .startDate(a.getStartDate())
                    .endDate(a.getEndDate())
                    .build());
        }
        for (var m : projectMemberRepository.findActiveWithProjectByEmployeeId(employee.getId())) {
            String pid = m.getProject().getProjectId();
            if (managedIds.contains(pid)) continue;
            var existing = byProject.get(pid);
            if (existing != null) {
                if (existing.getRole() == null) existing.setRole(m.getRole());
                continue;
            }
            byProject.put(pid, com.rightFit.dto.EmployeeProjectsDTO.AllocationRefDTO.builder()
                    .projectId(pid)
                    .projectName(m.getProject().getProjectName())
                    .projectStatus(m.getProject().getStatus())
                    .role(m.getRole())
                    .startDate(m.getJoinedAt() != null ? m.getJoinedAt().toLocalDate() : null)
                    .build());
        }
        var allocations = new java.util.ArrayList<>(byProject.values());

        return com.rightFit.dto.EmployeeProjectsDTO.builder().managing(managing).allocations(allocations).build();
    }

    private static final java.util.List<String> SYSTEM_ROLE_CODES = java.util.List.of("ADMIN", "MANAGER", "RMG", "ASSOCIATE");

    /**
     * Changes an employee's main role (e.g. promotes an Associate to Manager). Replaces their current system role(s),
     * keeps any custom roles, and enforces what the new role needs:
     * - the last active Admin can't be demoted, and nobody changes their own role (no accidental lock-out);
     * - a Manager of live projects, or an RMG with people reporting to them, must hand those over first;
     * - the reporting line follows the role: a new RMG reports to an Admin, an Associate / Manager to an RMG, an Admin to nobody.
     */
    public EmployeeDTO changeRole(String employeeId, com.rightFit.dto.ChangeRoleRequest request) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", employeeId));
        User user = employee.getUser();
        if (user == null) {
            throw new com.rightFit.exception.BusinessRuleException("This employee has no sign-in account, so they can't hold a role");
        }
        var newRole = roleRepository.findById(request.getNewRoleId())
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Role", String.valueOf(request.getNewRoleId())));
        String newCode = newRole.getCode() == null ? "" : newRole.getCode().toUpperCase();
        if (!SYSTEM_ROLE_CODES.contains(newCode)) {
            throw new com.rightFit.exception.BusinessRuleException("Choose one of Admin, Manager, RMG or Associate");
        }

        var current = userRoleService.getUserRoles(user.getId());
        java.util.Set<String> currentCodes = current.stream()
                .map(ur -> ur.getRole().getCode() == null ? "" : ur.getRole().getCode().toUpperCase())
                .filter(SYSTEM_ROLE_CODES::contains)
                .collect(java.util.stream.Collectors.toSet());
        if (currentCodes.equals(java.util.Set.of(newCode))) {
            return mapToDTO(employee); // already exactly that role
        }

        Employee actor = accessGuard.currentEmployeeOrNull();
        if (actor != null && actor.getId().equals(employee.getId())) {
            throw new com.rightFit.exception.BusinessRuleException("You can't change your own role");
        }

        if (currentCodes.contains("ADMIN") && !newCode.equals("ADMIN")) {
            var adminRole = roleRepository.findByCode("ADMIN").orElseThrow();
            long activeAdmins = userRoleRepository.findByRoleIdAndActive(adminRole.getId()).stream()
                    .filter(ur -> "ACTIVE".equals(ur.getUser().getStatus()))
                    .count();
            if (activeAdmins <= 1) {
                throw new com.rightFit.exception.BusinessRuleException("This is the last active Admin — make someone else an Admin first");
            }
        }
        if (currentCodes.contains("MANAGER") && !newCode.equals("MANAGER")) {
            long live = projectRepository.findByManagerId(employee.getId()).stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus())).count();
            if (live > 0) {
                throw new com.rightFit.exception.BusinessRuleException("They manage " + live + " active project" + (live == 1 ? "" : "s")
                        + " — give those projects another manager before changing this role");
            }
        }
        if (currentCodes.contains("RMG") && !newCode.equals("RMG")) {
            long reports = employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", employee.getId());
            if (reports > 0) {
                throw new com.rightFit.exception.BusinessRuleException(reports + " active " + (reports == 1 ? "person reports" : "people report")
                        + " to them — assign those people to another RMG before changing this role");
            }
        }

        // The reporting line that goes with the new role.
        Employee reportsTo = null;
        if (!newCode.equals("ADMIN")) {
            String requiredCode = newCode.equals("RMG") ? "ADMIN" : "RMG";
            Employee currentLead = employee.getRmgManager();
            boolean currentLeadFits = currentLead != null && currentLead.getUser() != null
                    && userRoleService.getUserRoles(currentLead.getUser().getId()).stream()
                            .anyMatch(ur -> requiredCode.equalsIgnoreCase(ur.getRole().getCode()));
            String wanted = request.getReportsToEmployeeId();
            if (wanted != null && !wanted.isBlank()) {
                reportsTo = employeeRepository.findByEmployeeId(wanted.trim())
                        .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", wanted.trim()));
                final Employee lead = reportsTo;
                boolean hasRequired = lead.getUser() != null && userRoleService.getUserRoles(lead.getUser().getId()).stream()
                        .anyMatch(ur -> requiredCode.equalsIgnoreCase(ur.getRole().getCode()));
                if (!hasRequired || !"ACTIVE".equals(lead.getEmploymentStatus())) {
                    throw new com.rightFit.exception.BusinessRuleException("They need to report to an active "
                            + (requiredCode.equals("ADMIN") ? "Admin" : "RMG") + " — " + lead.getFirstName() + " " + lead.getLastName() + " isn't one");
                }
                if (lead.getId().equals(employee.getId())) {
                    throw new com.rightFit.exception.BusinessRuleException("Someone can't report to themselves");
                }
            } else if (currentLeadFits) {
                reportsTo = currentLead; // unchanged
            } else {
                throw new com.rightFit.exception.BusinessRuleException("Choose who they report to — an active "
                        + (requiredCode.equals("ADMIN") ? "Admin" : "RMG") + " is required for the " + newRole.getName() + " role");
            }
        }

        // Swap the system role(s); custom roles stay.
        for (var ur : current) {
            String code = ur.getRole().getCode() == null ? "" : ur.getRole().getCode().toUpperCase();
            if (SYSTEM_ROLE_CODES.contains(code) && !code.equals(newCode)) {
                userRoleRepository.deleteByUserIdAndRoleId(user.getId(), ur.getRole().getId());
            }
        }
        userRoleService.assignRoleToUser(user.getId(), newRole.getId(), getCurrentUserId());

        Long previousLeadId = employee.getRmgManager() != null ? employee.getRmgManager().getId() : null;
        employee.setRmgManager(reportsTo);
        employee.setUpdatedAt(LocalDateTime.now());
        employee.setUpdatedBy(actorLabel());
        Employee saved = employeeRepository.save(employee);

        auditLogService.logAction(getCurrentUserId(), "ROLE_CHANGED", "EMPLOYEE", employee.getId(),
                String.join(",", currentCodes), newCode, request.getReason());
        if (!java.util.Objects.equals(previousLeadId, reportsTo != null ? reportsTo.getId() : null)) {
            auditLogService.logAction(getCurrentUserId(), "RMG_CHANGED", "EMPLOYEE", employee.getId(),
                    previousLeadId, reportsTo != null ? reportsTo.getId() : null, "Reporting line changed with the role");
        }
        log.info("Role of {} changed {} -> {}", employeeId, currentCodes, newCode);
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployee(String employeeId) {
        log.debug("Fetching employee: {}", employeeId);
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new com.rightFit.exception.ResourceNotFoundException("Employee", employeeId));
        return mapToDTO(employee);
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getEmployees(String q, String employeeId, String firstName, String lastName,
                                           String email, String status, String designation,
                                           Long departmentId, Long locationId, Long rmgId, String role,
                                           String workforce, Pageable pageable) {
        log.debug("Searching employees with filters");
        String query = q == null || q.isBlank() ? null : q.trim();
        String roleCode = role == null || role.isBlank() ? null : role.trim().toUpperCase();
        String bucket = workforce == null || workforce.isBlank() ? null : workforce.trim().toUpperCase();
        // The workforce bucket is worked out from small id lookups, then applied as a plain "id in (...)" filter.
        int wfFilter = 0;
        java.util.Collection<Long> wfIds = java.util.List.of(-1L); // placeholder so the IN list is never empty
        if (bucket != null) {
            java.util.Set<Long> ids = workforceBucketService.idsIn(bucket);
            if (ids.isEmpty()) {
                return Page.empty(pageable);
            }
            wfFilter = 1;
            wfIds = ids;
        }
        Page<Employee> employees = employeeRepository.searchEmployees(
                query, employeeId, firstName, lastName, email, status, designation, departmentId, locationId, rmgId,
                roleCode, wfFilter, wfIds, pageable);

        // One query for every row's roles instead of one (or more) per employee.
        java.util.List<Long> userIds = employees.getContent().stream()
                .filter(e -> e.getUser() != null)
                .map(e -> e.getUser().getId())
                .toList();
        java.util.Map<Long, java.util.Set<String>> rolesByUser = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            for (Object[] row : userRoleRepository.findActiveRoleNamesByUserIds(userIds)) {
                rolesByUser.computeIfAbsent((Long) row[0], k -> new java.util.TreeSet<>()).add((String) row[1]);
            }
        }
        java.util.Set<Long> inProject = projectMembershipService.inActiveProjects(
                employees.getContent().stream().map(Employee::getId).toList());
        return employees.map(e -> {
            java.util.Set<String> roleNames = e.getUser() != null
                    ? rolesByUser.getOrDefault(e.getUser().getId(), java.util.Set.of()) : java.util.Set.of();
            return mapToDTO(e, roleNames, inProject.contains(e.getId()));
        });
    }

    private void validateEmployeeUniqueness(String employeeId, String email) {
        if (employeeRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new com.rightFit.exception.DuplicateEntityException("Employee", "employeeId", employeeId);
        }
        if (employeeRepository.findByEmail(email).isPresent()) {
            throw new com.rightFit.exception.DuplicateEntityException("Employee", "email", email);
        }
    }

    private void validateEmailUniquenessForEmployeeId(String email, String employeeId) {
        employeeRepository.findByEmail(email).ifPresent(emp -> {
            if (!emp.getEmployeeId().equals(employeeId)) {
                throw new com.rightFit.exception.DuplicateEntityException("Employee", "email", email);
            }
        });
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        java.util.Set<String> roles = employee.getUser() != null
                ? userRoleService.getUserRoles(employee.getUser().getId()).stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(java.util.stream.Collectors.toSet())
                : java.util.Set.of();
        return mapToDTO(employee, roles, projectMembershipService.inActiveProjects(java.util.List.of(employee.getId()))
                .contains(employee.getId()));
    }

    /** Admins and RMGs aren't allocated to projects (people report to them), so "in a project" doesn't apply. */
    private static Boolean effectiveInProject(java.util.Set<String> roles, boolean inProject) {
        java.util.Set<String> lower = roles.stream().map(String::toLowerCase).collect(java.util.stream.Collectors.toSet());
        boolean worker = lower.contains("manager") || lower.contains("associate");
        boolean leadership = lower.contains("admin") || lower.contains("rmg");
        return leadership && !worker ? null : inProject;
    }

    private EmployeeDTO mapToDTO(Employee employee, java.util.Set<String> roles, boolean inProject) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .grade(employee.getGrade())
                .designation(employee.getDesignation())
                .domain(employee.getDomain())
                .yearsOfExperience(employee.getYearsOfExperience())
                .dateOfJoining(employee.getDateOfJoining())
                .poolStatus(employee.getPoolStatus())
                .workingHoursPerDay(employee.getWorkingHoursPerDay())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .locationId(employee.getLocation() != null ? employee.getLocation().getId() : null)
                .locationName(employee.getLocation() != null ? employee.getLocation().getName() : null)
                .rmgId(employee.getRmgManager() != null ? employee.getRmgManager().getId() : null)
                .rmgName(employee.getRmgManager() != null ? employee.getRmgManager().getFirstName() + " " +
                        employee.getRmgManager().getLastName() : null)
                .rmgEmployeeId(employee.getRmgManager() != null ? employee.getRmgManager().getEmployeeId() : null)
                .employmentStatus(employee.getEmploymentStatus())
                .allocationStatus(employee.getAllocationStatus())
                .inProject(effectiveInProject(roles, inProject || "ALLOCATED".equals(employee.getAllocationStatus())))
                .availabilityStatus(employee.getAvailabilityStatus())
                .availableFromDate(employee.getAvailableFromDate())
                .userId(employee.getUser() != null ? employee.getUser().getId() : null)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .createdBy(employee.getCreatedBy())
                .updatedBy(employee.getUpdatedBy())
                .roles(roles)
                .build();
    }

    /** "Rajesh Kumar (EMP001)" for the signed-in admin; "System" when there is no employee profile. */
    private String actorLabel() {
        Employee me = accessGuard.currentEmployeeOrNull();
        return me == null ? "System" : me.getFirstName() + " " + me.getLastName() + " (" + me.getEmployeeId() + ")";
    }

    private Long getCurrentUserId() {
        return com.rightFit.security.SecurityContextUtil.getCurrentUserId();
    }
}
