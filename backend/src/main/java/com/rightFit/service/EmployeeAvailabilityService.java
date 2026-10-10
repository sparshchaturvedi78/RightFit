package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.EmployeeAvailabilityDTO;
import com.rightFit.dto.AssociateProfileDtos.RequestUnavailabilityRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.EmployeeAvailability;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.BenchHistoryRepository;
import com.rightFit.repository.EmployeeAvailabilityRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Associate Phase: temporary unavailability, RMG-verified (BRD 21). Only one date is ever requested
 * - the expected return date; approval always takes effect immediately (no future-dated start - see
 * ASSOCIATE_PHASE_IMPLEMENTATION_PLAN.md §5). Coming back is date-driven (AvailabilityRestorationJob)
 * with an explicit early-return escape hatch; both share restore(), the one place this logic lives.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeAvailabilityService {

    private final EmployeeAvailabilityRepository availabilityRepository;
    private final EmployeeRepository employeeRepository;
    private final BenchHistoryRepository benchHistoryRepository;
    private final ResourcePoolService resourcePoolService;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EmployeeAvailabilityDTO> myHistory() {
        Employee employee = accessGuard.currentEmployee();
        return availabilityRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId()).stream()
                .map(this::toDTO).toList();
    }

    public EmployeeAvailabilityDTO requestUnavailability(RequestUnavailabilityRequest request) {
        Employee employee = accessGuard.currentEmployee();
        if (availabilityRepository.existsByEmployeeIdAndVerificationStatus(employee.getId(), "PENDING")) {
            throw new BusinessRuleException("You already have a pending unavailability request");
        }

        EmployeeAvailability saved = availabilityRepository.save(EmployeeAvailability.builder()
                .employee(employee)
                .availabilityStatus("UNAVAILABLE")
                .availableFrom(request.getExpectedReturnDate())
                .reason(request.getReason())
                .verificationStatus("PENDING")
                .build());

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "AVAILABILITY_REQUESTED",
                "EMPLOYEE_AVAILABILITY", saved.getId(), null, null,
                employee.getEmployeeId() + " requested unavailability until " + request.getExpectedReturnDate());
        notificationService.notify(employee.getRmgManager(), "AVAILABILITY_REQUESTED",
                "Unavailability request from " + CandidateWorkflowService.name(employee),
                "Expected back " + request.getExpectedReturnDate() + ". " + request.getReason(),
                "EMPLOYEE_AVAILABILITY", String.valueOf(saved.getId()));
        return toDTO(saved);
    }

    public EmployeeAvailabilityDTO cancelMine(Long id) {
        Employee employee = accessGuard.currentEmployee();
        EmployeeAvailability request = availabilityRepository.findByIdAndEmployeeId(id, employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeAvailability", String.valueOf(id)));
        if (!"PENDING".equals(request.getVerificationStatus())) {
            throw new BusinessRuleException("Only a pending request can be cancelled (this one is "
                    + request.getVerificationStatus() + ")");
        }
        request.setVerificationStatus("CANCELLED");
        EmployeeAvailability saved = availabilityRepository.save(request);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "AVAILABILITY_REQUEST_CANCELLED",
                "EMPLOYEE_AVAILABILITY", saved.getId(), "PENDING", "CANCELLED",
                employee.getEmployeeId() + " withdrew their own unavailability request");
        return toDTO(saved);
    }

    public EmployeeAvailabilityDTO approve(Long id) {
        Employee rmg = currentRmg();
        EmployeeAvailability request = findReviewable(rmg, id);

        Employee employee = request.getEmployee();
        employee.setAvailabilityStatus("UNAVAILABLE");
        employee.setAvailableFromDate(request.getAvailableFrom());
        employeeRepository.save(employee);

        if ("IN_RESOURCE_POOL".equals(employee.getPoolStatus())) {
            resourcePoolService.exitForUnavailability(employee);
        }
        benchHistoryRepository.findByEmployeeIdAndIsCurrentTrue(employee.getId()).ifPresent(bench -> {
            bench.setPauseStartedAt(LocalDateTime.now());
            benchHistoryRepository.save(bench);
        });

        request.setVerificationStatus("APPROVED");
        request.setVerifiedBy(rmg);
        request.setVerifiedAt(LocalDateTime.now());
        EmployeeAvailability saved = availabilityRepository.save(request);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "AVAILABILITY_APPROVED",
                "EMPLOYEE_AVAILABILITY", saved.getId(), "PENDING", "APPROVED",
                rmg.getEmployeeId() + " approved unavailability for " + employee.getEmployeeId());
        notificationService.notify(employee, "AVAILABILITY_APPROVED",
                "Your unavailability request was approved",
                "Expected back " + request.getAvailableFrom(), "EMPLOYEE_AVAILABILITY", String.valueOf(saved.getId()));
        return toDTO(saved);
    }

    public EmployeeAvailabilityDTO reject(Long id, String reason) {
        Employee rmg = currentRmg();
        EmployeeAvailability request = findReviewable(rmg, id);

        request.setVerificationStatus("REJECTED");
        request.setVerifiedBy(rmg);
        request.setVerifiedAt(LocalDateTime.now());
        request.setVerificationComment(reason);
        EmployeeAvailability saved = availabilityRepository.save(request);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "AVAILABILITY_REJECTED",
                "EMPLOYEE_AVAILABILITY", saved.getId(), "PENDING", "REJECTED", reason);
        notificationService.notify(request.getEmployee(), "AVAILABILITY_REJECTED",
                "Your unavailability request was rejected", reason,
                "EMPLOYEE_AVAILABILITY", String.valueOf(saved.getId()));
        return toDTO(saved);
    }

    /** Returns a live snapshot, not a historical request row - the most recent request row stays
     * frozen as "UNAVAILABLE/APPROVED" since that's what was true when RMG approved it. */
    public EmployeeAvailabilityDTO returnEarly() {
        Employee employee = accessGuard.currentEmployee();
        if (!"UNAVAILABLE".equals(employee.getAvailabilityStatus())) {
            throw new BusinessRuleException("You are not currently marked unavailable");
        }
        restore(employee);
        return EmployeeAvailabilityDTO.builder()
                .employeeId(employee.getEmployeeId())
                .availabilityStatus(employee.getAvailabilityStatus())
                .expectedReturnDate(employee.getAvailableFromDate())
                .build();
    }

    @Transactional(readOnly = true)
    public List<EmployeeAvailabilityDTO> pendingForMyAssociates() {
        Employee rmg = currentRmg();
        List<EmployeeAvailability> pending = accessGuard.isAdmin()
                ? availabilityRepository.findAllPending()
                : availabilityRepository.findPendingForRmg(rmg.getId());
        return pending.stream().map(this::toDTO).toList();
    }

    /** Shared by the early-return endpoint and the scheduled restoration job - the one place this logic lives. */
    public void restore(Employee employee) {
        benchHistoryRepository.findByEmployeeIdAndIsCurrentTrue(employee.getId()).ifPresent(bench -> {
            if (bench.getPauseStartedAt() != null) {
                long elapsed = ChronoUnit.DAYS.between(bench.getPauseStartedAt().toLocalDate(), LocalDateTime.now().toLocalDate());
                int before = bench.getPausedDays() != null ? bench.getPausedDays() : 0;
                bench.setPausedDays(before + (int) elapsed);
                bench.setPauseStartedAt(null);
                benchHistoryRepository.save(bench);
            }
        });

        employee.setAvailabilityStatus("AVAILABLE");
        employee.setAvailableFromDate(null);
        employeeRepository.save(employee);
        resourcePoolService.enterIfEligible(employee, "AVAILABILITY_RESTORED");

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "AVAILABILITY_RESTORED", "EMPLOYEE",
                employee.getId(), "UNAVAILABLE", "AVAILABLE", employee.getEmployeeId() + " is available again");
        notificationService.notify(employee, "AVAILABILITY_RESTORED", "You're marked available again",
                "Welcome back.", "EMPLOYEE_AVAILABILITY", null);
    }

    private EmployeeAvailability findReviewable(Employee rmg, Long id) {
        EmployeeAvailability request = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeAvailability", String.valueOf(id)));
        if (!reviewsEmployee(rmg, request.getEmployee())) {
            throw ProjectAccessDeniedException.notYours("This availability request");
        }
        if (!"PENDING".equals(request.getVerificationStatus())) {
            throw new BusinessRuleException("This request is already " + request.getVerificationStatus());
        }
        return request;
    }

    /** Same rule as AllocationApprovalService/RMG-phase pool & bench: own associates + unassigned. */
    private boolean reviewsEmployee(Employee rmg, Employee employee) {
        return employee.getRmgManager() == null || employee.getRmgManager().getId().equals(rmg.getId());
    }

    private Employee currentRmg() {
        if (!accessGuard.isAdmin() && !accessGuard.roleCodes().contains(RequirementAccessGuard.RMG)) {
            throw ProjectAccessDeniedException.notYours("Availability review (RMG or Admin only)");
        }
        return accessGuard.currentEmployee();
    }

    private EmployeeAvailabilityDTO toDTO(EmployeeAvailability a) {
        return EmployeeAvailabilityDTO.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getEmployeeId())
                .availabilityStatus(a.getAvailabilityStatus())
                .expectedReturnDate(a.getAvailableFrom())
                .reason(a.getReason())
                .verificationStatus(a.getVerificationStatus())
                .verifiedByName(a.getVerifiedBy() != null ? CandidateWorkflowService.name(a.getVerifiedBy()) : null)
                .verifiedAt(a.getVerifiedAt())
                .verificationComment(a.getVerificationComment())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
