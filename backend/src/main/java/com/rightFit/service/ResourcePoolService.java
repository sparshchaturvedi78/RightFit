package com.rightFit.service;

import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resource Pool entry/exit driven by Manager-side allocation changes (BRD 22, BR-028/029).
 * Bench duration starts at release (BR-030). Governance of the pool itself belongs to the RMG module.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ResourcePoolService {

    static final String IN_POOL = "IN_RESOURCE_POOL";
    static final String NOT_IN_POOL = "NOT_IN_RESOURCE_POOL";

    private final EmployeeRepository employeeRepository;
    private final JdbcTemplate jdbcTemplate;

    /** Automatic pool entry after release - no RMG approval needed. Only eligible employees enter. */
    public void enterIfEligible(Employee employee, String entryReason) {
        boolean eligible = "ACTIVE".equals(employee.getEmploymentStatus())
                && "AVAILABLE".equals(employee.getAvailabilityStatus())
                && !"ALLOCATED".equals(employee.getAllocationStatus());
        if (!eligible || IN_POOL.equals(employee.getPoolStatus())) {
            return;
        }
        employee.setPoolStatus(IN_POOL);
        employeeRepository.save(employee);
        jdbcTemplate.update("INSERT INTO resource_pool_entries (employee_id, entry_reason, is_current) VALUES (?, ?, TRUE)",
                employee.getId(), entryReason);
        jdbcTemplate.update("INSERT INTO bench_history (employee_id, bench_start_date, bench_status, is_current) " +
                "SELECT ?, CURRENT_DATE, 'GREEN', TRUE WHERE NOT EXISTS " +
                "(SELECT 1 FROM bench_history WHERE employee_id = ? AND is_current = TRUE)", employee.getId(), employee.getId());
        log.info("Employee {} entered the Resource Pool ({})", employee.getEmployeeId(), entryReason);
    }

    public void exit(Employee employee, String exitReason) {
        if (NOT_IN_POOL.equals(employee.getPoolStatus())) {
            return;
        }
        employee.setPoolStatus(NOT_IN_POOL);
        employeeRepository.save(employee);
        jdbcTemplate.update("UPDATE resource_pool_entries SET is_current = FALSE, exit_date = CURRENT_TIMESTAMP, " +
                "exit_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ? AND is_current = TRUE",
                exitReason, employee.getId());
        jdbcTemplate.update("UPDATE bench_history SET is_current = FALSE, bench_end_date = CURRENT_DATE, " +
                "days_on_bench = GREATEST(0, CURRENT_DATE - bench_start_date), updated_at = CURRENT_TIMESTAMP " +
                "WHERE employee_id = ? AND is_current = TRUE", employee.getId());
        log.info("Employee {} left the Resource Pool ({})", employee.getEmployeeId(), exitReason);
    }

    /**
     * Pool exit for verified temporary unavailability (Associate phase, BRD 21). Deliberately does
     * NOT close out bench_history like exit() does - the BRD requires pausing the existing bench
     * clock, not ending it, so the current row (if any) must stay is_current=true so the Associate
     * phase can stamp/clear its pause marker and resume the SAME spell later. enterIfEligible()'s own
     * "only insert if none is_current" check means re-entry won't start a new bench row either.
     */
    public void exitForUnavailability(Employee employee) {
        if (NOT_IN_POOL.equals(employee.getPoolStatus())) {
            return;
        }
        employee.setPoolStatus(NOT_IN_POOL);
        employeeRepository.save(employee);
        jdbcTemplate.update("UPDATE resource_pool_entries SET is_current = FALSE, exit_date = CURRENT_TIMESTAMP, " +
                "exit_reason = 'UNAVAILABLE', updated_at = CURRENT_TIMESTAMP WHERE employee_id = ? AND is_current = TRUE",
                employee.getId());
        log.info("Employee {} left the Resource Pool (UNAVAILABLE, bench clock preserved)", employee.getEmployeeId());
    }
}
