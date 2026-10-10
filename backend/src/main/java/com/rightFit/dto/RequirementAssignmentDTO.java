package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequirementAssignmentDTO {

    private Long id;

    private String requirementId;

    private String employeeId;

    private String employeeName;

    private String responsibilityType;

    private LocalDateTime assignedAt;

    private Long assignedBy;

    private Boolean isActive;
}
