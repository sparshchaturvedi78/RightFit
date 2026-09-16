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

    @NotNull(message = "New RMG ID is required")
    private Long newRmgId;

    @NotNull(message = "Selected employee IDs are required")
    private List<Long> selectedEmployeeIds;
}
