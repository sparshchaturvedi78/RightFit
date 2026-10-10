package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** One row of the "assign a responsibility" dropdown: the employee plus how loaded they already are. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponsibilityDirectoryDTO {

    private String employeeId;

    private String name;

    private String email;

    private String designation;

    private String grade;

    /** Active responsibilities across all projects. */
    private Workload workload;

    /** Active responsibilities on requirements of the selected project only. */
    private Workload projectWorkload;

    /** Responsibilities this employee already holds on the requirement passed as requirementId (if any). */
    private List<String> heldOnRequirement;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Workload {
        private int sourcer;
        private int interviewer;
        private int coordinator;
        private int total;
    }
}
