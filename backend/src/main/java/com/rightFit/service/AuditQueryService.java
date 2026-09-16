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
