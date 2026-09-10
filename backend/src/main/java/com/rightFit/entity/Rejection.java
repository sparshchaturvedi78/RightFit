package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "rejections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rejection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rejection_id", nullable = false, unique = true)
    private String rejectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private ProjectRequirement requirement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reason_id", nullable = false)
    private RejectionReason reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private CandidateApplication application;

    @Column(name = "additional_comments", columnDefinition = "TEXT")
    private String additionalComments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private Employee rejectedBy;

    @Column(name = "rejected_at", nullable = false)
    private LocalDateTime rejectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "rejection")
    private Set<TrainingAssignment> trainingAssignments;

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
