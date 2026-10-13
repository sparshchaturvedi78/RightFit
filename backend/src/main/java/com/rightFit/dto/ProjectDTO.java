package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectDTO {

    private Long id;

    private String projectId;

    private String projectName;

    private String description;

    private Long managerId;

    private String managerName;
    /** Business ID of the manager, e.g. "EMP003". */
    private String managerEmployeeId;
    /** ACTIVE or INACTIVE — an inactive manager means the project needs a replacement. */
    private String managerEmploymentStatus;

    private String status;

    private LocalDate startDate;

    private LocalDate endDate;

    private String clientName;

    private Boolean managerClaimed;

    private LocalDateTime claimedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
