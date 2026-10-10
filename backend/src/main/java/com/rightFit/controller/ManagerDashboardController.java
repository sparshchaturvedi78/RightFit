package com.rightFit.controller;

import com.rightFit.dto.AuditLogDTO;
import com.rightFit.dto.DashboardDtos.ManagerDashboardDTO;
import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.service.ManagerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerDashboardController {

    private final ManagerDashboardService dashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasPermission(null, 'MANAGER_DASHBOARD_READ')")
    public ResponseEntity<ManagerDashboardDTO> dashboard() {
        return ResponseEntity.ok(dashboardService.dashboard());
    }

    @GetMapping("/reports/{report}")
    @PreAuthorize("hasPermission(null, 'MANAGER_DASHBOARD_READ')")
    public ResponseEntity<ReportDTO> report(@PathVariable String report) {
        return ResponseEntity.ok(dashboardService.report(report));
    }

    @GetMapping("/requirements/{requirementId}/history")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_READ')")
    public ResponseEntity<Page<AuditLogDTO>> requirementHistory(@PathVariable String requirementId,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dashboardService.requirementHistory(requirementId, page, size));
    }
}
