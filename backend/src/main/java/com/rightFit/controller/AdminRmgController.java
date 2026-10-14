package com.rightFit.controller;

import com.rightFit.dto.RmgDetailDTO;
import com.rightFit.dto.RmgPageDTO;
import com.rightFit.dto.RmgTeamDTO;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.service.RmgDashboardService;
import com.rightFit.entity.Employee;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/rmg")
@RequiredArgsConstructor
@Validated
public class AdminRmgController {

    private final RmgDashboardService rmgDashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<List<RmgDetailDTO>> getRmgDashboard() {
        log.info("Fetching RMG dashboard");
        List<RmgDetailDTO> rmgs = rmgDashboardService.getAllRmgs();
        return ResponseEntity.ok(rmgs);
    }

    /** Admin RMG page: searchable, filterable, paged RMG list with team sizes and the header numbers. */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<RmgPageDTO> getRmgs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String team,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(rmgDashboardService.getRmgPage(q, status, team, sortBy, sortDirection, page, size));
    }

    /** One page of the active associates reporting to an RMG, optionally one workforce bucket only. */
    @GetMapping("/{rmgId}/team")
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<RmgTeamDTO> getRmgTeam(
            @PathVariable String rmgId,
            @RequestParam(required = false) String workforce,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(rmgDashboardService.getRmgTeam(rmgId, workforce, q, page, size));
    }

    @GetMapping("/{rmgId}")
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<RmgDetailDTO> getRmgDetail(@PathVariable String rmgId) {
        log.info("Fetching RMG detail: {}", rmgId);
        RmgDetailDTO rmg = rmgDashboardService.getRmgDetail(rmgId);
        return ResponseEntity.ok(rmg);
    }

    @GetMapping("/{rmgId}/associates")
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<Page<EmployeeDTO>> getRmgAssociates(
            @PathVariable String rmgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching associates for RMG: {}", rmgId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Employee> associates = rmgDashboardService.getAssociatesForRmg(rmgId, pageable);

        Page<EmployeeDTO> dtoPage = associates.map(emp -> EmployeeDTO.builder()
                .id(emp.getId())
                .employeeId(emp.getEmployeeId())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .email(emp.getEmail())
                .designation(emp.getDesignation())
                .employmentStatus(emp.getEmploymentStatus())
                .allocationStatus(emp.getAllocationStatus())
                .availabilityStatus(emp.getAvailabilityStatus())
                .build());

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{rmgId}/associate-count")
    @PreAuthorize("hasPermission(null, 'RMG_VIEW')")
    public ResponseEntity<Long> getRmgAssociateCount(@PathVariable String rmgId) {
        log.info("Counting associates for RMG: {}", rmgId);
        long count = rmgDashboardService.getAssociateCountForRmg(rmgId);
        return ResponseEntity.ok(count);
    }
}
