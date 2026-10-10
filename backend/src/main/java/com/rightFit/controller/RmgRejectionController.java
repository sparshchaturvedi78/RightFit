package com.rightFit.controller;

import com.rightFit.dto.RejectionDtos.EmployeeRejectionHistoryDTO;
import com.rightFit.dto.RejectionDtos.RejectionDTO;
import com.rightFit.service.RejectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Rejection Management (BRD 28, FR-052): RMG reviews rejected candidates and repeated-rejection patterns. */
@Slf4j
@RestController
@RequestMapping("/api/rmg/rejections")
@RequiredArgsConstructor
public class RmgRejectionController {

    private final RejectionService rejectionService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'REJECTION_READ')")
    public ResponseEntity<List<RejectionDTO>> list() {
        return ResponseEntity.ok(rejectionService.listForRmg());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasPermission(null, 'REJECTION_READ')")
    public ResponseEntity<EmployeeRejectionHistoryDTO> employeeHistory(@PathVariable String employeeId) {
        return ResponseEntity.ok(rejectionService.employeeHistory(employeeId));
    }
}
