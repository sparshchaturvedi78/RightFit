package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Demand & Supply Analytics DTOs (BRD 27, FR-050/051). */
public final class DemandSupplyDtos {

    private DemandSupplyDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SkillDemandSupplyDTO {
        private String skillName;
        private String category;
        private long demand;
        private long supply;
        private long gap;
        /** True when demand exceeds supply - BRD's "High Demand + Low Supply" shortage signal. */
        private boolean shortage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemandSupplySummaryDTO {
        private long openRequirements;
        private long availableEmployees;
        private List<SkillDemandSupplyDTO> bySkill;
    }
}
