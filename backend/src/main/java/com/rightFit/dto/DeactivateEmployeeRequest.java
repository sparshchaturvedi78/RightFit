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
public class DeactivateEmployeeRequest {

    @NotBlank(message = "Reason for deactivation is required")
    private String reason;

    private LocalDate effectiveDate;
}
