package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Invitation and Associate opportunity DTOs (Manager Phase 5, BRD 12). */
public final class InvitationDtos {

    private InvitationDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendInvitationRequest {
        private String message;
        private LocalDate responseDeadline;
        /** false = direct joining (the employee may respond JOIN). Defaults to true. */
        private Boolean requiresInterview;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvitationResponseRequest {
        @NotBlank(message = "Response is required")
        @Pattern(regexp = "ACCEPT|REJECT|JOIN", message = "Response must be ACCEPT, REJECT or JOIN")
        private String response;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConfirmationRequest {
        @NotBlank(message = "Decision is required")
        @Pattern(regexp = "ACCEPT|DECLINE", message = "Decision must be ACCEPT or DECLINE")
        private String decision;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class InvitationDTO {
        private Long id;
        private String invitationId;
        private String applicationId;
        private String requirementId;
        private String projectId;
        private String employeeId;
        private String employeeName;
        private String status;
        private String message;
        private Boolean requiresInterview;
        private String invitedByName;
        private LocalDateTime invitedAt;
        private LocalDate responseDeadline;
        private LocalDateTime viewedAt;
        private LocalDateTime respondedAt;
        private String responseComment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TeamMemberInfo {
        private String employeeId;
        private String name;
        private String designation;
        private String role;
    }

    /** The dedicated opportunity-details page (BRD 2.4, 12): project, requirement, team, members. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OpportunityDetailsDTO {
        private InvitationDTO invitation;
        private String projectId;
        private String projectName;
        private String projectDescription;
        private String clientName;
        private String projectStatus;
        private LocalDate projectStartDate;
        private LocalDate projectEndDate;
        private String managerName;
        private String requirementId;
        private String positionTitle;
        private String requirementDescription;
        private String requiredSkills;
        private Integer minExperience;
        private Integer maxExperience;
        private String requiredCertifications;
        private String priority;
        private LocalDate allocationStartDate;
        private LocalDate allocationEndDate;
        private List<TeamMemberInfo> team;
    }

    /** Associate "opportunity history" - deliberately omits the Manager's internal notes and decision reasoning. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OpportunityHistoryDTO {
        private String applicationId;
        private String requirementId;
        private String projectId;
        private String projectName;
        private String positionTitle;
        private String status;
        private Boolean confirmed;
        private LocalDateTime confirmedAt;
        private LocalDateTime updatedAt;
    }
}
