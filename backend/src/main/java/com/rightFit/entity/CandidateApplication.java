package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false, unique = true)
    private String applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private ProjectRequirement requirement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "identified_by")
    private Employee identifiedBy;

    @Column(name = "identified_at", nullable = false)
    private LocalDateTime identifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shortlisted_by")
    private Employee shortlistedBy;

    @Column(name = "shortlisted_at")
    private LocalDateTime shortlistedAt;

    @Builder.Default
    @Column(name = "requires_interview", nullable = false)
    private Boolean requiresInterview = true;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "decision")
    private String decision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_by")
    private Employee decisionBy;

    @Column(name = "decision_at")
    private LocalDateTime decisionAt;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;

    @Column(name = "rejection_reason_code")
    private String rejectionReasonCode;

    @Column(name = "rejection_comment", columnDefinition = "TEXT")
    private String rejectionComment;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Builder.Default
    @Column(name = "archived", nullable = false)
    private Boolean archived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (identifiedAt == null) {
            identifiedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
