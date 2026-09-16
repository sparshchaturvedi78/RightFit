package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {

    private Long userId;
    private String employeeId;
    private String email;
    private String firstName;
    private String lastName;
    private String designation;
    private String department;
    private String grade;
    private Set<String> roles;
    private String status;
    private String employmentStatus;
    private String allocationStatus;
}
