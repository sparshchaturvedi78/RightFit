package com.rightFit.controller;

import com.rightFit.dto.PoolBenchDtos.PoolDetailDTO;
import com.rightFit.dto.PoolBenchDtos.PoolEntryDTO;
import com.rightFit.service.ResourcePoolGovernanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** RMG Phase: Resource Pool visibility (BRD 22). Pool entry/exit happens automatically elsewhere. */
@Slf4j
@RestController
@RequestMapping("/api/rmg/pool")
@RequiredArgsConstructor
@Validated
public class RmgResourcePoolController {

    private final ResourcePoolGovernanceService poolService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'POOL_READ')")
    public ResponseEntity<Page<PoolEntryDTO>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Listing Resource Pool: q={}, grade={}, departmentId={}", q, grade, departmentId);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(poolService.list(q, grade, departmentId, pageable));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'POOL_READ')")
    public ResponseEntity<PoolDetailDTO> detail(@PathVariable String employeeId) {
        log.info("Fetching pool detail for {}", employeeId);
        return ResponseEntity.ok(poolService.detail(employeeId));
    }
}
