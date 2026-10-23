package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** What an associate sees about work: open requirements to apply to, their project team, and their hiring duties. */
public class AssociateDtos {

    private AssociateDtos() {
    }

    /** A published requirement an unallocated associate can apply to, with where they already stand on it. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OpenRequirementDTO {
        private String requirementId;
        private String positionTitle;
        private String description;
        private String projectId;
        private String projectName;
        private String managerName;
        private String requiredSkills;
        private String requiredCertifications;
        private Integer minExperience;
        private Integer maxExperience;
        private String priority;
        private LocalDate allocationStartDate;
        private LocalDate allocationEndDate;
        /** The associate's candidacy on this requirement, when they have one. */
        private String myApplicationId;
        private String myStatus;
    }

    /** A project the associate is allocated to, with the people on it. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MyProjectDTO {
        private String projectId;
        private String projectName;
        private String clientName;
        private String description;
        private String status;
        private LocalDate projectStartDate;
        private LocalDate projectEndDate;
        private String managerName;
        private String managerEmployeeId;
        private String managerEmail;
        private BigDecimal myHoursPerDay;
        private LocalDate myStartDate;
        private LocalDate myEndDate;
        private String myRole;
        private Double myWorkingHoursPerDay;
        private List<TeamPersonDTO> team;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TeamPersonDTO {
        private String employeeId;
        private String name;
        private String designation;
        private String email;
        /** MANAGER for the project's manager, otherwise the role on the allocation. */
        private String role;
        private BigDecimal hoursPerDay;
        private boolean me;
    }

    /** One hiring responsibility the associate holds, with what is waiting on them for it. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DutyDTO {
        private String requirementId;
        private String positionTitle;
        private String projectName;
        private String requirementStatus;
        /** SOURCER, COORDINATOR or INTERVIEWER. */
        private String responsibility;
        /** SOURCER: candidates identified and waiting to be shortlisted. */
        private long toShortlist;
        /** COORDINATOR: shortlisted candidates to invite, and accepted ones to book an interview for. */
        private long toInvite;
        private long toBook;
        /** INTERVIEWER: interviews still to take, and past ones still without feedback. */
        private long upcomingInterviews;
        private long feedbackDue;
    }
}
