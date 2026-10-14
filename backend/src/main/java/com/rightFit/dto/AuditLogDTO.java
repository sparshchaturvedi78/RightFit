package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogDTO {

    private Long id;

    private String auditId;

    private Long userId;

    private String performedByEmail;

    /** The performer's name and employee ID, when the entry is linked to an employee. */
    private String performedByName;

    private String performedByEmployeeId;

    private String action;

    private String entityType;

    private Long entityId;

    private String oldValue;

    private String newValue;

    private String changeSummary;

    private String ipAddress;

    private String userAgent;

    private String status;

    private LocalDateTime timestamp;
}
