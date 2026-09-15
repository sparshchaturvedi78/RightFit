package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"user", "subordinates"})
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "grade")
    private String grade;

    @Column(name = "designation")
    private String designation;

    @Column(name = "domain")
    private String domain;

    @Column(name = "years_of_experience")
    private Double yearsOfExperience;

    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;

    @Column(name = "pool_status")
    private String poolStatus;

    @Column(name = "working_hours_per_day")
    private Double workingHoursPerDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rmg_id")
    private Employee rmgManager;

    @OneToMany(mappedBy = "rmgManager")
    private Set<Employee> subordinates;

    @Column(name = "employment_status", nullable = false)
    private String employmentStatus;

    @Column(name = "allocation_status", nullable = false)
    private String allocationStatus;

    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus;

    @Column(name = "available_from_date")
    private LocalDate availableFromDate;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmployeeSkill> skills;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmployeeCertification> certifications;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL)
    private EmployeePreference preferences;

    @OneToMany(mappedBy = "employee")
    private Set<Allocation> allocations;

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
