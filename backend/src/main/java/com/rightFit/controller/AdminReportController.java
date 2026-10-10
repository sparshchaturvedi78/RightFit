package com.rightFit.controller;

import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Reports (BRD 43). Previously a stub (hardcoded type list, fake "processing" response, fake
 * download URL - nothing behind any of it actually worked). Replaced with the same real,
 * synchronous row-based pattern ManagerDashboardService's reports already use: one GET to list
 * available types, one GET to fetch a report's rows directly - no fake async generate/download
 * round-trip, since there was never a real job system behind that shape to begin with.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Validated
public class AdminReportController {

    private final AdminReportService reportService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'REPORT_VIEW')")
    public ResponseEntity<List<String>> getAvailableReports() {
        log.info("Fetching available reports");
        return ResponseEntity.ok(reportService.availableTypes());
    }

    @GetMapping("/{type}")
    @PreAuthorize("hasPermission(null, 'REPORT_GENERATE')")
    public ResponseEntity<ReportDTO> report(@PathVariable String type) {
        log.info("Generating report: {}", type);
        return ResponseEntity.ok(reportService.report(type));
    }
}
