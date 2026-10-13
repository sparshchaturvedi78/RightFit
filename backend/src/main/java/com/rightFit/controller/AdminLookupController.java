package com.rightFit.controller;

import com.rightFit.dto.LookupDtos.LookupsDTO;
import com.rightFit.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only reference data for the Admin forms and filters (departments, locations, designations). */
@RestController
@RequestMapping("/api/admin/lookups")
@RequiredArgsConstructor
public class AdminLookupController {

    private final LookupService lookupService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_READ')")
    public ResponseEntity<LookupsDTO> lookups() {
        return ResponseEntity.ok(lookupService.lookups());
    }
}
