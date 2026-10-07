package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRequirementRequest {

    @NotBlank(message = "Project ID is required")
    private String projectId;

    @NotBlank(message = "Position title is required")
    @Size(max = 255, message = "Position title must not exceed 255 characters")
    private String positionTitle;

    private String description;

    private String requiredSkills;

    @PositiveOrZero(message = "Minimum experience must not be negative")
    private Integer minExperience;

    @PositiveOrZero(message = "Maximum experience must not be negative")
    private Integer maxExperience;

    private String requiredCertifications;

    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL", message = "Priority must be LOW, MEDIUM, HIGH or CRITICAL")
    private String priority;

    private LocalDate allocationStartDate;

    private LocalDate allocationEndDate;
}
