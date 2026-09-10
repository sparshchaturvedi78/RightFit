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

    @Column(name = "bench_paused")
    private Boolean benchPaused;

    @Column(name = "pause_start_date")
    private LocalDateTime pauseStartDate;

    @Column(name = "pause_end_date")
    private LocalDateTime pauseEndDate;

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
