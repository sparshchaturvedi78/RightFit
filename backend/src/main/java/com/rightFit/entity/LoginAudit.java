package com.rightFit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_audit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "email")
    private String email;

    @Column(name = "login_status", nullable = false)
    private String loginStatus; // SUCCESS, FAILED, LOCKED, INVALID_CREDENTIALS

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "login_timestamp", nullable = false, updatable = false)
    private LocalDateTime loginTimestamp;

    @PrePersist
    protected void onCreate() {
        loginTimestamp = LocalDateTime.now();
    }
}
