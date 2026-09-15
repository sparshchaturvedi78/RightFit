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

    private String departingName;

    private String departingRole;

    private List<ProjectDTO> projects;

    private int projectCount;

    private List<Long> ownedRequirementIds;

    private int ownedRequirementCount;

    private List<ResponsibilityDTO> responsibilities;

    private int responsibilityCount;

    private List<Long> employeeIds;

    private int employeeCount;

    private String message;
}
