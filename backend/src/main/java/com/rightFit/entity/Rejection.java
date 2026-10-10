package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * One row per candidate rejection (BRD 28), feeding RMG's repeated-rejection analysis and the
 * training-assignment workflow it can trigger. Written by CandidateDecisionService at the same
 * moment it stamps the rejection reason onto CandidateApplication - that denormalized copy is for
 * quick per-candidate display, this table is the cross-candidate history RMG actually reports on.
 */
@Entity
@Table(name = "rejections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rejection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rejection_id", unique = true)
    private String rejectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_application_id", nullable = false)
    private CandidateApplication candidateApplication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private ProjectRequirement requirement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejection_reason_id", nullable = false)
    private RejectionReason rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by", nullable = false)
    private Employee rejectedBy;

    @Column(name = "rejection_date", nullable = false)
    private LocalDateTime rejectionDate;

    @Column(name = "rejection_comment", columnDefinition = "TEXT")
    private String rejectionComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_feedback_id")
    private InterviewFeedback interviewFeedback;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "rejection")
    private Set<TrainingAssignment> trainingAssignments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (rejectionDate == null) {
            rejectionDate = LocalDateTime.now();
        }
    }
}
