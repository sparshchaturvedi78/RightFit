package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assignment_id", nullable = false, unique = true)
    private String assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_program_id", nullable = false)
    private TrainingProgram trainingProgram;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejection_id")
    private Rejection rejection;

    @Column(name = "assignment_status", nullable = false)
    private String assignmentStatus;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expected_end_date")
    private LocalDate expectedEndDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "completion_status")
    private String completionStatus;

    @Column(name = "score")
    private Integer score;

    @Column(name = "certificate_id")
    private String certificateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private Employee assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

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
