package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Training Management DTOs (BRD 29, FR-053). */
public final class TrainingDtos {

    private TrainingDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTrainingProgramRequest {
        @NotBlank(message = "Program name is required")
        private String programName;
        private String description;
        private Integer durationDays;
        private String trainingType;
        private String provider;
        private BigDecimal cost;
        private String requiredCertifications;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTrainingProgramRequest {
        private String programName;
        private String description;
        private Integer durationDays;
        private String trainingType;
        private String provider;
        private BigDecimal cost;
        private String requiredCertifications;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrainingProgramDTO {
        private String programId;
        private String programName;
        private String description;
        private Integer durationDays;
        private String trainingType;
        private String provider;
        private BigDecimal cost;
        private String requiredCertifications;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignTrainingRequest {
        @NotEmpty(message = "At least one employee ID is required")
        private List<String> employeeIds;
        /** Optional - links this assignment to the rejection that prompted it. */
        private String rejectionId;
        private LocalDate startDate;
        private LocalDate expectedEndDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTrainingAssignmentRequest {
        private String assignmentStatus;
        private String completionStatus;
        private Integer score;
        private String certificateId;
        private LocalDate actualEndDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrainingAssignmentDTO {
        private String assignmentId;
        private String employeeId;
        private String employeeName;
        private String programId;
        private String programName;
        private String rejectionId;
        private String assignmentStatus;
        private LocalDate startDate;
        private LocalDate expectedEndDate;
        private LocalDate actualEndDate;
        private String completionStatus;
        private Integer score;
        private String certificateId;
        private String assignedByName;
        private LocalDateTime assignedAt;
    }
}
