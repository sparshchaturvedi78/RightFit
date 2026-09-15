package com.rightFit.controller;

import com.rightFit.dto.AuditLogDTO;
import com.rightFit.service.AuditQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@Validated
public class AdminAuditController {

    private final AuditQueryService auditQueryService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'AUDIT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("Fetching audit logs");

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<AuditLogDTO> auditLogs = auditQueryService.getAuditLogs(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/entity/{entityType}")
    @PreAuthorize("hasPermission(null, 'AUDIT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogsByEntity(
            @PathVariable String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs for entity type: {}", entityType);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogDTO> auditLogs = auditQueryService.getAuditLogsByEntityType(entityType, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasPermission(null, 'AUDIT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogsByAction(
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs for action: {}", action);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogDTO> auditLogs = auditQueryService.getAuditLogsByAction(action, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasPermission(null, 'AUDIT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs from {} to {}", startDate, endDate);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogDTO> auditLogs = auditQueryService.getAuditLogsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/filter")
    @PreAuthorize("hasPermission(null, 'AUDIT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogsWithFilters(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs with filters");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogDTO> auditLogs = auditQueryService.getAuditLogsWithFilters(userId, entityType, action, startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }
}
