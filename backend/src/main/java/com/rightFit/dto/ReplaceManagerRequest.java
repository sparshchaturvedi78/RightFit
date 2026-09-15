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
public class ReplaceManagerRequest {

    @NotNull(message = "New manager ID is required")
    private Long newManagerId;

    private List<Long> selectedProjectIds;

    private List<Long> selectedOwnedRequirementIds;

    private List<ResponsibilitySelectionDTO> selectedResponsibilities;
}
