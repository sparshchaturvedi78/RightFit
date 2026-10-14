package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** One login account on the Admin Users page. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAccountDTO {

    private Long userId;
    private String employeeId;
    /** Null when the account has no employee record. */
    private String name;
    private String email;
    /** ACTIVE or INACTIVE, straight from the account. */
    private String status;
    /** ALLOWED, BLOCKED (sign-in switched off) or LOCKED (too many failed sign-ins). */
    private String signInState;
    private boolean neverSignedIn;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    /** Active role codes: ADMIN, MANAGER, RMG, ASSOCIATE. */
    private List<String> roles;
    /** Employment state of the linked employee (ACTIVE / INACTIVE), if any. */
    private String employmentStatus;
    private String blockReason;
    private String blockedBy;
    private LocalDateTime blockedAt;
    private LocalDateTime lockedUntil;
    /** True for the account of the person signed in right now. */
    private boolean self;
}
