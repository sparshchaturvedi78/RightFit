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

    @Auditable(action = "CREATE", entityType = "EMPLOYEE", entityIdParamName = "result.id")
    public EmployeeDTO createEmployee(CreateEmployeeRequest request) {
        log.info("Creating employee: {}", request.getEmployeeId());

        validateEmployeeUniqueness(request.getEmployeeId(), request.getEmail());

        Employee rmg = employeeRepository.findById(request.getRmgId())
                .orElseThrow(() -> new RuntimeException("RMG not found: " + request.getRmgId()));

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
                .poolStatus("IN_POOL")
                .workingHoursPerDay(request.getWorkingHoursPerDay() != null ? request.getWorkingHoursPerDay() : 8.0)
                .rmgManager(rmg)
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

        if (request.getOptionalRoleId() != null) {
            try {
                userRoleService.assignRoleToUser(savedUser.getId(), request.getOptionalRoleId(),
                        getCurrentUserId());
                log.info("Role assigned to new employee: {}", request.getOptionalRoleId());
            } catch (Exception e) {
                log.warn("Failed to assign role to employee {}: {}", savedEmployee.getId(), e.getMessage());
            }
        }

        return mapToDTO(savedEmployee);
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
        Employee updated = employeeRepository.save(employee);
        log.info("Employee updated successfully: {}", employeeId);

        return mapToDTO(updated);
    }

    public EmployeeDTO changeRmg(String employeeId, ChangeRmgRequest request) {
        log.info("Changing RMG for employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        Employee newRmg = employeeRepository.findById(request.getNewRmgId())
                .orElseThrow(() -> new RuntimeException("New RMG not found: " + request.getNewRmgId()));

        Long previousRmgId = employee.getRmgManager() != null ? employee.getRmgManager().getId() : null;
        employee.setRmgManager(newRmg);
        employee.setUpdatedAt(LocalDateTime.now());
        Employee updated = employeeRepository.save(employee);

        log.info("RMG changed for employee {} to {}", employeeId, request.getNewRmgId());
        auditLogService.logAction(getCurrentUserId(), "RMG_CHANGED", "EMPLOYEE", employee.getId(),
                previousRmgId, request.getNewRmgId(), request.getReason());

        return mapToDTO(updated);
    }

    public EmployeeDTO deactivateEmployee(String employeeId, DeactivateEmployeeRequest request) {
        log.info("Deactivating employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        employee.setEmploymentStatus("INACTIVE");
        employee.setAvailabilityStatus("UNAVAILABLE");
        employee.setUpdatedAt(LocalDateTime.now());
        Employee updated = employeeRepository.save(employee);

        if (employee.getUser() != null) {
            userRoleService.deactivateUserRoles(employee.getUser().getId());
            log.info("User roles deactivated for employee: {}", employeeId);
        }

        log.info("Employee deactivated successfully: {}", employeeId);
        auditLogService.logAction(getCurrentUserId(), "EMPLOYEE_DEACTIVATED", "EMPLOYEE", employee.getId(),
                null, "INACTIVE", request.getReason());

        return mapToDTO(updated);
    }

    public EmployeeDTO reactivateEmployee(String employeeId, DeactivateEmployeeRequest request) {
        log.info("Reactivating employee: {}", employeeId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        employee.setEmploymentStatus("ACTIVE");
        employee.setAvailabilityStatus("AVAILABLE");
        employee.setUpdatedAt(LocalDateTime.now());
        Employee updated = employeeRepository.save(employee);

        if (employee.getUser() != null) {
            userRoleService.reactivateUserRoles(employee.getUser().getId());
            log.info("User roles reactivated for employee: {}", employeeId);
        }

        log.info("Employee reactivated successfully: {}", employeeId);
        auditLogService.logAction(getCurrentUserId(), "EMPLOYEE_REACTIVATED", "EMPLOYEE", employee.getId(),
                null, "ACTIVE", request.getReason());

        return mapToDTO(updated);
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployee(String employeeId) {
        log.debug("Fetching employee: {}", employeeId);
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
        return mapToDTO(employee);
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getEmployees(String employeeId, String firstName, String lastName,
                                           String email, String status, String designation,
                                           Long departmentId, Long rmgId, Pageable pageable) {
        log.debug("Searching employees with filters");
        Page<Employee> employees = employeeRepository.searchEmployees(
                employeeId, firstName, lastName, email, status, designation, departmentId, rmgId, pageable);
        return employees.map(this::mapToDTO);
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
                .employmentStatus(employee.getEmploymentStatus())
                .allocationStatus(employee.getAllocationStatus())
                .availabilityStatus(employee.getAvailabilityStatus())
                .availableFromDate(employee.getAvailableFromDate())
                .userId(employee.getUser() != null ? employee.getUser().getId() : null)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .createdBy(employee.getCreatedBy())
                .updatedBy(employee.getUpdatedBy())
                .roles(employee.getUser() != null
                        ? userRoleService.getUserRoles(employee.getUser().getId()).stream()
                            .map(ur -> ur.getRole().getName())
                            .collect(java.util.stream.Collectors.toSet())
                        : java.util.Set.of())
                .build();
    }

    private Long getCurrentUserId() {
        return com.rightFit.security.SecurityContextUtil.getCurrentUserId();
    }
}
