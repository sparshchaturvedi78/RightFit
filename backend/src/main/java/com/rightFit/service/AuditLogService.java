package com.rightFit.service;

import com.rightFit.entity.AuditLog;
import com.rightFit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void logAction(Long userId, String action, String entityType, Long entityId,
                         Object beforeState, Object afterState) {
        logAction(userId, action, entityType, entityId, beforeState, afterState, null);
    }

    public void logAction(Long userId, String action, String entityType, Long entityId,
                         Object beforeState, Object afterState, String context) {
        try {
            String performedByEmail = "system"; // Get from SecurityContext later

            AuditLog auditLog = AuditLog.builder()
                    .auditId(UUID.randomUUID().toString())
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedByEmail(performedByEmail)
                    .oldValue(serializeState(beforeState))
                    .newValue(serializeState(afterState))
                    .changeSummary(context)
                    .ipAddress(getClientIpAddress())
                    .userAgent(getUserAgent())
                    .status("SUCCESS")
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: {} {} on {} ({})", action, entityType, entityId, userId);
        } catch (Exception e) {
            log.error("Error saving audit log for action: {} on {}", action, entityType, e);
            throw new RuntimeException("Failed to persist audit log: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByDateRange(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByTimestampBetween(startTime, endTime, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByUserAndDateRange(Long userId, LocalDateTime startTime,
                                                         LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByUserIdAndTimestampBetween(userId, startTime, endTime, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByEntityAndDateRange(String entityType, LocalDateTime startTime,
                                                           LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndTimestampBetween(entityType, startTime, endTime, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsWithFilters(Long userId, String entityType, String action,
                                                  LocalDateTime startTime, LocalDateTime endTime,
                                                  Pageable pageable) {
        return auditLogRepository.findByFilters(userId, entityType, action, startTime, endTime, pageable);
    }

    @Transactional(readOnly = true)
    public long countAuditLogsByUser(Long userId) {
        return auditLogRepository.countByUserId(userId);
    }

    @Transactional(readOnly = true)
    public long countAuditLogsByEntity(String entityType) {
        return auditLogRepository.countByEntityType(entityType);
    }

    private String serializeState(Object state) {
        if (state == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception e) {
            log.error("Error serializing audit state: {}", e.getMessage());
            return state.toString();
        }
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null && requestAttributes.getRequest() != null) {
                String xForwardedFor = requestAttributes.getRequest().getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return requestAttributes.getRequest().getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not get client IP address: {}", e.getMessage());
        }
        return null;
    }

    private String getUserAgent() {
        try {
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null && requestAttributes.getRequest() != null) {
                return requestAttributes.getRequest().getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.debug("Could not get user agent: {}", e.getMessage());
        }
        return null;
    }
}
