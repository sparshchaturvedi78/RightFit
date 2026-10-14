package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Reason for blocking, unblocking or unlocking an account. Kept in the audit log. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountReasonRequest {

    private String reason;
}
