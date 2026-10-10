package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bench_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "bench_start_date", nullable = false)
    private LocalDate benchStartDate;

    @Column(name = "bench_end_date")
    private LocalDate benchEndDate;

    @Column(name = "days_on_bench")
    private Integer daysOnBench;

    @Column(name = "bench_status", nullable = false)
    private String benchStatus;

    /** Days excluded from aging (e.g. verified temporary unavailability) - subtracted before classifying. */
    @Column(name = "paused_days")
    private Integer pausedDays;

    /** Set when a pause starts (availability approved), cleared when it ends (restored) - lets the Associate
     * phase compute the elapsed pause length to add to pausedDays. Null when not currently paused. */
    @Column(name = "pause_started_at")
    private LocalDateTime pauseStartedAt;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent;

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
