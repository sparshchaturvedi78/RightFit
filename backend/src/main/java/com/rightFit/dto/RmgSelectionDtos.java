package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** RMG views: a person's selection history, and the open requirements an RMG can recommend people to. */
public final class RmgSelectionDtos {

    private RmgSelectionDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SelectionDTO {
        private String applicationId;
        private String requirementId;
        private String positionTitle;
        private String projectName;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime confirmedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OpenRequirementDTO {
        private String requirementId;
        private String positionTitle;
        private String projectName;
        private String priority;
        private String requiredSkills;
        private Integer minExperience;
        private Integer maxExperience;
        private java.time.LocalDate allocationStartDate;
    }
}
