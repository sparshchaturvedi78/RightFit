package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Allocation request, allocation, team and capacity DTOs (Manager Phases 9-10, BRD 7, 17). */
public final class AllocationDtos {

    private AllocationDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAllocationRequestRequest {
        /** Defaults to the requirement's allocation start date, else today. */
        private LocalDate startDate;
        private LocalDate endDate;
        @NotNull(message = "Hours per day is required")
        @DecimalMin(value = "0.5", message = "Hours per day must be at least 0.5")
        @DecimalMax(value = "24", message = "Hours per day must not exceed 24")
        private BigDecimal hoursPerDay;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewRequest {
        private String comments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AllocationRequestDTO {
        private Long id;
        private String requestId;
        private String applicationId;
        private String requirementId;
        private String projectId;
        private String projectName;
        private String employeeId;
        private String employeeName;
        private String submittedByName;
        private LocalDate requestedStartDate;
        private LocalDate requestedEndDate;
        private BigDecimal requestedHoursPerDay;
        private String status;
        private LocalDateTime submittedAt;
        private String reviewedByName;
        private LocalDateTime reviewedAt;
        private String reviewComments;
        private String rejectionReason;
        private BigDecimal employeeWorkingHoursPerDay;
        private BigDecimal employeeAllocatedHoursPerDay;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AllocationDTO {
        private Long id;
        private String allocationId;
        private String projectId;
        private String projectName;
        private String employeeId;
        private String employeeName;
        private String requirementId;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal hoursPerDay;
        private String status;
        private String endReason;
        private String createdByName;
        private String endedByName;
        private LocalDateTime endedAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AllocationEventDTO {
        private String allocationId;
        private String employeeId;
        private String eventType;
        private String details;
        private String performedByName;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddTeamMemberRequest {
        @NotBlank(message = "Employee ID is required")
        private String employeeId;
        private String role;
        @NotNull(message = "Hours per day is required")
        @DecimalMin(value = "0.5", message = "Hours per day must be at least 0.5")
        @DecimalMax(value = "24", message = "Hours per day must not exceed 24")
        private BigDecimal hoursPerDay;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TeamMemberDTO {
        private String employeeId;
        private String name;
        private String designation;
        private String role;
        private LocalDateTime joinedAt;
        private String allocationId;
        private BigDecimal hoursPerDay;
        private LocalDate allocationStartDate;
        private LocalDate allocationEndDate;
        private String requirementId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamDTO {
        private String projectId;
        private String projectName;
        private String managerName;
        private int memberCount;
        private BigDecimal totalHoursPerDay;
        private List<TeamMemberDTO> members;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MoveAllocationRequest {
        @NotBlank(message = "Source project is required")
        private String fromProjectId;
        @NotBlank(message = "Target project is required")
        private String toProjectId;
        /** Defaults to the hours currently allocated on the source project. */
        @DecimalMin(value = "0.5")
        @DecimalMax(value = "24")
        private BigDecimal hoursPerDay;
        private LocalDate effectiveDate;
        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SplitEntry {
        @NotBlank(message = "Project ID is required")
        private String projectId;
        @NotNull(message = "Hours per day is required")
        @DecimalMin(value = "0.5", message = "Hours per day must be at least 0.5")
        @DecimalMax(value = "24", message = "Hours per day must not exceed 24")
        private BigDecimal hoursPerDay;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SplitAllocationRequest {
        @NotEmpty(message = "At least one project allocation is required")
        @Valid
        private List<SplitEntry> allocations;
        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CapacityDTO {
        private String employeeId;
        private String name;
        private BigDecimal workingHoursPerDay;
        private BigDecimal allocatedHoursPerDay;
        private BigDecimal availableHoursPerDay;
        private String allocationStatus;
        private List<AllocationDTO> activeAllocations;
    }
}
