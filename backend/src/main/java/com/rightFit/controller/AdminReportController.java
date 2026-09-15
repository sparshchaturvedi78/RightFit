package com.rightFit.controller;

import com.rightFit.dto.ReportRequestDTO;
import com.rightFit.dto.ReportDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Validated
public class AdminReportController {

    @GetMapping
    @PreAuthorize("hasPermission(null, 'REPORT_VIEW')")
    public ResponseEntity<List<String>> getAvailableReports() {
        log.info("Fetching available reports");
        List<String> reports = Arrays.asList(
                "EMPLOYEE_ACTIVITY",
                "PROJECT_ACTIVITY",
                "ADMIN_ACTION",
                "USER_ACCESS"
        );
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasPermission(null, 'REPORT_GENERATE')")
    public ResponseEntity<ReportDTO> generateReport(@Valid @RequestBody ReportRequestDTO request) {
        log.info("Generating report: {}", request.getReportType());

        ReportDTO report = ReportDTO.builder()
                .reportType(request.getReportType())
                .status("PROCESSING")
                .generatedAt(LocalDateTime.now())
                .format(request.getFormat() != null ? request.getFormat() : "PDF")
                .message("Report generation started")
                .build();

        return ResponseEntity.ok(report);
    }

    @GetMapping("/{reportId}/download")
    @PreAuthorize("hasPermission(null, 'REPORT_DOWNLOAD')")
    public ResponseEntity<String> downloadReport(@PathVariable Long reportId) {
        log.info("Downloading report: {}", reportId);
        return ResponseEntity.ok("Report download URL: /api/admin/reports/" + reportId + "/file");
    }
}
