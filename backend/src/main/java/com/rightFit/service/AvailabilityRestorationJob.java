package com.rightFit.service;

import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Associate Phase: daily restoration for employees whose approved return date has arrived (BRD 21).
 * Idempotent by construction - restoring an employee flips availabilityStatus away from UNAVAILABLE,
 * which is exactly what excludes them from this query on every later run, so running this twice in a
 * day (e.g. after a restart) or missing a midnight run entirely is both harmless: whoever's still due
 * just gets picked up on the next run, whenever that is. Each employee is restored in its own
 * transaction (EmployeeAvailabilityService.restore is called per-employee, through the Spring proxy,
 * not looped inside one shared transaction), so one bad row can't roll back everyone else's.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AvailabilityRestorationJob {

    private final EmployeeRepository employeeRepository;
    private final EmployeeAvailabilityService availabilityService;

    @Scheduled(cron = "0 0 0 * * *", zone = "UTC")
    public void run() {
        List<Employee> due = employeeRepository.findDueForAvailabilityRestoration(LocalDate.now());
        log.info("Availability restoration job: {} employee(s) due", due.size());
        for (Employee employee : due) {
            try {
                availabilityService.restore(employee);
            } catch (Exception e) {
                log.error("Failed to restore availability for {} - will retry on the next run",
                        employee.getEmployeeId(), e);
            }
        }
    }
}
