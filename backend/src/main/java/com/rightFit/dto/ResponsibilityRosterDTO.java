package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Current SOURCER / INTERVIEWER / COORDINATOR holders - "who actually is one", not the assignable list. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponsibilityRosterDTO {

    private List<Holder> sourcer;

    private List<Holder> interviewer;

    private List<Holder> coordinator;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Holder {
        private String employeeId;
        private String name;
        /** Requirement IDs (within the scope of this call) where the employee holds this responsibility. */
        private List<String> requirementIds;
    }
}
