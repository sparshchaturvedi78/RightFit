package com.rightFit.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmployeeRequest {

    private String firstName;

    private String lastName;

    @Email(message = "Email should be valid")
    private String email;

    private String designation;

    private String grade;

    private String domain;

    private String phone;

    private Double yearsOfExperience;

    private Double workingHoursPerDay;

    private String poolStatus;

    private String employmentStatus;

    private String allocationStatus;

    private String availabilityStatus;

    private LocalDate availableFromDate;

    private Long departmentId;

    private Long locationId;
}
