package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProjectRequest {

    @NotBlank(message = "Project ID is required")
    private String projectId;

    @NotBlank(message = "Project name is required")
    private String projectName;

    private String description;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    private String clientName;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;
}
