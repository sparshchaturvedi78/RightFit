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
public class ResponsibilitySelectionDTO {

    @NotNull(message = "Requirement ID is required")
    private Long requirementId;

    @NotNull(message = "Responsibility type is required (SOURCER|INTERVIEWER|COORDINATOR)")
    private String responsibility;
}
