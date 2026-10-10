package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Rejection Management DTOs (BRD 28, FR-052). */
public final class RejectionDtos {

    private RejectionDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RejectionDTO {
        private String rejectionId;
        private String applicationId;
        private String employeeId;
        private String employeeName;
        private String projectId;
        private String projectName;
        private String requirementId;
        private String positionTitle;
        private String reasonName;
        private String reasonCategory;
        private String rejectedByName;
        private LocalDateTime rejectionDate;
        private String rejectionComment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeRejectionHistoryDTO {
        private String employeeId;
        private String employeeName;
        private long totalRejections;
        private Map<String, Long> byReason;
        private List<RejectionDTO> history;
    }
}
