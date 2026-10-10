package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.AdminDashboardDTO;
import com.rightFit.repository.AuditLogRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Admin Dashboard (BRD 42): the org-level counts already shown individually elsewhere in the Admin
 * API, bundled into one call. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final RequirementAccessGuard accessGuard;

    public AdminDashboardDTO dashboard() {
        var me = accessGuard.currentEmployeeOrNull();
        Long myId = me != null ? me.getId() : null;

        return AdminDashboardDTO.builder()
                .totalEmployees(employeeRepository.count())
                .activeEmployees(employeeRepository.countByEmploymentStatus("ACTIVE"))
                .inactiveEmployees(employeeRepository.countByEmploymentStatus("INACTIVE"))
                .totalProjects(projectRepository.count())
                .activeProjects(projectRepository.countByStatus("ACTIVE"))
                .totalManagers(projectRepository.countDistinctManagers())
                .totalRmgs(employeeRepository.countDistinctRmgs())
                .pendingManagerReplacements(projectRepository.countPendingManagerReplacements())
                .pendingRmgReplacements(employeeRepository.countPendingRmgReplacements())
                .totalAuditEntries(auditLogRepository.count())
                .auditEntriesLast24h(auditLogRepository.countByTimestampAfter(LocalDateTime.now().minusHours(24)))
                .unreadNotifications(myId == null ? 0 : notificationRepository.countByRecipientIdAndIsReadFalse(myId))
                .build();
    }
}
