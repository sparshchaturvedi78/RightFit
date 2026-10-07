package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Interview DTOs (Manager Phase 7, BRD 15). */
public final class InterviewDtos {

    private InterviewDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleInterviewRequest {
        /** Defaults to the project's owning Manager (who can always interview directly, BR-011). */
        private String interviewerEmployeeId;
        @NotNull(message = "Scheduled time is required")
        @Future(message = "Scheduled time must be in the future")
        private LocalDateTime scheduledAt;
        @Min(value = 15, message = "Duration must be at least 15 minutes")
        @Max(value = 480, message = "Duration must not exceed 480 minutes")
        private Integer durationMinutes;
        @Pattern(regexp = "ONLINE|IN_PERSON|PHONE", message = "Mode must be ONLINE, IN_PERSON or PHONE")
        private String mode;
        private String locationOrLink;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InterviewResponseRequest {
        @NotBlank(message = "Response is required")
        @Pattern(regexp = "ACCEPT|DECLINE", message = "Response must be ACCEPT or DECLINE")
        private String response;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitFeedbackRequest {
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be 1-10")
        @Max(value = 10, message = "Rating must be 1-10")
        private Integer rating;
        @Min(1) @Max(10)
        private Integer technicalScore;
        @Min(1) @Max(10)
        private Integer communicationScore;
        @Min(1) @Max(10)
        private Integer culturalFitScore;
        /** Advisory only - the Manager makes the final decision (BRD 15.4, 16). */
        @NotBlank(message = "Recommendation is required")
        @Pattern(regexp = "SELECT|REJECT|ON_HOLD", message = "Recommendation must be SELECT, REJECT or ON_HOLD")
        private String recommendation;
        private String comments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FeedbackDTO {
        private Integer rating;
        private Integer technicalScore;
        private Integer communicationScore;
        private Integer culturalFitScore;
        private String recommendation;
        private String comments;
        private String givenByName;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class InterviewDTO {
        private Long id;
        private String interviewId;
        private String applicationId;
        private String requirementId;
        private String projectId;
        private String employeeId;
        private String employeeName;
        private String interviewerId;
        private String interviewerName;
        private String scheduledByName;
        private Integer roundNumber;
        private LocalDateTime scheduledAt;
        private Integer durationMinutes;
        private String mode;
        private String locationOrLink;
        private String notes;
        private String status;
        private LocalDateTime candidateResponseAt;
        private String candidateResponseComment;
        private LocalDateTime completedAt;
        private String cancelledReason;
        private FeedbackDTO feedback;
    }
}
