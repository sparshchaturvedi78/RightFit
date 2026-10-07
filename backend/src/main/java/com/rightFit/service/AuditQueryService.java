package com.rightFit.service;

import com.rightFit.dto.AuditLogDTO;
import com.rightFit.entity.AuditLog;
import com.rightFit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public Page<AuditLogDTO> getAuditLogs(Pageable pageable) {
        log.debug("Fetching all audit logs");
        Page<AuditLog> auditLogs = auditLogRepository.findAll(pageable);
        return auditLogs.map(this::mapToDTO);
    }

    public Page<AuditLogDTO> getAuditLogsByEntityType(String entityType, Pageable pageable) {
        log.debug("Fetching audit logs for entity type: {}", entityType);
        Page<AuditLog> auditLogs = auditLogRepository.findByEntityType(entityType, pageable);
        return auditLogs.map(this::mapToDTO);
    }

    public Page<AuditLogDTO> getAuditLogsByAction(String action, Pageable pageable) {
        log.debug("Fetching audit logs for action: {}", action);
        Page<AuditLog> auditLogs = auditLogRepository.findByAction(action, pageable);
        return auditLogs.map(this::mapToDTO);
    }

    public Page<AuditLogDTO> getAuditLogsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        log.debug("Fetching audit logs from {} to {}", startDate, endDate);
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        Page<AuditLog> auditLogs = auditLogRepository.findByTimestampBetween(startDateTime, endDateTime, pageable);
        return auditLogs.map(this::mapToDTO);
    }

    public Page<AuditLogDTO> getAuditLogsWithFilters(Long userId, String entityType, String action,
                                                     LocalDate startDate, LocalDate endDate, Pageable pageable) {
        log.debug("Fetching audit logs with multiple filters");
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        Page<AuditLog> auditLogs = auditLogRepository.findByFilters(userId, entityType, action, startDateTime, endDateTime, pageable);
        return auditLogs.map(this::mapToDTO);
    }

    /** Same filters, plus the year/month convenience FR-055 asks for (date, month or year). */
    public Page<AuditLogDTO> getAuditLogsWithFilters(Long userId, String entityType, String action,
                                                     Integer year, Integer month,
                                                     LocalDate startDate, LocalDate endDate, Pageable pageable) {
        LocalDateTime[] range = resolveRange(year, month, startDate, endDate);
        if (range[0] == null) {
            // findByFilters requires a non-null range; default to "all time" when no filter was given at all.
            range[0] = LocalDateTime.of(1970, 1, 1, 0, 0);
            range[1] = LocalDateTime.now().plusYears(1);
        }
        Page<AuditLog> auditLogs = auditLogRepository.findByFilters(userId, entityType, action, range[0], range[1], pageable);
        return auditLogs.map(this::mapToDTO);
    }

    /**
     * Builds the complete, downloadable audit-history CSV for the selected period (BR-050 / FR-056).
     * Filter by an exact range (startDate/endDate), or the coarser year/month BR-049 asks for -
     * year alone exports the whole year, year+month exports just that month. All filters are optional;
     * passing none exports the complete history.
     */
    public String exportCsv(Long userId, String entityType, String action,
                            Integer year, Integer month, LocalDate startDate, LocalDate endDate) {
        LocalDateTime[] range = resolveRange(year, month, startDate, endDate);
        if (range[0] == null) {
            // Postgres can't infer a bare "?" parameter's type when it's only ever compared to NULL;
            // defaulting to an all-time bound (rather than a true null) avoids that and keeps "export everything".
            range[0] = LocalDateTime.of(1970, 1, 1, 0, 0);
            range[1] = LocalDateTime.now().plusYears(1);
        }
        java.util.List<AuditLog> rows = auditLogRepository.findForExport(userId, entityType, action, range[0], range[1]);

        StringBuilder csv = new StringBuilder("auditId,action,entityType,entityId,performedByEmail,status,timestamp,oldValue,newValue,changeSummary\n");
        for (AuditLog row : rows) {
            csv.append(csvField(row.getAuditId())).append(',')
                    .append(csvField(row.getAction())).append(',')
                    .append(csvField(row.getEntityType())).append(',')
                    .append(row.getEntityId() != null ? row.getEntityId() : "").append(',')
                    .append(csvField(row.getPerformedByEmail())).append(',')
                    .append(csvField(row.getStatus())).append(',')
                    .append(row.getCreatedAt()).append(',')
                    .append(csvField(row.getOldValue())).append(',')
                    .append(csvField(row.getNewValue())).append(',')
                    .append(csvField(row.getChangeSummary())).append('\n');
        }
        return csv.toString();
    }

    /** [start, end], both possibly null: explicit dates win; else year (+ optional month); else no bound. */
    private LocalDateTime[] resolveRange(Integer year, Integer month, LocalDate startDate, LocalDate endDate) {
        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        if (startTime == null && year != null) {
            if (month != null) {
                java.time.YearMonth ym = java.time.YearMonth.of(year, month);
                startTime = ym.atDay(1).atStartOfDay();
                endTime = ym.atEndOfMonth().atTime(LocalTime.MAX);
            } else {
                startTime = LocalDate.of(year, 1, 1).atStartOfDay();
                endTime = LocalDate.of(year, 12, 31).atTime(LocalTime.MAX);
            }
        }
        return new LocalDateTime[] {startTime, endTime};
    }

    private String csvField(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private AuditLogDTO mapToDTO(AuditLog auditLog) {
        Long performedById = auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getId() : null;
        return AuditLogDTO.builder()
                .id(auditLog.getId())
                .auditId(auditLog.getAuditId())
                .userId(performedById)
                .performedByEmail(auditLog.getPerformedByEmail())
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .oldValue(auditLog.getOldValue())
                .newValue(auditLog.getNewValue())
                .changeSummary(auditLog.getChangeSummary())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .status(auditLog.getStatus())
                .timestamp(auditLog.getCreatedAt())
                .build();
    }
}
