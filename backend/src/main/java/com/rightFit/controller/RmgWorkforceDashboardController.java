package com.rightFit.controller;

import com.rightFit.dto.DashboardDtos.RmgDashboardDTO;
import com.rightFit.service.RmgWorkforceDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** RMG Dashboard (BRD 42): bench/demand-supply/rejection/training/allocation summary. */
@Slf4j
@RestController
@RequestMapping("/api/rmg/dashboard")
@RequiredArgsConstructor
public class RmgWorkforceDashboardController {

    private final RmgWorkforceDashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'RMG_DASHBOARD_READ')")
    public ResponseEntity<RmgDashboardDTO> dashboard() {
        return ResponseEntity.ok(dashboardService.dashboard());
    }
}
