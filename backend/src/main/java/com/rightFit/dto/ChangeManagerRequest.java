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
public class ChangeManagerRequest {

    /** Legacy numeric id. Prefer newManagerEmployeeId; at least one of the two is required. */
    private Long newManagerId;

    /** Business Employee ID of the new Manager, e.g. "EMP004". */
    private String newManagerEmployeeId;

    private String reason;
}
