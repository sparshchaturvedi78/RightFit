package com.rightFit.service;

import com.rightFit.dto.PoolBenchDtos.BenchDetailDTO;
import com.rightFit.dto.PoolBenchDtos.BenchEntryDTO;
import com.rightFit.dto.PoolBenchDtos.BenchHistoryEntryDTO;
import com.rightFit.dto.PoolBenchDtos.BenchSummaryDTO;
import com.rightFit.entity.BenchConfiguration;
import com.rightFit.entity.BenchHistory;
import com.rightFit.entity.Employee;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.BenchConfigurationRepository;
import com.rightFit.repository.BenchHistoryRepository;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * RMG Phase: Bench visibility with real green/amber/red aging (BRD 7.1 / BR-028-030). Every
 * bench_history row is written once with a hardcoded "GREEN" status and never updated by anything
 * else in the codebase - this computes the true status live, on every read, rather than trusting
 * that stale stored value. Pausing/resuming the aging clock is not a separate action here: the BRD
 * ties it to the availability-verification flow (Associate phase) via the paused_days column, which
 * this service simply reads.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BenchTrackingService {

    private final BenchHistoryRepository benchHistoryRepository;
    private final BenchConfigurationRepository configRepository;
    private final EmployeeRepository employeeRepository;
    private final RequirementAccessGuard accessGuard;

    public List<BenchEntryDTO> list(String benchStatus) {
        BenchConfiguration config = activeConfig();
        return scopedCurrent().stream()
                .map(b -> toEntryDTO(b, config))
                .filter(dto -> benchStatus == null || benchStatus.equalsIgnoreCase(dto.getBenchStatus()))
                .toList();
    }

    public BenchSummaryDTO summary() {
        BenchConfiguration config = activeConfig();
        long green = 0;
        long amber = 0;
        long red = 0;
        List<BenchHistory> rows = scopedCurrent();
        for (BenchHistory row : rows) {
            String status = classify(daysOnBench(row), config);
            if ("GREEN".equals(status)) {
                green++;
            } else if ("AMBER".equals(status)) {
                amber++;
            } else {
                red++;
            }
        }
        return BenchSummaryDTO.builder().green(green).amber(amber).red(red).total(rows.size()).build();
    }

    public BenchDetailDTO detail(String employeeId) {
        Employee employee = findAccessible(employeeId);
        BenchConfiguration config = activeConfig();
        List<BenchHistoryEntryDTO> history = benchHistoryRepository
                .findByEmployeeIdOrderByBenchStartDateDesc(employee.getId()).stream()
                .map(b -> BenchHistoryEntryDTO.builder()
                        .benchStartDate(b.getBenchStartDate())
                        .benchEndDate(b.getBenchEndDate())
                        .daysOnBench(Boolean.TRUE.equals(b.getIsCurrent()) ? daysOnBench(b) : b.getDaysOnBench())
                        .pausedDays(b.getPausedDays())
                        .benchStatus(Boolean.TRUE.equals(b.getIsCurrent()) ? classify(daysOnBench(b), config) : b.getBenchStatus())
                        .isCurrent(b.getIsCurrent())
                        .build())
                .toList();
        return BenchDetailDTO.builder()
                .employeeId(employee.getEmployeeId())
                .name(employee.getFirstName() + " " + employee.getLastName())
                .history(history)
                .build();
    }

    private List<BenchHistory> scopedCurrent() {
        if (accessGuard.isAdmin()) {
            return benchHistoryRepository.findAllCurrent();
        }
        return benchHistoryRepository.findCurrentForRmg(accessGuard.currentEmployee().getId());
    }

    private Employee findAccessible(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        if (!accessGuard.isAdmin() && !reviewsEmployee(accessGuard.currentEmployee(), employee)) {
            throw ProjectAccessDeniedException.notYours("This employee's bench record");
        }
        return employee;
    }

    private boolean reviewsEmployee(Employee rmg, Employee employee) {
        return employee.getRmgManager() == null || employee.getRmgManager().getId().equals(rmg.getId());
    }

    private BenchConfiguration activeConfig() {
        return configRepository.findFirstByIsActiveTrueOrderByEffectiveFromDesc()
                .orElseThrow(() -> new BusinessRuleException("No active bench configuration is set"));
    }

    private int daysOnBench(BenchHistory bench) {
        int raw = (int) ChronoUnit.DAYS.between(bench.getBenchStartDate(), LocalDate.now());
        int paused = bench.getPausedDays() != null ? bench.getPausedDays() : 0;
        return Math.max(0, raw - paused);
    }

    /** Green/amber boundary is greenMaxDays; amber/red boundary is redThresholdDays - amberMaxDays is informational only. */
    private String classify(int days, BenchConfiguration config) {
        if (days >= config.getRedThresholdDays()) {
            return "RED";
        }
        if (days > config.getGreenMaxDays()) {
            return "AMBER";
        }
        return "GREEN";
    }

    private BenchEntryDTO toEntryDTO(BenchHistory bench, BenchConfiguration config) {
        Employee employee = bench.getEmployee();
        int days = daysOnBench(bench);
        return BenchEntryDTO.builder()
                .employeeId(employee.getEmployeeId())
                .name(employee.getFirstName() + " " + employee.getLastName())
                .designation(employee.getDesignation())
                .grade(employee.getGrade())
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .benchStartDate(bench.getBenchStartDate())
                .pausedDays(bench.getPausedDays())
                .daysOnBench(days)
                .benchStatus(classify(days, config))
                .build();
    }
}
