package com.rightFit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/** Admin Skills page: categories, a skill's associates, and the header numbers. */
public final class SkillCatalogDtos {

    private SkillCatalogDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SkillCategoryDTO {
        private Long id;
        private String name;
        private String description;
        private Boolean isActive;
        /** Skills in this category, retired ones included. */
        private long skillCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateSkillCategoryRequest {
        @NotBlank(message = "Category name is required")
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateSkillCategoryRequest {
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HolderDTO {
        private Long id;
        private String employeeId;
        private String name;
        private String designation;
        private Integer proficiencyLevel;
        private Integer yearsOfExperience;
        private LocalDate lastUsedDate;
    }

    /** One skill's associates, one page at a time, with the numbers above the list. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SkillHoldersDTO {
        private AssociateProfileDtos.SkillDTO skill;
        /** Active people holding the skill, whatever the level filter. */
        private long activeHolders;
        /** Of those, how many are at level 7 or higher. */
        private long atLevelSevenOrAbove;
        /** Published requirements that name this skill in their skills text (a plain text match). */
        private long openRequirements;
        private List<HolderDTO> content;
        private long totalElements;
        private int totalPages;
        private int number;
        private int size;
    }
}
