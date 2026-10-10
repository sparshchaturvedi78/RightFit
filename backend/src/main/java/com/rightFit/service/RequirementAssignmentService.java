package com.rightFit.service;

import com.rightFit.dto.AssignResponsibilityRequest;
import com.rightFit.dto.RequirementAssignmentDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.RequirementAssignment;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RequirementAssignmentService {

    private static final Set<String> RESPONSIBILITY_TYPES = Set.of(
            RequirementAssignment.SOURCER, RequirementAssignment.INTERVIEWER, RequirementAssignment.COORDINATOR);

    private final RequirementAssignmentRepository assignmentRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final EmployeeRepository employeeRepository;
    private final RequirementAccessGuard accessGuard;
    private final AuditLogService auditLogService;

    public RequirementAssignmentDTO assignResponsibility(String requirementId, AssignResponsibilityRequest request) {
        ProjectRequirement requirement = loadOwned(requirementId);

        if ("CLOSED".equals(requirement.getStatus()) || "CANCELLED".equals(requirement.getStatus())) {
            throw new BusinessRuleException(
                    "Cannot assign responsibilities on a " + requirement.getStatus() + " requirement");
        }

        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));
        if (!"ACTIVE".equals(employee.getEmploymentStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not active");
        }

        String type = request.getResponsibilityType();
        if (accessGuard.isAdminAccount(employee)) {
            throw new BusinessRuleException("Admin accounts do not take part in candidate selection, so "
                    + employee.getEmployeeId() + " cannot be assigned as " + type);
        }
        if (accessGuard.isRmgOnlyAccount(employee)) {
            throw new BusinessRuleException("RMG cannot participate in shortlisting, coordinating or interviewing, so "
                    + employee.getEmployeeId() + " cannot be assigned as " + type);
        }
        if (assignmentRepository.existsByRequirementIdAndEmployeeIdAndResponsibilityTypeAndIsActiveTrue(
                requirement.getId(), employee.getId(), type)) {
            throw duplicate(employee, type);
        }

        RequirementAssignment saved;
        try {
            saved = assignmentRepository.saveAndFlush(RequirementAssignment.builder()
                    .requirement(requirement)
                    .employee(employee)
                    .responsibilityType(type)
                    .assignedBy(SecurityContextUtil.getCurrentUserId())
                    .build());
        } catch (DataIntegrityViolationException e) {
            throw duplicate(employee, type);
        }

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "REQUIREMENT_RESPONSIBILITY_ASSIGNED",
                "REQUIREMENT", requirement.getId(), null,
                Map.of("employeeId", employee.getEmployeeId(), "responsibilityType", type),
                type + " assigned to " + employee.getEmployeeId() + " on " + requirementId);
        log.info("{} assigned to {} on {}", type, employee.getEmployeeId(), requirementId);

        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<RequirementAssignmentDTO> listAssignments(String requirementId, String responsibilityType) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        accessGuard.assertCanReadRequirement(requirement);

        List<RequirementAssignment> assignments;
        if (responsibilityType == null || responsibilityType.isBlank()) {
            assignments = assignmentRepository.findByRequirementIdAndIsActiveTrue(requirement.getId());
        } else {
            String type = responsibilityType.toUpperCase();
            if (!RESPONSIBILITY_TYPES.contains(type)) {
                throw new BusinessRuleException("Responsibility type must be SOURCER, INTERVIEWER or COORDINATOR");
            }
            assignments = assignmentRepository
                    .findByRequirementIdAndResponsibilityTypeAndIsActiveTrue(requirement.getId(), type);
        }
        return assignments.stream().map(this::mapToDTO).toList();
    }

    /**
     * Remove an employee's responsibilities from the requirement. Without responsibilityType every active
     * responsibility of that employee is removed; with it, only that one. Returns the updated assignment list.
     */
    public List<RequirementAssignmentDTO> removeResponsibility(String requirementId, String employeeId,
                                                               String responsibilityType) {
        ProjectRequirement requirement = loadOwned(requirementId);

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        String type = null;
        if (responsibilityType != null && !responsibilityType.isBlank()) {
            type = responsibilityType.toUpperCase();
            if (!RESPONSIBILITY_TYPES.contains(type)) {
                throw new BusinessRuleException("Responsibility type must be SOURCER, INTERVIEWER or COORDINATOR");
            }
        }
        final String filterType = type;
        List<RequirementAssignment> held = assignmentRepository
                .findByRequirementIdAndEmployeeIdAndIsActiveTrue(requirement.getId(), employee.getId()).stream()
                .filter(a -> filterType == null || filterType.equals(a.getResponsibilityType()))
                .toList();
        if (held.isEmpty()) {
            throw new ResourceNotFoundException("Responsibility",
                    employeeId + (filterType != null ? " (" + filterType + ")" : "") + " on " + requirementId
                            + " - the employee is not in this requirement's assigned team");
        }

        for (RequirementAssignment assignment : held) {
            assignment.setIsActive(false);
            assignmentRepository.save(assignment);
            auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "REQUIREMENT_RESPONSIBILITY_REMOVED",
                    "REQUIREMENT", requirement.getId(),
                    Map.of("employeeId", employee.getEmployeeId(),
                            "responsibilityType", assignment.getResponsibilityType()),
                    null,
                    assignment.getResponsibilityType() + " removed from " + employee.getEmployeeId()
                            + " on " + requirementId);
        }
        return assignmentRepository.findByRequirementIdAndIsActiveTrue(requirement.getId()).stream()
                .map(this::mapToDTO).toList();
    }

    private ProjectRequirement loadOwned(String requirementId) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        accessGuard.assertOwnsProjectOrAdmin(requirement.getProject());
        return requirement;
    }

    private DuplicateEntityException duplicate(Employee employee, String type) {
        return new DuplicateEntityException("Employee " + employee.getEmployeeId()
                + " already holds an active " + type + " assignment on this requirement");
    }

    private RequirementAssignmentDTO mapToDTO(RequirementAssignment a) {
        Employee employee = a.getEmployee();
        return RequirementAssignmentDTO.builder()
                .id(a.getId())
                .requirementId(a.getRequirement().getRequirementId())
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .responsibilityType(a.getResponsibilityType())
                .assignedAt(a.getAssignedAt())
                .assignedBy(a.getAssignedBy())
                .isActive(a.getIsActive())
                .build();
    }
}
