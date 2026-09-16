package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeePreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(name = "preferred_technology", columnDefinition = "TEXT")
    private String preferredTechnology;

    @Column(name = "preferred_domain", columnDefinition = "TEXT")
    private String preferredDomain;

    @Column(name = "preferred_location")
    private String preferredLocation;

    @Column(name = "preferred_work_mode")
    private String preferredWorkMode;

    @Column(name = "preferred_project_type", columnDefinition = "TEXT")
    private String preferredProjectType;

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
