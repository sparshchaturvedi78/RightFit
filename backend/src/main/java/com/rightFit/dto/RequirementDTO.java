package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequirementDTO {

    private Long id;

    private String requirementId;

    private String projectId;

    private String projectName;

    private String positionTitle;

    private String description;

    private String requiredSkills;

    private Integer minExperience;

    private Integer maxExperience;

    private String requiredCertifications;

    private String priority;

    private String status;

    private LocalDate allocationStartDate;

    private LocalDate allocationEndDate;

    private String createdByEmployeeId;

    private String createdByName;

    private String updatedByName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
