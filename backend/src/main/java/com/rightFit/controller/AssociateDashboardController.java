package com.rightFit.controller;

import com.rightFit.dto.DashboardDtos.AssociateDashboardDTO;
import com.rightFit.service.AssociateDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Associate Dashboard (BRD 42): invitations, opportunities, interviews, current allocation,
 * opportunity history, notifications - all scoped to the caller's own record. */
@Slf4j
@RestController
@RequestMapping("/api/associate/dashboard")
@RequiredArgsConstructor
public class AssociateDashboardController {

    private final AssociateDashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'ASSOCIATE_DASHBOARD_READ')")
    public ResponseEntity<AssociateDashboardDTO> dashboard() {
        return ResponseEntity.ok(dashboardService.dashboard());
    }
}
