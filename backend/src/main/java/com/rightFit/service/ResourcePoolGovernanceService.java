package com.rightFit.service;

import com.rightFit.dto.PoolBenchDtos.PoolDetailDTO;
import com.rightFit.dto.PoolBenchDtos.PoolEntryDTO;
import com.rightFit.dto.PoolBenchDtos.PoolHistoryEntryDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ResourcePoolEntry;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ResourcePoolEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    private final RequirementAccessGuard accessGuard;

    public Page<PoolEntryDTO> list(String q, String grade, Long departmentId, Pageable pageable) {
        Long rmgId = accessGuard.isAdmin() ? null : accessGuard.currentEmployee().getId();
        Page<Employee> employees = employeeRepository.findResourcePool(rmgId, q, grade, departmentId, pageable);
        return employees.map(this::toPoolEntryDTO);
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
                .inPoolSince(current != null ? current.getEntryDate() : null)
                .entryReason(current != null ? current.getEntryReason() : null)
                .build();
    }
}
