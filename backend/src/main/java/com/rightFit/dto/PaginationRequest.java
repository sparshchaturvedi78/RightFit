package com.rightFit.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginationRequest {

    @Min(value = 0, message = "Page number must be >= 0")
    private Integer page;

    @Min(value = 1, message = "Page size must be >= 1")
    @Max(value = 100, message = "Page size must be <= 100")
    private Integer size;

    private String sortBy;
    private String sortDirection; // ASC or DESC

    public Integer getPage() {
        return page != null ? page : 0;
    }

    public Integer getSize() {
        return size != null ? size : 20;
    }
}
