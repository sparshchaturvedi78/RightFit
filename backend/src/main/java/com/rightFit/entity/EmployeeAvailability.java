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
 * Temporary-unavailability request history (BRD 21). One row per request: an employee asks to go
 * unavailable until availableFrom, their RMG verifies it. Employee.availabilityStatus/availableFromDate
 * are the live, current-state fields this workflow drives - this table is the request/decision history.
 */
@Entity
@Table(name = "employee_availability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus;

    /** The requested/approved return-to-available date - drives Employee.availableFromDate on approval. */
    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private Employee verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_comment", columnDefinition = "TEXT")
    private String verificationComment;

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
