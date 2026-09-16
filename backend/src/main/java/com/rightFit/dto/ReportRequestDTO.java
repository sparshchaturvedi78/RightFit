package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequestDTO {

    @NotBlank(message = "Report type is required")
    private String reportType;

    private LocalDate startDate;

    private LocalDate endDate;

    private String format;
}
