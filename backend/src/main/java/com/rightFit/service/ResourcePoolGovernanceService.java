package com.rightFit.service;

import com.rightFit.dto.PoolBenchDtos.PoolDetailDTO;
import com.rightFit.dto.PoolBenchDtos.PoolEntryDTO;
import com.rightFit.dto.PoolBenchDtos.PoolHistoryEntryDTO;
import com.rightFit.dto.RmgSelectionDtos.SelectionDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.ResourcePoolEntry;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.ResourcePoolEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * RMG Phase: Resource Pool visibility (BRD 22). Pool entry/exit itself is unchanged - it already
 * happens automatically via ResourcePoolService, driven by allocation and availability events.
 * This only adds the ability to see it.
 * Scoping mirrors the "no RMG assigned -> visible to any RMG" rule AllocationApprovalService
 * already uses for allocation review; whether RMG should instead see the whole org-wide pool is
 * still an open question (see RMG_PHASE_GUIDE.md) - this is the default until that's settled.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourcePoolGovernanceService {

    private final EmployeeRepository employeeRepository;
    private final ResourcePoolEntryRepository poolEntryRepository;
    private final CandidateApplicationRepository candidateRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final RequirementAccessGuard accessGuard;

    /** A candidacy in one of these statuses is over, so the person can be recommended to the requirement again. */
    private static final List<String> ENDED_STATUSES = List.of("DECLINED", "REJECTED", "WITHDRAWN");

    public Page<PoolEntryDTO> list(String q, String grade, Long departmentId, Pageable pageable) {
        Long rmgId = accessGuard.isAdmin() ? null : accessGuard.currentEmployee().getId();
        Page<Employee> employees = employeeRepository.findResourcePool(rmgId, q, grade, departmentId, pageable);
        return employees.map(this::toPoolEntryDTO);
    }

    /**
     * The pool people who can be recommended to one requirement: anyone already in its pipeline (any stage up to
     * allocated) is left out, so a person who is shortlisted, selected or already recommended does not show again.
     */
    public List<PoolEntryDTO> candidatesFor(String requirementId, String q, String grade) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        Set<Long> engaged = candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId()).stream()
                .filter(c -> !ENDED_STATUSES.contains(c.getStatus()))
                .map(c -> c.getEmployee().getId())
                .collect(Collectors.toSet());
        Long rmgId = accessGuard.isAdmin() ? null : accessGuard.currentEmployee().getId();
        return employeeRepository.findResourcePool(rmgId, q, grade, null, PageRequest.of(0, 200)).getContent().stream()
                .filter(e -> !engaged.contains(e.getId()))
                .map(this::toPoolEntryDTO)
                .toList();
    }

    public PoolDetailDTO detail(String employeeId) {
        Employee employee = findAccessible(employeeId);
        List<PoolHistoryEntryDTO> history = poolEntryRepository.findByEmployeeIdOrderByEntryDateDesc(employee.getId())
                .stream()
                .map(e -> PoolHistoryEntryDTO.builder()
                        .entryDate(e.getEntryDate())
                        .exitDate(e.getExitDate())
                        .entryReason(e.getEntryReason())
                        .exitReason(e.getExitReason())
                        .isCurrent(e.getIsCurrent())
                        .build())
                .toList();
        return PoolDetailDTO.builder()
                .employeeId(employee.getEmployeeId())
                .name(employee.getFirstName() + " " + employee.getLastName())
                .poolStatus(employee.getPoolStatus())
                .history(history)
                .build();
    }

    /** The person's candidacies across requirements, newest first: where they stand in each selection. */
    public List<SelectionDTO> selections(String employeeId) {
        Employee employee = findAccessible(employeeId);
        return candidateRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId()).stream()
                .map(c -> SelectionDTO.builder()
                        .applicationId(c.getApplicationId())
                        .requirementId(c.getRequirement().getRequirementId())
                        .positionTitle(c.getRequirement().getPositionTitle())
                        .projectName(c.getRequirement().getProject().getProjectName())
                        .status(c.getStatus())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .confirmedAt(c.getConfirmedAt())
                        .build())
                .toList();
    }

    private Employee findAccessible(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        if (!accessGuard.isAdmin() && !reviewsEmployee(accessGuard.currentEmployee(), employee)) {
            throw ProjectAccessDeniedException.notYours("This employee's pool record");
        }
        return employee;
    }

    /** The employee's assigned RMG reviews (same rule as AllocationApprovalService, BR-039). */
    private boolean reviewsEmployee(Employee rmg, Employee employee) {
        return employee.getRmgManager() == null || employee.getRmgManager().getId().equals(rmg.getId());
    }

    private PoolEntryDTO toPoolEntryDTO(Employee employee) {
        ResourcePoolEntry current = poolEntryRepository.findByEmployeeIdAndIsCurrentTrue(employee.getId()).orElse(null);
        return PoolEntryDTO.builder()
                .employeeId(employee.getEmployeeId())
                .name(employee.getFirstName() + " " + employee.getLastName())
                .designation(employee.getDesignation())
                .grade(employee.getGrade())
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .locationName(employee.getLocation() != null ? employee.getLocation().getName() : null)
                .inPoolSince(current != null ? current.getEntryDate() : null)
                .entryReason(current != null ? current.getEntryReason() : null)
                .build();
    }
}
