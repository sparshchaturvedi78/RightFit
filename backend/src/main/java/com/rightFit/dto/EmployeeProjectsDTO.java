package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Where an employee works: the projects they manage and the projects they are currently allocated to. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeProjectsDTO {

    /** Projects this employee is the Manager of. */
    private List<ProjectRefDTO> managing;

    /** Projects this employee is allocated to right now. */
    private List<AllocationRefDTO> allocations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectRefDTO {
        private String projectId;
        private String projectName;
        private String status;
        private String clientName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AllocationRefDTO {
        private String projectId;
        private String projectName;
        private String projectStatus;
        /** Their role on the team, e.g. "Developer" (from team membership) — may be empty. */
        private String role;
        /** Only known when they hold a capacity allocation. */
        private BigDecimal hoursPerDay;
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
