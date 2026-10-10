package com.rightFit.controller;

import com.rightFit.dto.PoolBenchDtos.BenchConfigurationDTO;
import com.rightFit.dto.PoolBenchDtos.CreateBenchConfigurationRequest;
import com.rightFit.service.BenchConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Org-wide bench threshold policy (BRD 7.1). Admin sets it; RMG only reads it (see BENCH_READ grant). */
@Slf4j
@RestController
@RequestMapping("/api/admin/bench-configuration")
@RequiredArgsConstructor
@Validated
public class AdminBenchConfigurationController {

    private final BenchConfigurationService configService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'BENCH_READ')")
    public ResponseEntity<BenchConfigurationDTO> current() {
        log.info("Fetching current bench configuration");
        return ResponseEntity.ok(configService.current());
    }

    @GetMapping("/history")
    @PreAuthorize("hasPermission(null, 'BENCH_READ')")
    public ResponseEntity<List<BenchConfigurationDTO>> history() {
        log.info("Fetching bench configuration history");
        return ResponseEntity.ok(configService.history());
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'BENCH_CONFIGURATION_MANAGE')")
    public ResponseEntity<BenchConfigurationDTO> create(@Valid @RequestBody CreateBenchConfigurationRequest request) {
        log.info("Creating new bench configuration: green<={}, amber<={}, red>={}",
                request.getGreenMaxDays(), request.getAmberMaxDays(), request.getRedThresholdDays());
        return ResponseEntity.ok(configService.create(request));
    }
}
