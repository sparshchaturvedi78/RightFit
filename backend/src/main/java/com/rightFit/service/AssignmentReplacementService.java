package com.rightFit.service;

import com.rightFit.dto.AssignmentPreviewDTO;
import com.rightFit.dto.ReplaceManagerRequest;
import com.rightFit.dto.ReplaceRmgRequest;
import com.rightFit.dto.ReplacementResultDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.UserRole;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRepository;
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

    public AssignmentPreviewDTO getManagerAssignments(String departingManagerId) {
        log.info("Fetching manager assignments for preview: {}", departingManagerId);

        Employee manager = employeeRepository.findByEmployeeId(departingManagerId)
                .orElseThrow(() -> new RuntimeException("Manager not found: " + departingManagerId));

        List<Project> managedProjects = projectRepository.findByManagerId(manager.getId());

        return AssignmentPreviewDTO.builder()
                .departingId(manager.getId())
                .departingEmployeeId(manager.getEmployeeId())
                .departingName(manager.getFirstName() + " " + manager.getLastName())
                .departingRole(resolveActualRole(manager))
                .projects(new ArrayList<>())
                .projectCount(managedProjects.size())
                .ownedRequirementIds(new ArrayList<>())
                .ownedRequirementCount(0)
                .responsibilities(new ArrayList<>())
                .responsibilityCount(0)
                .message("Manager has " + managedProjects.size() + " projects assigned")
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
        log.info("Executing manager replacement - Departing: {}, New: {}", departingManagerId, request.getNewManagerId());

        try {
            Employee departingManager = employeeRepository.findByEmployeeId(departingManagerId)
                    .orElseThrow(() -> new RuntimeException("Departing manager not found: " + departingManagerId));

            Employee newManager = employeeRepository.findById(request.getNewManagerId())
                    .orElseThrow(() -> new RuntimeException("New manager not found: " + request.getNewManagerId()));

            Map<String, Integer> affectedCounts = new HashMap<>();
            int projectsTransferred = 0;
            int requirementsTransferred = 0;

            if (request.getSelectedProjectIds() != null && !request.getSelectedProjectIds().isEmpty()) {
                for (Long projectId : request.getSelectedProjectIds()) {
                    Project project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

                    project.setManager(newManager);
                    projectRepository.save(project);
                    projectsTransferred++;

                    auditLogService.logAction(getCurrentUserId(), "MANAGER_REPLACED_PROJECT", "PROJECT", projectId,
                            departingManager.getId(), request.getNewManagerId(), "Manager replacement");
                }
            }

            affectedCounts.put("projects", projectsTransferred);
            affectedCounts.put("requirements", requirementsTransferred);

            log.info("Manager replacement completed - Projects: {}, Requirements: {}", projectsTransferred, requirementsTransferred);

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
        log.info("Executing RMG replacement - Departing: {}, New: {}", departingRmgId, request.getNewRmgId());

        try {
            Employee departingRmg = employeeRepository.findByEmployeeId(departingRmgId)
                    .orElseThrow(() -> new RuntimeException("Departing RMG not found: " + departingRmgId));

            Employee newRmg = employeeRepository.findById(request.getNewRmgId())
                    .orElseThrow(() -> new RuntimeException("New RMG not found: " + request.getNewRmgId()));

            int employeesTransferred = 0;

            if (request.getSelectedEmployeeIds() != null && !request.getSelectedEmployeeIds().isEmpty()) {
                for (Long employeeId : request.getSelectedEmployeeIds()) {
                    Employee employee = employeeRepository.findById(employeeId)
                            .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

                    employee.setRmgManager(newRmg);
                    employeeRepository.save(employee);
                    employeesTransferred++;

                    auditLogService.logAction(getCurrentUserId(), "RMG_REPLACED_EMPLOYEE", "EMPLOYEE", employeeId,
                            departingRmg.getId(), request.getNewRmgId(), "RMG replacement");
                }
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
