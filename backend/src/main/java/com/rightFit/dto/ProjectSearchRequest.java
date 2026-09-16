package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSearchRequest {

    @NotBlank(message = "Search query is required")
    private String query;

    private Integer page;

    private Integer size;
}
