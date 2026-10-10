package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Candidate discovery / pipeline DTOs (Manager Phases 4-8). */
public final class CandidateDtos {

    private CandidateDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdentifyCandidateRequest {
        @NotBlank(message = "Employee ID is required")
        private String employeeId;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContactRequest {
        @NotBlank(message = "Subject is required")
        private String subject;
        @NotBlank(message = "Message is required")
        private String message;
        private String requirementId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ContactResultDTO {
        private String status;
        private String fromEmployeeId;
        private String fromName;
        private String toEmployeeId;
        private String toName;
        private String subject;
        private String message;
        private String requirementId;
        private LocalDateTime sentAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DecisionRequest {
        @NotBlank(message = "Decision is required")
        @Pattern(regexp = "SELECT|REJECT|HOLD", message = "Decision must be SELECT, REJECT or HOLD")
        private String decision;
        /** Required for REJECT: SKILL_GAP, EXPERIENCE_GAP, DOMAIN_MISMATCH, LOCATION_MISMATCH, WORK_MODE_MISMATCH, COMMUNICATION, PROJECT_FIT, OTHER */
        private String reasonCode;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CandidateDTO {
        private Long id;
        private String applicationId;
        private String requirementId;
        private String projectId;
        private String employeeId;
        private String employeeName;
        private String grade;
        private String designation;
        private String status;
        private String previousStatus;
        private String source;
        private String notes;
        private String identifiedByName;
        private LocalDateTime identifiedAt;
        private String shortlistedByName;
        private LocalDateTime shortlistedAt;
        private Boolean requiresInterview;
        private LocalDateTime confirmedAt;
        private String decision;
        private String decisionByName;
        private LocalDateTime decisionAt;
        private String decisionReason;
        private String rejectionReasonCode;
        private String rejectionComment;
        private LocalDateTime rejectedAt;
        private Boolean archived;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CandidateHistoryDTO {
        private String fromStatus;
        private String toStatus;
        private String changedByName;
        private String reason;
        private LocalDateTime changedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PipelineDTO {
        private String requirementId;
        private String requirementStatus;
        private Map<String, Long> stageCounts;
        private List<CandidateDTO> candidates;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SkillLevelDTO {
        private String skill;
        private Integer proficiency;
        private Integer yearsOfExperience;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PreferenceDTO {
        private String preferredTechnology;
        private String preferredDomain;
        private String preferredLocation;
        private String preferredWorkMode;
        private String preferredProjectType;
    }

    /** Permitted professional information only (BRD 26) - never salary. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EmployeeCandidateDTO {
        private String employeeId;
        private String name;
        private String email;
        private String phone;
        private String grade;
        private String designation;
        private String domain;
        private Double yearsOfExperience;
        private String location;
        private String employmentStatus;
        private String allocationStatus;
        private String availabilityStatus;
        private LocalDate availableFromDate;
        private String poolStatus;
        private Long benchDays;
        private BigDecimal workingHoursPerDay;
        private BigDecimal allocatedHoursPerDay;
        private List<SkillLevelDTO> skills;
        private List<String> certifications;
        private PreferenceDTO preferences;
        private List<String> currentProjects;
        private List<String> previousProjects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProjectLookupDTO {
        private String projectId;
        private String projectName;
        private String status;
        private String clientName;
        private String managerName;
    }
}
