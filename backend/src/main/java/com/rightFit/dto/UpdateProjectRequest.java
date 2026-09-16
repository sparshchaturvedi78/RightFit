package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {

    private String projectName;

    private String description;

    private Long managerId;

    private String clientName;

    private String status;

    private LocalDate startDate;

    private LocalDate endDate;
}
