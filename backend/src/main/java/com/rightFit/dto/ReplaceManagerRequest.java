package com.rightFit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplaceManagerRequest {

    /** Legacy numeric id. Prefer newManagerEmployeeId; at least one of the two is required. */
    private Long newManagerId;

    /** Business Employee ID of the replacement Manager, e.g. "EMP004". */
    private String newManagerEmployeeId;

    private List<Long> selectedProjectIds;

    /** Business Project IDs to transfer, e.g. ["PROJ001"]. Preferred over selectedProjectIds. */
    private List<String> selectedProjectBusinessIds;

    private List<Long> selectedOwnedRequirementIds;

    private List<ResponsibilitySelectionDTO> selectedResponsibilities;
}
