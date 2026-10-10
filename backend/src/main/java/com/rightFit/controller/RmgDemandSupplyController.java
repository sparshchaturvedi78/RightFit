package com.rightFit.controller;

import com.rightFit.dto.DemandSupplyDtos.DemandSupplySummaryDTO;
import com.rightFit.service.WorkforceIntelligenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Demand & Supply Analytics (BRD 27, FR-050/051): per-skill open demand vs. active supply. */
@Slf4j
@RestController
@RequestMapping("/api/rmg/demand-supply")
@RequiredArgsConstructor
public class RmgDemandSupplyController {

    private final WorkforceIntelligenceService workforceIntelligenceService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'DEMAND_SUPPLY_READ')")
    public ResponseEntity<DemandSupplySummaryDTO> demandSupply() {
        return ResponseEntity.ok(workforceIntelligenceService.demandSupply());
    }
}
