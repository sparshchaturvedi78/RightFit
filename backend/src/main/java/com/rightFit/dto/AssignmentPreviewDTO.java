package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentPreviewDTO {

    private Long departingId;

    private String departingEmployeeId;

    private String departingName;

    private String departingRole;

    /** ACTIVE / INACTIVE — handovers are usually for someone who has left, but can be done before they go. */
    private String departingStatus;

    private List<ProjectDTO> projects;

    private int projectCount;

    private List<Long> ownedRequirementIds;

    private int ownedRequirementCount;

    private List<ResponsibilityDTO> responsibilities;

    private int responsibilityCount;

    private List<Long> employeeIds;

    private int employeeCount;

    /** RMG handover: the active people reporting to the departing RMG, with what the picker shows. */
    private List<PersonDTO> people;

    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PersonDTO {
        private Long id;
        private String employeeId;
        private String name;
        private String designation;
        private String grade;
    }
}
