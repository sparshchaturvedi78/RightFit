package com.rightFit.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmployeeRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Designation is required")
    private String designation;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotNull(message = "RMG ID is required")
    private Long rmgId;

    private String phone;

    private String grade;

    private String domain;

    private Double yearsOfExperience;

    private LocalDate dateOfJoining;

    private Double workingHoursPerDay;

    private Long locationId;

    private Long optionalRoleId;

    private String employmentStatus;

    private String allocationStatus;

    private String availabilityStatus;
}
