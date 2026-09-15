package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeSearchRequest {

    private String employeeId;

    private String firstName;

    private String lastName;

    private String email;

    private String designation;

    private Long departmentId;

    private Long rmgId;

    private String status;

    private String skills;

    private Long locationId;

    private int page;

    private int size;

    private String sortBy;

    private String sortDirection;
}
