package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Manager dashboard and report DTOs (Manager Phase 13, BRD 42, 43). */
public final class DashboardDtos {

    private DashboardDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectStaffingDTO {
        private String projectId;
        private String projectName;
        private String status;
        private Boolean claimed;
        private int activeMembers;
        private BigDecimal allocatedHoursPerDay;
        private long openRequirements;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ManagerDashboardDTO {
        private int totalProjects;
        private int claimedProjects;
        private int pendingClaimProjects;
        private Map<String, Long> requirementsByStatus;
        private Map<String, Long> candidatePipeline;
        private long pendingInvitations;
        private long upcomingInterviews;
        private long pendingDecisions;
        private Map<String, Long> allocationRequestsByStatus;
        private long teamMembers;
        private BigDecimal totalAllocatedHoursPerDay;
        private long unreadNotifications;
        private List<ProjectStaffingDTO> projectStaffing;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportDTO {
        private String report;
        private LocalDateTime generatedAt;
        private int rowCount;
        private List<Map<String, Object>> rows;
    }
}
