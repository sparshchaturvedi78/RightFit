package com.rightFit.service;

import com.rightFit.dto.AssignmentPreviewDTO;
import com.rightFit.dto.ReplaceManagerRequest;
import com.rightFit.dto.ReplaceRmgRequest;
import com.rightFit.dto.ReplacementResultDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.UserRole;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.dto.ResponsibilityDTO;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.RequirementAssignment;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentReplacementService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogService auditLogService;
    private final UserRoleService userRoleService;
    private final ProjectManagementService projectManagementService;
    private final ProjectRequirementRepository requirementRepository;
    private final RequirementAssignmentRepository assignmentRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;

    public AssignmentPreviewDTO getManagerAssignments(String departingManagerId) {
        log.info("Fetching manager assignments for preview: {}", departingManagerId);

        Employee manager = employeeRepository.findByEmployeeId(departingManagerId)
                .orElseThrow(() -> new RuntimeException("Manager not found: " + departingManagerId));

        List<Project> managedProjects = projectRepository.findByManagerId(manager.getId());

        // Read-only derived view (BRD 6.3 / 32): requirement ownership follows Project.manager, so nothing
        // about a requirement is rewritten on replacement - createdByEmployee stays as historical authorship.
        List<ProjectRequirement> requirements = new ArrayList<>();
        List<Long> memberIds = new ArrayList<>();
        for (Project project : managedProjects) {
            requirements.addAll(requirementRepository.findByProjectId(project.getId()));
            projectMemberRepository.findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(project.getId()).forEach(m -> {
                if (!memberIds.contains(m.getEmployee().getId())) {
                    memberIds.add(m.getEmployee().getId());
                }
            });
        }

        List<ResponsibilityDTO> responsibilities = new ArrayList<>();
        for (ProjectRequirement requirement : requirements) {
            for (RequirementAssignment a : assignmentRepository.findByRequirementIdAndIsActiveTrue(requirement.getId())) {
                responsibilities.add(ResponsibilityDTO.builder()
                        .requirementId(requirement.getId())
                        .requirementTitle(requirement.getRequirementId() + " - " + requirement.getPositionTitle())
                        .responsibility(a.getResponsibilityType())
                        .currentOwnerId(a.getEmployee().getEmployeeId())
                        .build());
            }
        }
        for (RequirementAssignment a : assignmentRepository.findByEmployeeIdAndIsActiveTrue(manager.getId())) {
            if (requirements.stream().noneMatch(r -> r.getId().equals(a.getRequirement().getId()))) {
                responsibilities.add(ResponsibilityDTO.builder()
                        .requirementId(a.getRequirement().getId())
                        .requirementTitle(a.getRequirement().getRequirementId() + " - "
                                + a.getRequirement().getPositionTitle())
                        .responsibility(a.getResponsibilityType())
                        .currentOwnerId(manager.getEmployeeId())
                        .build());
            }
        }

        List<ProjectDTO> projects = managedProjects.stream().map(projectManagementService::mapToDTO).toList();
        return AssignmentPreviewDTO.builder()
                .departingId(manager.getId())
                .departingEmployeeId(manager.getEmployeeId())
                .departingName(manager.getFirstName() + " " + manager.getLastName())
                .departingRole(resolveActualRole(manager))
                .projects(projects)
                .projectCount(managedProjects.size())
                .ownedRequirementIds(requirements.stream().map(ProjectRequirement::getId).toList())
                .ownedRequirementCount(requirements.size())
                .responsibilities(responsibilities)
                .responsibilityCount(responsibilities.size())
                .employeeIds(memberIds)
                .employeeCount(memberIds.size())
                .message("Manager has " + managedProjects.size() + " projects, " + requirements.size()
                        + " requirements and " + memberIds.size() + " team members")
                .build();
    }

    public AssignmentPreviewDTO getRmgAssignments(String departingRmgId) {
        log.info("Fetching RMG assignments for preview: {}", departingRmgId);

        Employee rmg = employeeRepository.findByEmployeeId(departingRmgId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + departingRmgId));

        List<Employee> subordinates = employeeRepository.findByRmgManagerId(rmg.getId());

        List<Long> employeeIds = new ArrayList<>();
        subordinates.forEach(emp -> employeeIds.add(emp.getId()));

        return AssignmentPreviewDTO.builder()
                .departingId(rmg.getId())
                .departingEmployeeId(rmg.getEmployeeId())
                .departingName(rmg.getFirstName() + " " + rmg.getLastName())
                .departingRole(resolveActualRole(rmg))
                .employeeIds(employeeIds)
                .employeeCount(employeeIds.size())
                .message("RMG has " + employeeIds.size() + " employees assigned")
                .build();
    }

    /** Accepts either a legacy numeric id or a business Employee ID; at least one must resolve. */
    private Employee resolveEmployee(Long numericId, String employeeId, String businessFieldName, String numericFieldName) {
        if (employeeId != null && !employeeId.isBlank()) {
            return employeeRepository.findByEmployeeId(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        }
        if (numericId != null) {
            return employeeRepository.findById(numericId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", String.valueOf(numericId)));
        }
        throw new BusinessRuleException("Either " + businessFieldName + " or " + numericFieldName + " is required");
    }

    private List<Employee> resolveEmployees(List<Long> numericIds, List<String> employeeIds) {
        if (employeeIds != null && !employeeIds.isEmpty()) {
            return employeeIds.stream()
                    .map(id -> employeeRepository.findByEmployeeId(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Employee", id)))
                    .toList();
        }
        if (numericIds != null && !numericIds.isEmpty()) {
            return numericIds.stream()
                    .map(id -> employeeRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Employee", String.valueOf(id))))
                    .toList();
        }
        return List.of();
    }

    private List<Project> resolveProjects(List<Long> numericIds, List<String> projectIds) {
        if (projectIds != null && !projectIds.isEmpty()) {
            return projectIds.stream()
                    .map(id -> projectRepository.findByProjectId(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Project", id)))
                    .toList();
        }
        if (numericIds != null && !numericIds.isEmpty()) {
            return numericIds.stream()
                    .map(id -> projectRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Project", String.valueOf(id))))
                    .toList();
        }
        return List.of();
    }

    private String resolveActualRole(Employee employee) {
        if (employee.getUser() == null) {
            return null;
        }
        List<UserRole> roles = userRoleService.getUserRoles(employee.getUser().getId());
        if (roles.isEmpty()) {
            return null;
        }
        return roles.stream().map(ur -> ur.getRole().getName()).collect(Collectors.joining(", "));
    }

    @Transactional
    public ReplacementResultDTO replaceManager(String departingManagerId, ReplaceManagerRequest request) {
        log.info("Executing manager replacement - Departing: {}, New: {}", departingManagerId,
                request.getNewManagerEmployeeId() != null ? request.getNewManagerEmployeeId() : request.getNewManagerId());

        try {
            Employee departingManager = employeeRepository.findByEmployeeId(departingManagerId)
                    .orElseThrow(() -> new RuntimeException("Departing manager not found: " + departingManagerId));

            Employee newManager = resolveEmployee(request.getNewManagerId(), request.getNewManagerEmployeeId(),
                    "newManagerEmployeeId", "newManagerId");

            Map<String, Integer> affectedCounts = new HashMap<>();
            int projectsTransferred = 0;
            int requirementsUnderNewManager = 0;

            List<Project> targetProjects = resolveProjects(request.getSelectedProjectIds(),
                    request.getSelectedProjectBusinessIds());
            for (Project project : targetProjects) {
                project.assignManager(newManager);
                projectRepository.save(project);
                projectsTransferred++;
                int visibleRequirements = requirementRepository.findByProjectId(project.getId()).size();
                requirementsUnderNewManager += visibleRequirements;

                auditLogService.logAction(getCurrentUserId(), "MANAGER_REPLACED_PROJECT", "PROJECT", project.getId(),
                        departingManager.getId(), newManager.getId(),
                        "Manager replacement; " + visibleRequirements
                                + " requirements now under the new Manager (createdBy unchanged)");
                notificationService.notify(newManager, "PROJECT_ASSIGNED",
                        "You were assigned project " + project.getProjectName(),
                        "Claim the project to start working on its requirements.", "PROJECT", project.getProjectId());
            }

            affectedCounts.put("projects", projectsTransferred);
            affectedCounts.put("requirementsUnderNewManager", requirementsUnderNewManager);

            log.info("Manager replacement completed - Projects: {}, Requirements now under new manager: {}", projectsTransferred, requirementsUnderNewManager);

            return ReplacementResultDTO.builder()
                    .success(true)
                    .message("Manager replacement completed successfully")
                    .affectedCounts(affectedCounts)
                    .build();
        } catch (Exception e) {
            log.error("Manager replacement failed: {}", e.getMessage());
            return ReplacementResultDTO.builder()
                    .success(false)
                    .error("Manager replacement failed: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ReplacementResultDTO replaceRmg(String departingRmgId, ReplaceRmgRequest request) {
        log.info("Executing RMG replacement - Departing: {}, New: {}", departingRmgId,
                request.getNewRmgEmployeeId() != null ? request.getNewRmgEmployeeId() : request.getNewRmgId());

        try {
            Employee departingRmg = employeeRepository.findByEmployeeId(departingRmgId)
                    .orElseThrow(() -> new RuntimeException("Departing RMG not found: " + departingRmgId));

            Employee newRmg = resolveEmployee(request.getNewRmgId(), request.getNewRmgEmployeeId(),
                    "newRmgEmployeeId", "newRmgId");

            int employeesTransferred = 0;

            for (Employee employee : resolveEmployees(request.getSelectedEmployeeIds(),
                    request.getSelectedEmployeeBusinessIds())) {
                employee.setRmgManager(newRmg);
                employeeRepository.save(employee);
                employeesTransferred++;

                auditLogService.logAction(getCurrentUserId(), "RMG_REPLACED_EMPLOYEE", "EMPLOYEE", employee.getId(),
                        departingRmg.getId(), newRmg.getId(), "RMG replacement");
            }

            Map<String, Integer> affectedCounts = new HashMap<>();
            affectedCounts.put("employees", employeesTransferred);

            log.info("RMG replacement completed - Employees: {}", employeesTransferred);

            return ReplacementResultDTO.builder()
                    .success(true)
                    .message("RMG replacement completed successfully")
                    .affectedCounts(affectedCounts)
                    .build();
        } catch (Exception e) {
            log.error("RMG replacement failed: {}", e.getMessage());
            return ReplacementResultDTO.builder()
                    .success(false)
                    .error("RMG replacement failed: " + e.getMessage())
                    .build();
        }
    }

    private Long getCurrentUserId() {
        return com.rightFit.security.SecurityContextUtil.getCurrentUserId();
    }
}
