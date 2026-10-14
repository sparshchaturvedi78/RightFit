package com.rightFit.controller;

import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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

    /** Departments and their head count for the department filter. REPORT_VIEW, so Manager and RMG can use it too. */
    @GetMapping("/departments")
    @PreAuthorize("hasPermission(null, 'REPORT_VIEW')")
    public ResponseEntity<List<java.util.Map<String, Object>>> departments() {
        return ResponseEntity.ok(reportService.departments());
    }

    /** Which filters a report supports (date and department), so the page shows only those. */
    @GetMapping("/{type}/filters")
    @PreAuthorize("hasPermission(null, 'REPORT_VIEW')")
    public ResponseEntity<java.util.Map<String, Boolean>> filters(@PathVariable String type) {
        return ResponseEntity.ok(reportService.filtersFor(type));
    }

    @GetMapping("/{type}")
    @PreAuthorize("hasPermission(null, 'REPORT_GENERATE')")
    public ResponseEntity<ReportDTO> report(
            @PathVariable String type,
            @RequestParam(required = false) java.time.LocalDate from,
            @RequestParam(required = false) java.time.LocalDate to,
            @RequestParam(required = false) String department) {
        log.info("Generating report: {} from={} to={} department={}", type, from, to, department);
        return ResponseEntity.ok(reportService.report(type, new AdminReportService.ReportFilter(from, to, department)));
    }

    /** The same rows as the screen, as a CSV file. */
    @GetMapping("/{type}/csv")
    @PreAuthorize("hasPermission(null, 'REPORT_GENERATE')")
    public ResponseEntity<String> reportCsv(
            @PathVariable String type,
            @RequestParam(required = false) java.time.LocalDate from,
            @RequestParam(required = false) java.time.LocalDate to,
            @RequestParam(required = false) String department) {
        log.info("Exporting report CSV: {} from={} to={} department={}", type, from, to, department);
        AdminReportService.ReportFilter filter = new AdminReportService.ReportFilter(from, to, department);
        reportService.assertDownloadable(type, filter);
        ReportDTO report = reportService.report(type, filter);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + type + "-report.csv\"")
                .header("Content-Type", "text/csv")
                .body(reportService.toCsv(report));
    }

    /** The same rows as the screen, as an Excel workbook. */
    @GetMapping("/{type}/xlsx")
    @PreAuthorize("hasPermission(null, 'REPORT_GENERATE')")
    public ResponseEntity<byte[]> reportXlsx(
            @PathVariable String type,
            @RequestParam(required = false) java.time.LocalDate from,
            @RequestParam(required = false) java.time.LocalDate to,
            @RequestParam(required = false) String department) {
        log.info("Exporting report Excel: {} from={} to={} department={}", type, from, to, department);
        AdminReportService.ReportFilter filter = new AdminReportService.ReportFilter(from, to, department);
        reportService.assertDownloadable(type, filter);
        ReportDTO report = reportService.report(type, filter);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + type + "-report.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(reportService.toXlsx(report));
    }
}
