package com.rightFit.controller;

import com.rightFit.dto.PoolBenchDtos.BenchDetailDTO;
import com.rightFit.dto.PoolBenchDtos.BenchEntryDTO;
import com.rightFit.dto.PoolBenchDtos.BenchSummaryDTO;
import com.rightFit.service.BenchTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RMG Phase: Bench visibility (BRD 7.1), with green/amber/red computed live on every read.
 * Pausing/resuming the aging clock is not here - it happens automatically as part of the
 * availability-verification flow (Associate phase), not as an RMG-initiated action.
 */
@Slf4j
@RestController
@RequestMapping("/api/rmg/bench")
@RequiredArgsConstructor
@Validated
public class RmgBenchController {

    private final BenchTrackingService benchService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'BENCH_READ')")
    public ResponseEntity<List<BenchEntryDTO>> list(@RequestParam(required = false) String benchStatus) {
        log.info("Listing bench entries: benchStatus={}", benchStatus);
        return ResponseEntity.ok(benchService.list(benchStatus));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasPermission(null, 'BENCH_READ')")
    public ResponseEntity<BenchSummaryDTO> summary() {
        log.info("Fetching bench summary");
        return ResponseEntity.ok(benchService.summary());
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'BENCH_READ')")
    public ResponseEntity<BenchDetailDTO> detail(@PathVariable String employeeId) {
        log.info("Fetching bench detail for {}", employeeId);
        return ResponseEntity.ok(benchService.detail(employeeId));
    }
}
