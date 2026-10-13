package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Reference data used to fill dropdowns on the Admin screens. */
public final class LookupDtos {

    private LookupDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentDTO {
        private Long id;
        private String name;
        private String code;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationDTO {
        private Long id;
        private String name;
        private String city;
        private String country;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LookupsDTO {
        private List<DepartmentDTO> departments;
        private List<LocationDTO> locations;
        private List<String> designations;
    }
}
