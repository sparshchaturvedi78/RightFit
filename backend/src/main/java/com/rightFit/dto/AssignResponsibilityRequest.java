package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignResponsibilityRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "Responsibility type is required")
    @Pattern(regexp = "SOURCER|INTERVIEWER|COORDINATOR",
            message = "Responsibility type must be SOURCER, INTERVIEWER or COORDINATOR")
    private String responsibilityType;
}
