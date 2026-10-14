package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Admin Assignments page: people who have left but still hold work that needs a new owner. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingHandoversDTO {

    /** Inactive managers who still manage ACTIVE projects; count = those projects. */
    private List<ItemDTO> managers;

    /** Inactive RMGs whom ACTIVE employees still report to; count = those employees. */
    private List<ItemDTO> rmgs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemDTO {
        private Long id;
        private String employeeId;
        private String name;
        private String designation;
        private long count;
    }
}
