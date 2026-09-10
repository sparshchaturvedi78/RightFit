package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_pool_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourcePoolEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "entry_date", nullable = false)
    private LocalDateTime entryDate;

    @Column(name = "exit_date")
    private LocalDateTime exitDate;

    @Column(name = "entry_reason")
    private String entryReason;

    @Column(name = "exit_reason")
    private String exitReason;

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
