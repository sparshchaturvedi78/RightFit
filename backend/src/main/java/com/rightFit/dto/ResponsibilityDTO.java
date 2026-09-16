package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponsibilityDTO {

    private Long requirementId;

    private String requirementTitle;

    private String responsibility;

    private String currentOwnerId;
}
