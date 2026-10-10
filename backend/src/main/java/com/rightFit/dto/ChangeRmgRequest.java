package com.rightFit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRmgRequest {

    /** Legacy numeric id. Prefer newRmgEmployeeId; at least one of the two is required. */
    private Long newRmgId;

    /** Business Employee ID of the new RMG, e.g. "EMP002". */
    private String newRmgEmployeeId;

    private String reason;
}
