package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "allocation_id", nullable = false, unique = true)
    private String allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private ProjectRequirement requirement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_request_id")
    private AllocationRequest allocationRequest;

    @Column(name = "allocation_start_date", nullable = false)
    private LocalDate allocationStartDate;

    @Column(name = "allocation_end_date")
    private LocalDate allocationEndDate;

    @Column(name = "allocation_percentage", nullable = false)
    private Integer allocationPercentage;

    @Column(name = "allocation_status", nullable = false)
    private String allocationStatus;

    @Column(name = "allocation_end_reason")
    private String allocationEndReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_by")
    private Employee allocatedBy;

    @Column(name = "allocated_at", nullable = false)
    private LocalDateTime allocatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ended_by")
    private Employee endedBy;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

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
