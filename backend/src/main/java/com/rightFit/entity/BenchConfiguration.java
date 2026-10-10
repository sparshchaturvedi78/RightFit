package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Org-wide bench-aging policy (green/amber/red thresholds), temporally versioned: creating a new
 * one closes out whichever row was previously active. Replaces the old BenchThreshold entity, which
 * pointed at a "bench_thresholds" table that was never actually migrated - this maps to the real
 * "bench_configuration" table instead (see V5__Create_resource_pool_and_bench.sql).
 */
@Entity
@Table(name = "bench_configuration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "green_max_days", nullable = false)
    private Integer greenMaxDays;

    @Column(name = "amber_max_days", nullable = false)
    private Integer amberMaxDays;

    @Column(name = "red_threshold_days", nullable = false)
    private Integer redThresholdDays;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
