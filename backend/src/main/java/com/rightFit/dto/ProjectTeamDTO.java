package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** One page of a project's team (Admin Projects → project details), filterable by grade. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTeamDTO {

    private List<MemberDTO> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;

    /** Everyone on the team regardless of the grade filter — for the header count. */
    private long teamSize;

    /** Distinct grades present on the team, highest first — fills the grade filter. */
    private List<String> grades;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDTO {
        private Long id;
        private String employeeId;
        private String name;
        private String designation;
        private String grade;
        /** Role on the team, e.g. "Developer"; the manager shows as "Manager". */
        private String role;
        private boolean manager;
        private String employmentStatus;
        private BigDecimal hoursPerDay;
        private LocalDate since;
    }
}
