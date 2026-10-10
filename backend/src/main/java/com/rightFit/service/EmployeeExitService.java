package com.rightFit.service;

import com.rightFit.entity.Allocation;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Employee Company Exit cascade (BRD §31 / BR-045..047): end active allocations, leave the
 * Resource Pool for good (no automatic re-entry, unlike a normal release), cancel open interviews
 * and invitations, and withdraw open candidacies. Historical records (allocations, candidate
 * history, audit log) are never deleted - only their live/open state is closed out. Disabling the
 * employee's login access is handled by the caller (EmployeeManagementService), not here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeExitService {

    private final AllocationRepository allocationRepository;
    private final AllocationRequestRepository allocationRequestRepository;
    private final CandidateApplicationRepository candidateApplicationRepository;
    private final EmployeeRepository employeeRepository;
    private final AllocationService allocationService;
    private final ResourcePoolService resourcePoolService;
    private final CandidateWorkflowService workflow;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public String processExit(Employee employee, Employee actor, String reason) {
        String cascadeReason = "Employee exited the company: " + reason;
        // Allocation.endReason is varchar(50); the full cascadeReason (used everywhere else below,
        // in TEXT columns) can easily run longer than that, so this one call site gets a capped copy.
        String endReason = cascadeReason.length() > 50 ? cascadeReason.substring(0, 50) : cascadeReason;
        int allocationsEnded = 0;
        for (Allocation allocation : allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE")) {
            Project project = allocation.getProject();
            allocationService.end(allocation, LocalDate.now(), endReason, actor, false);
            notificationService.notify(project.getManager(), "EMPLOYEE_EXIT",
                    employee.getFirstName() + " " + employee.getLastName() + " has exited the company",
                    "Their allocation on " + project.getProjectName() + " ended. " + reason,
                    "EMPLOYEE", employee.getEmployeeId());
            allocationsEnded++;
        }

        int requestsCancelled = 0;
        for (AllocationRequest request : allocationRequestRepository.findByEmployeeIdAndStatus(employee.getId(), "SUBMITTED")) {
            request.setStatus("CANCELLED");
            request.setReviewComments(cascadeReason);
            allocationRequestRepository.save(request);
            requestsCancelled++;
        }

        int withdrawn = 0;
        for (CandidateApplication candidate : candidateApplicationRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId())) {
            if (CandidateStatus.TERMINAL.contains(candidate.getStatus())) {
                continue;
            }
            workflow.cancelOpenItems(candidate, cascadeReason);
            workflow.forceTransition(candidate, CandidateStatus.WITHDRAWN, actor, cascadeReason);
            withdrawn++;
        }

        resourcePoolService.exit(employee, "COMPANY_EXIT");
        employee.setAllocationStatus("UNALLOCATED");
        // A stale return date must not outlive the employee's exit - the Associate phase's availability
        // restoration job would otherwise eventually match this row and incorrectly restore an exited employee.
        employee.setAvailableFromDate(null);
        employeeRepository.save(employee);

        String summary = "Employee exit cascade for " + employee.getEmployeeId() + ": " + allocationsEnded
                + " allocations ended, " + requestsCancelled + " allocation requests cancelled, " + withdrawn
                + " candidate pipelines withdrawn, removed from Resource Pool";
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_EXIT_CASCADE", "EMPLOYEE",
                employee.getId(), null, null, summary);
        log.info(summary);
        return summary;
    }
}
