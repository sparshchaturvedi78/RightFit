package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSearchRequest {

    private String projectId;

    private String projectName;

    private String status;

    private Long managerId;

    private String clientName;

    private int page;

    private int size;

    private String sortBy;

    private String sortDirection;
}
