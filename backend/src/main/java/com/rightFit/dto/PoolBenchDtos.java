package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Resource Pool and Bench governance DTOs (RMG phase, BRD 22 / BR-028-030). */
public final class PoolBenchDtos {

    private PoolBenchDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PoolEntryDTO {
        private String employeeId;
        private String name;
        private String designation;
        private String grade;
        private String departmentName;
        private LocalDateTime inPoolSince;
        private String entryReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PoolHistoryEntryDTO {
        private LocalDateTime entryDate;
        private LocalDateTime exitDate;
        private String entryReason;
        private String exitReason;
        private Boolean isCurrent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PoolDetailDTO {
        private String employeeId;
        private String name;
        private String poolStatus;
        private List<PoolHistoryEntryDTO> history;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BenchEntryDTO {
        private String employeeId;
        private String name;
        private String designation;
        private String grade;
        private String departmentName;
        private LocalDate benchStartDate;
        private Integer pausedDays;
        private int daysOnBench;
        private String benchStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BenchHistoryEntryDTO {
        private LocalDate benchStartDate;
        private LocalDate benchEndDate;
        private Integer daysOnBench;
        private Integer pausedDays;
        private String benchStatus;
        private Boolean isCurrent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BenchDetailDTO {
        private String employeeId;
        private String name;
        private List<BenchHistoryEntryDTO> history;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BenchSummaryDTO {
        private long green;
        private long amber;
        private long red;
        private long total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BenchConfigurationDTO {
        private Long id;
        private Integer greenMaxDays;
        private Integer amberMaxDays;
        private Integer redThresholdDays;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateBenchConfigurationRequest {
        @NotNull(message = "Green threshold (max days) is required")
        @Min(value = 1, message = "Green threshold must be at least 1 day")
        private Integer greenMaxDays;
        @NotNull(message = "Amber threshold (max days) is required")
        @Min(value = 1, message = "Amber threshold must be at least 1 day")
        private Integer amberMaxDays;
        @NotNull(message = "Red threshold (days) is required")
        @Min(value = 1, message = "Red threshold must be at least 1 day")
        private Integer redThresholdDays;
        /** Defaults to today. */
        private LocalDate effectiveFrom;
    }
}
