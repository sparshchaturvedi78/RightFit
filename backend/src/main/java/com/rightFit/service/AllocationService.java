package com.rightFit.service;

import com.rightFit.dto.AllocationDtos.AllocationDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.AllocationEvent;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectMember;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.repository.AllocationEventRepository;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Allocation engine: capacity validation (BR-035 / FR-038), conflict validation, allocation creation,
 * hour changes (split), ending, and append-only history (BRD 7.1).
 * Example from the BRD: a 9-hour day may be 4.5h on Project A + 4.5h on Project B, never more than 9h.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AllocationService {

    private static final LocalDate FAR_FUTURE = LocalDate.of(9999, 12, 31);
    private static final BigDecimal DEFAULT_CAPACITY = BigDecimal.valueOf(9);

    private final AllocationRepository allocationRepository;
    private final AllocationEventRepository eventRepository;
    private final AllocationRequestRepository allocationRequestRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmployeeRepository employeeRepository;
    private final ResourcePoolService resourcePoolService;

    public BigDecimal capacityOf(Employee employee) {
        return employee.getWorkingHoursPerDay() == null
                ? DEFAULT_CAPACITY : BigDecimal.valueOf(employee.getWorkingHoursPerDay());
    }

    @Transactional(readOnly = true)
    public BigDecimal allocatedHours(Employee employee, LocalDate start, LocalDate end, Set<Long> excludeIds) {
        LocalDate windowEnd = end == null ? FAR_FUTURE : end;
        return allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE").stream()
                .filter(a -> excludeIds == null || !excludeIds.contains(a.getId()))
                .filter(a -> !a.getStartDate().isAfter(windowEnd)
                        && (a.getEndDate() == null || !a.getEndDate().isBefore(start)))
                .map(Allocation::getHoursPerDay)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Conservative check: everything overlapping the requested window counts, so the day total can never exceed capacity. */
    public void assertCapacity(Employee employee, LocalDate start, LocalDate end, BigDecimal newHours,
                               Set<Long> excludeIds) {
        BigDecimal capacity = capacityOf(employee);
        BigDecimal used = allocatedHours(employee, start, end, excludeIds);
        if (used.add(newHours).compareTo(capacity) > 0) {
            throw new BusinessRuleException(BusinessRuleException.CAPACITY_EXCEEDED,
                    "Allocation would exceed capacity for " + employee.getEmployeeId() + ": " + used.stripTrailingZeros().toPlainString()
                            + "h/day already allocated + " + newHours.stripTrailingZeros().toPlainString()
                            + "h requested > " + capacity.stripTrailingZeros().toPlainString() + "h/day permitted");
        }
    }

    public Allocation create(Employee employee, Project project, ProjectRequirement requirement,
                             AllocationRequest request, LocalDate start, LocalDate end, BigDecimal hours,
                             Employee actor, String memberRole) {
        if (end != null && end.isBefore(start)) {
            throw new BusinessRuleException("Allocation end date must not be before the start date");
        }
        if (allocationRepository.findByEmployeeIdAndProjectIdAndStatus(employee.getId(), project.getId(), "ACTIVE").isPresent()) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId()
                    + " is already allocated to project " + project.getProjectId()
                    + "; adjust the existing allocation instead");
        }
        assertCapacity(employee, start, end, hours, null);

        Allocation allocation = allocationRepository.save(Allocation.builder()
                .allocationId("ALC-" + allocationRepository.nextAllocationSequence())
                .employee(employee)
                .project(project)
                .requirement(requirement)
                .allocationRequest(request)
                .startDate(start)
                .endDate(end)
                .hoursPerDay(hours)
                .status("ACTIVE")
                .createdBy(actor)
                .build());
        event(allocation, "CREATED", hours.stripTrailingZeros().toPlainString() + "h/day from " + start
                + (request != null ? " via " + request.getRequestId() : " (direct)"), actor);
        ensureMember(project, employee, memberRole, actor);
        refreshEmployee(employee, "ALLOCATION_END");
        return allocation;
    }

    public void changeHours(Allocation allocation, BigDecimal hours, Employee actor, String reason) {
        if (allocation.getHoursPerDay().compareTo(hours) == 0) {
            return;
        }
        assertCapacity(allocation.getEmployee(), allocation.getStartDate(), allocation.getEndDate(), hours,
                Set.of(allocation.getId()));
        BigDecimal before = allocation.getHoursPerDay();
        allocation.setHoursPerDay(hours);
        allocationRepository.save(allocation);
        event(allocation, "HOURS_CHANGED", before.stripTrailingZeros().toPlainString() + "h -> "
                + hours.stripTrailingZeros().toPlainString() + "h. " + reason, actor);
    }

    public void end(Allocation allocation, LocalDate endDate, String reason, Employee actor) {
        end(allocation, endDate, reason, actor, true);
    }

    /** refresh=false lets a move end one allocation and create the next without a spurious Resource Pool round-trip. */
    public void end(Allocation allocation, LocalDate endDate, String reason, Employee actor, boolean refresh) {
        if (!"ACTIVE".equals(allocation.getStatus())) {
            return;
        }
        allocation.setStatus("ENDED");
        allocation.setEndDate(endDate == null ? LocalDate.now() : endDate);
        allocation.setEndReason(reason);
        allocation.setEndedBy(actor);
        allocation.setEndedAt(LocalDateTime.now());
        allocationRepository.save(allocation);
        event(allocation, "ENDED", reason, actor);

        projectMemberRepository.findByProjectIdAndEmployeeId(allocation.getProject().getId(), allocation.getEmployee().getId())
                .ifPresent(member -> {
                    member.setIsActive(false);
                    member.setLeftAt(LocalDateTime.now());
                    projectMemberRepository.save(member);
                });
        if (refresh) {
            refreshEmployee(allocation.getEmployee(), "RELEASE");
        }
    }

    /** Keep Employee.allocationStatus / pool status consistent with the employee's active allocations. */
    public void refreshEmployee(Employee employee, String poolEntryReason) {
        boolean hasActive = !allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE").isEmpty();
        if (hasActive) {
            employee.setAllocationStatus("ALLOCATED");
            employeeRepository.save(employee);
            resourcePoolService.exit(employee, "ALLOCATION_START");
            return;
        }
        boolean pending = !allocationRequestRepository.findByEmployeeIdAndStatus(employee.getId(), "SUBMITTED").isEmpty();
        employee.setAllocationStatus(pending ? "ALLOCATION_PENDING" : "UNALLOCATED");
        employeeRepository.save(employee);
        if (!pending) {
            resourcePoolService.enterIfEligible(employee, poolEntryReason);
        }
    }

    public void event(Allocation allocation, String type, String details, Employee actor) {
        eventRepository.save(AllocationEvent.builder()
                .allocation(allocation)
                .eventType(type)
                .details(details)
                .performedBy(actor)
                .build());
    }

    private void ensureMember(Project project, Employee employee, String role, Employee actor) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndEmployeeId(project.getId(), employee.getId())
                .orElse(null);
        if (member == null) {
            projectMemberRepository.save(ProjectMember.builder()
                    .project(project).employee(employee).role(role != null ? role : "Team Member")
                    .addedBy(actor != null ? actor.getId() : null).build());
        } else if (!Boolean.TRUE.equals(member.getIsActive())) {
            member.setIsActive(true);
            member.setLeftAt(null);
            member.setJoinedAt(LocalDateTime.now());
            if (role != null) {
                member.setRole(role);
            }
            projectMemberRepository.save(member);
        }
    }

    @Transactional(readOnly = true)
    public List<Allocation> activeFor(Employee employee) {
        return allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE");
    }

    public AllocationDTO toDTO(Allocation a) {
        return AllocationDTO.builder()
                .id(a.getId())
                .allocationId(a.getAllocationId())
                .projectId(a.getProject().getProjectId())
                .projectName(a.getProject().getProjectName())
                .employeeId(a.getEmployee().getEmployeeId())
                .employeeName(CandidateWorkflowService.name(a.getEmployee()))
                .requirementId(a.getRequirement() != null ? a.getRequirement().getRequirementId() : null)
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .hoursPerDay(a.getHoursPerDay())
                .status(a.getStatus())
                .endReason(a.getEndReason())
                .createdByName(CandidateWorkflowService.name(a.getCreatedBy()))
                .endedByName(CandidateWorkflowService.name(a.getEndedBy()))
                .endedAt(a.getEndedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
