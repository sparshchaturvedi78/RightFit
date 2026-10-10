package com.rightFit.service;

import com.rightFit.dto.AllocationDtos.AllocationRequestDTO;
import com.rightFit.dto.AllocationDtos.ReviewRequest;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RMG handoff for Manager Phase 9 (BRD 17): the RMG - not the Manager - makes the final allocation
 * approval or rejection. Kept deliberately small; RMG dashboards and pool governance belong to the RMG module.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AllocationApprovalService {

    private final AllocationRequestRepository requestRepository;
    private final AllocationRequestService requestService;
    private final AllocationService allocationService;
    private final CandidateWorkflowService workflow;
    private final ProjectRequirementRepository requirementRepository;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<AllocationRequestDTO> pending() {
        Employee rmg = currentRmg();
        return requestRepository.findByStatusOrderBySubmittedAtAsc("SUBMITTED").stream()
                .filter(r -> reviewsEmployee(rmg, r.getEmployee()))
                .map(requestService::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AllocationRequestDTO get(String requestId) {
        AllocationRequest request = requestService.find(requestId);
        if (!reviewsEmployee(currentRmg(), request.getEmployee())) {
            throw ProjectAccessDeniedException.notYours("This allocation request");
        }
        return requestService.toDTO(request);
    }

    public AllocationRequestDTO approve(String requestId, ReviewRequest review) {
        Employee rmg = currentRmg();
        AllocationRequest request = requestService.find(requestId);
        assertReviewable(rmg, request);

        CandidateApplication candidate = request.getCandidateApplication();
        ProjectRequirement requirement = request.getRequirement();
        Employee employee = request.getEmployee();
        if (!CandidateStatus.ALLOCATION_REQUESTED.equals(candidate.getStatus())) {
            throw new BusinessRuleException("The candidate is no longer at allocation-request stage (status "
                    + candidate.getStatus() + ")");
        }
        if (!"PUBLISHED".equals(requirement.getStatus())) {
            throw new BusinessRuleException("Requirement " + requirement.getRequirementId() + " is "
                    + requirement.getStatus() + " and can no longer be fulfilled");
        }
        if (!"ACTIVE".equals(employee.getEmploymentStatus()) || !"AVAILABLE".equals(employee.getAvailabilityStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not available for allocation");
        }

        // Capacity + project-conflict validation happens inside create()
        Allocation allocation = allocationService.create(employee, request.getProject(), requirement, request,
                request.getRequestedStartDate(), request.getRequestedEndDate(), request.getRequestedHoursPerDay(),
                rmg, requirement.getPositionTitle());

        request.setStatus("APPROVED");
        request.setReviewedBy(rmg);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewComments(review != null ? review.getComments() : null);
        requestRepository.save(request);

        workflow.transition(candidate, CandidateStatus.ALLOCATED, rmg, "Allocation " + allocation.getAllocationId());
        requirement.setStatus("ALLOCATED");
        requirementRepository.save(requirement);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_APPROVED", "ALLOCATION_REQUEST",
                request.getId(), "SUBMITTED", "APPROVED", requestId + " approved by " + rmg.getEmployeeId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_CREATED", "ALLOCATION",
                allocation.getId(), null, "ACTIVE",
                allocation.getAllocationId() + ": " + employee.getEmployeeId() + " -> "
                        + request.getProject().getProjectId());
        notificationService.notify(request.getSubmittedBy(), "ALLOCATION_APPROVED",
                "Allocation approved for " + CandidateWorkflowService.name(employee),
                requestId + " approved; " + requirement.getRequirementId() + " is now ALLOCATED.",
                "ALLOCATION_REQUEST", requestId);
        notificationService.notify(employee, "ALLOCATION_APPROVED",
                "You are allocated to " + request.getProject().getProjectName(),
                allocation.getHoursPerDay().stripTrailingZeros().toPlainString() + "h/day from "
                        + allocation.getStartDate(), "ALLOCATION", allocation.getAllocationId());
        return requestService.toDTO(request);
    }

    public AllocationRequestDTO reject(String requestId, String reason) {
        Employee rmg = currentRmg();
        AllocationRequest request = requestService.find(requestId);
        assertReviewable(rmg, request);

        request.setStatus("REJECTED");
        request.setReviewedBy(rmg);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(reason);
        requestRepository.save(request);

        CandidateApplication candidate = request.getCandidateApplication();
        if (CandidateStatus.ALLOCATION_REQUESTED.equals(candidate.getStatus())) {
            workflow.transition(candidate, CandidateStatus.SELECTED, rmg, "Allocation rejected: " + reason);
        }
        // FR-036: rejection returns the employee to Available (subject to other active states)
        allocationService.refreshEmployee(request.getEmployee(), "RELEASE");

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_REJECTED", "ALLOCATION_REQUEST",
                request.getId(), "SUBMITTED", "REJECTED", reason);
        notificationService.notify(request.getSubmittedBy(), "ALLOCATION_REJECTED",
                "Allocation rejected for " + CandidateWorkflowService.name(request.getEmployee()),
                reason, "ALLOCATION_REQUEST", requestId);
        return requestService.toDTO(request);
    }

    private void assertReviewable(Employee rmg, AllocationRequest request) {
        if (!reviewsEmployee(rmg, request.getEmployee())) {
            throw ProjectAccessDeniedException.notYours("This allocation request");
        }
        if (!"SUBMITTED".equals(request.getStatus())) {
            throw new BusinessRuleException("Allocation request " + request.getRequestId() + " is already "
                    + request.getStatus());
        }
    }

    /** The employee's assigned RMG reviews (BR-039); an employee with no RMG can be reviewed by any RMG. */
    private boolean reviewsEmployee(Employee rmg, Employee employee) {
        return employee.getRmgManager() == null || employee.getRmgManager().getId().equals(rmg.getId());
    }

    private Employee currentRmg() {
        if (!accessGuard.roleCodes().contains(RequirementAccessGuard.RMG)) {
            throw ProjectAccessDeniedException.notYours("Allocation review (RMG only)");
        }
        return accessGuard.currentEmployee();
    }
}
