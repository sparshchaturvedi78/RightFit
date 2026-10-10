package com.rightFit.controller;

import com.rightFit.dto.DashboardDtos.AdminDashboardDTO;
import com.rightFit.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin Dashboard (BRD 42). */
@Slf4j
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'ADMIN_DASHBOARD_READ')")
    public ResponseEntity<AdminDashboardDTO> dashboard() {
        return ResponseEntity.ok(dashboardService.dashboard());
    }
}
