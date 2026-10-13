package com.rightFit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Admin changes an employee's main role (e.g. Associate -> Manager). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRoleRequest {

    @NotNull(message = "The new role is required")
    private Long newRoleId;

    /**
     * Business ID of who the person reports to afterwards. Required when the role moves them to a different place in
     * the chain: a new RMG reports to an Admin; a person coming from Admin (or becoming an Associate / Manager
     * without an RMG above them) reports to an RMG. Ignored when becoming an Admin (Admins report to no one).
     */
    private String reportsToEmployeeId;

    private String reason;
}
