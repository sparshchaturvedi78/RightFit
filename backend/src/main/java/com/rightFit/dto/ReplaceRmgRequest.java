package com.rightFit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplaceRmgRequest {

    /** Legacy numeric id. Prefer newRmgEmployeeId; at least one of the two is required. */
    private Long newRmgId;

    /** Business Employee ID of the replacement RMG, e.g. "EMP002". */
    private String newRmgEmployeeId;

    private List<Long> selectedEmployeeIds;

    /** Business Employee IDs to transfer, e.g. ["EMP005", "EMP006"]. Preferred over selectedEmployeeIds. */
    private List<String> selectedEmployeeBusinessIds;
}
