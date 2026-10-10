package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Dashboard DTOs for every persona (BRD 42, 43): Manager (Phase 13), and Admin/RMG/Associate below. */
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

    /** Admin Dashboard (BRD 42): the org-level counts every other Admin screen already shows
     * individually, bundled into one call - "total employees," "projects," "managers," etc. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminDashboardDTO {
        private long totalEmployees;
        private long activeEmployees;
        private long inactiveEmployees;
        private long totalProjects;
        private long activeProjects;
        private long totalManagers;
        private long totalRmgs;
        /** Projects whose assigned Manager has since gone INACTIVE - a replacement is overdue. */
        private long pendingManagerReplacements;
        /** Active employees still assigned to an RMG who has since gone INACTIVE. */
        private long pendingRmgReplacements;
        private long totalAuditEntries;
        private long auditEntriesLast24h;
        private long unreadNotifications;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RmgDashboardDTO {
        private long greenBench;
        private long amberBench;
        private long redBench;
        private long poolSize;
        private long openRequirements;
        /** Top 5 skills where demand exceeds supply, worst gap first - the full breakdown is one
         * call away at /api/rmg/demand-supply. */
        private List<DemandSupplyDtos.SkillDemandSupplyDTO> topSkillShortages;
        private long totalRejections;
        private Map<String, Long> rejectionsByReason;
        private long activeTrainingPrograms;
        private Map<String, Long> trainingAssignmentsByStatus;
        private Map<String, Long> allocationRequestsByStatus;
        private long unreadNotifications;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CurrentAllocationDTO {
        private String allocationId;
        private String projectId;
        private String projectName;
        private BigDecimal hoursPerDay;
        private LocalDate startDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssociateDashboardDTO {
        private String employmentStatus;
        private String allocationStatus;
        private String availabilityStatus;
        private String poolStatus;
        private long pendingInvitations;
        private long openOpportunities;
        private long upcomingInterviews;
        private List<CurrentAllocationDTO> currentAllocations;
        private long totalOpportunityHistory;
        private long activeTrainingAssignments;
        private long unreadNotifications;
    }
}
