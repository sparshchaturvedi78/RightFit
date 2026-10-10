package com.rightFit.service;

import com.rightFit.dto.AllocationDtos.AllocationRequestDTO;
import com.rightFit.dto.AllocationDtos.CreateAllocationRequestRequest;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Manager Phase 9. The Manager REQUESTS allocation; the RMG approves or rejects (BR-025 vs BR-026).
 * Reservation begins here: employee accepted + Manager request (BR-023/024).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AllocationRequestService {

    private final AllocationRequestRepository requestRepository;
    private final CandidateWorkflowService workflow;
    private final AllocationService allocationService;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AllocationRequestDTO create(String applicationId, CreateAllocationRequestRequest request) {
        CandidateApplication candidate = workflow.find(applicationId);
        ProjectRequirement requirement = candidate.getRequirement();
        // Request allocation: Manager Yes, Admin No (BRD 39).
        accessGuard.assertOwnsProject(requirement.getProject());
        accessGuard.assertRequirementOpen(requirement);

        if (!CandidateStatus.SELECTED.equals(candidate.getStatus())) {
            throw new BusinessRuleException("Only a SELECTED candidate can be put forward for allocation (status "
                    + candidate.getStatus() + ")");
        }
        if (candidate.getConfirmedAt() == null) {
            throw new BusinessRuleException("The employee must accept the opportunity before an allocation request "
                    + "can be submitted");
        }
        Employee employee = candidate.getEmployee();
        if (!"ACTIVE".equals(employee.getEmploymentStatus()) || !"AVAILABLE".equals(employee.getAvailabilityStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not available for allocation");
        }
        if (!requestRepository.findByEmployeeIdAndStatus(employee.getId(), "SUBMITTED").isEmpty()) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId()
                    + " already has an allocation request awaiting RMG review");
        }

        LocalDate start = request.getStartDate() != null ? request.getStartDate()
                : requirement.getAllocationStartDate() != null ? requirement.getAllocationStartDate() : LocalDate.now();
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : requirement.getAllocationEndDate();
        if (end != null && end.isBefore(start)) {
            throw new BusinessRuleException("Allocation end date must not be before the start date");
        }
        if (employee.getAvailableFromDate() != null && start.isBefore(employee.getAvailableFromDate())) {
            throw new BusinessRuleException("Employee is only available from " + employee.getAvailableFromDate());
        }
        BigDecimal hours = request.getHoursPerDay();
        allocationService.assertCapacity(employee, start, end, hours, null);

        Employee manager = accessGuard.currentEmployee();
        AllocationRequest saved = requestRepository.save(AllocationRequest.builder()
                .requestId("ALR-" + requestRepository.nextRequestSequence())
                .candidateApplication(candidate)
                .employee(employee)
                .project(requirement.getProject())
                .requirement(requirement)
                .submittedBy(manager)
                .requestedStartDate(start)
                .requestedEndDate(end)
                .requestedHoursPerDay(hours)
                .status("SUBMITTED")
                .build());

        workflow.transition(candidate, CandidateStatus.ALLOCATION_REQUESTED, manager,
                "Allocation request " + saved.getRequestId());
        allocationService.refreshEmployee(employee, "RELEASE");

        notificationService.notifyRmgOf(employee, "ALLOCATION_REQUESTED",
                "Allocation request for " + CandidateWorkflowService.name(employee),
                requirement.getProject().getProjectName() + " / " + requirement.getRequirementId() + ": "
                        + hours.stripTrailingZeros().toPlainString() + "h/day from " + start,
                "ALLOCATION_REQUEST", saved.getRequestId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_REQUESTED", "ALLOCATION_REQUEST",
                saved.getId(), null, "SUBMITTED",
                saved.getRequestId() + " for " + employee.getEmployeeId() + " on " + requirement.getRequirementId());
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AllocationRequestDTO> list() {
        List<AllocationRequest> requests = accessGuard.isAdmin()
                ? requestRepository.findAll().stream()
                        .sorted(Comparator.comparing(AllocationRequest::getSubmittedAt).reversed()).toList()
                : requestRepository.findByProjectManager(accessGuard.currentEmployee().getId());
        return requests.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AllocationRequestDTO get(String requestId) {
        AllocationRequest request = find(requestId);
        accessGuard.assertOwnsProjectOrAdmin(request.getProject());
        return toDTO(request);
    }

    public AllocationRequestDTO cancel(String requestId, String reason) {
        AllocationRequest request = find(requestId);
        accessGuard.assertOwnsProject(request.getProject());
        if (!"SUBMITTED".equals(request.getStatus())) {
            throw new BusinessRuleException("Only a SUBMITTED allocation request can be cancelled (status "
                    + request.getStatus() + ")");
        }
        request.setStatus("CANCELLED");
        request.setReviewComments(reason);
        requestRepository.save(request);

        CandidateApplication candidate = request.getCandidateApplication();
        if (CandidateStatus.ALLOCATION_REQUESTED.equals(candidate.getStatus())) {
            workflow.transition(candidate, CandidateStatus.SELECTED, accessGuard.currentEmployee(),
                    "Allocation request cancelled: " + reason);
        }
        allocationService.refreshEmployee(request.getEmployee(), "RELEASE");
        notificationService.notifyRmgOf(request.getEmployee(), "ALLOCATION_CANCELLED",
                "Allocation request " + requestId + " cancelled", reason, "ALLOCATION_REQUEST", requestId);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_REQUEST_CANCELLED",
                "ALLOCATION_REQUEST", request.getId(), "SUBMITTED", "CANCELLED", reason);
        return toDTO(request);
    }

    AllocationRequest find(String requestId) {
        return requestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AllocationRequest", requestId));
    }

    AllocationRequestDTO toDTO(AllocationRequest r) {
        Employee e = r.getEmployee();
        BigDecimal allocated = allocationService.activeFor(e).stream()
                .map(a -> a.getHoursPerDay()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return AllocationRequestDTO.builder()
                .id(r.getId())
                .requestId(r.getRequestId())
                .applicationId(r.getCandidateApplication().getApplicationId())
                .requirementId(r.getRequirement().getRequirementId())
                .projectId(r.getProject().getProjectId())
                .projectName(r.getProject().getProjectName())
                .employeeId(e.getEmployeeId())
                .employeeName(CandidateWorkflowService.name(e))
                .submittedByName(CandidateWorkflowService.name(r.getSubmittedBy()))
                .requestedStartDate(r.getRequestedStartDate())
                .requestedEndDate(r.getRequestedEndDate())
                .requestedHoursPerDay(r.getRequestedHoursPerDay())
                .status(r.getStatus())
                .submittedAt(r.getSubmittedAt())
                .reviewedByName(CandidateWorkflowService.name(r.getReviewedBy()))
                .reviewedAt(r.getReviewedAt())
                .reviewComments(r.getReviewComments())
                .rejectionReason(r.getRejectionReason())
                .employeeWorkingHoursPerDay(allocationService.capacityOf(e))
                .employeeAllocatedHoursPerDay(allocated)
                .build();
    }
}
