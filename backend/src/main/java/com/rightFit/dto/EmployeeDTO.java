package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmployeeDTO {

    private Long id;

    private String employeeId;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String grade;

    private String designation;

    private String domain;

    private Double yearsOfExperience;

    private LocalDate dateOfJoining;

    private String poolStatus;

    private Double workingHoursPerDay;

    private Long departmentId;

    private String departmentName;

    private Long locationId;

    private String locationName;

    private Long rmgId;

    private String rmgName;

    /** Business ID of the person this employee reports to (an RMG, or an Admin for RMGs). */
    private String rmgEmployeeId;

    private String employmentStatus;

    private String allocationStatus;

    /**
     * What the Admin screens show instead of the raw flag: true = in an active project (member, allocation, or the
     * Manager of one), false = free. null = not applicable (Admins and RMGs are not allocated to projects; people
     * report to them).
     */
    // The class omits nulls; here null means "not applicable" (Admin / RMG) and must reach the client.
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private Boolean inProject;

    private String availabilityStatus;

    private LocalDate availableFromDate;

    private Long userId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;

    private Set<String> roles;
}
