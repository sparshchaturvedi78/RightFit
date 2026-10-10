package com.rightFit.controller;

import com.rightFit.dto.AssociateProfileDtos.CertificationDTO;
import com.rightFit.dto.AssociateProfileDtos.CreateCertificationRequest;
import com.rightFit.dto.AssociateProfileDtos.UpdateCertificationRequest;
import com.rightFit.service.CertificationCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Shared certification catalog (BRD 18). Any employee can browse it; only Admin manages it. */
@Slf4j
@RestController
@RequestMapping("/api/admin/certifications")
@RequiredArgsConstructor
@Validated
public class AdminCertificationCatalogController {

    private final CertificationCatalogService certificationCatalogService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'CERTIFICATION_CATALOG_READ')")
    public ResponseEntity<List<CertificationDTO>> list(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(certificationCatalogService.list(activeOnly));
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'CERTIFICATION_CATALOG_MANAGE')")
    public ResponseEntity<CertificationDTO> create(@Valid @RequestBody CreateCertificationRequest request) {
        log.info("Creating certification catalog entry: {}", request.getCertificationName());
        return ResponseEntity.ok(certificationCatalogService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'CERTIFICATION_CATALOG_MANAGE')")
    public ResponseEntity<CertificationDTO> update(@PathVariable Long id, @RequestBody UpdateCertificationRequest request) {
        return ResponseEntity.ok(certificationCatalogService.update(id, request));
    }

    @PutMapping("/{id}/retire")
    @PreAuthorize("hasPermission(null, 'CERTIFICATION_CATALOG_MANAGE')")
    public ResponseEntity<CertificationDTO> retire(@PathVariable Long id) {
        log.info("Retiring certification catalog entry: {}", id);
        return ResponseEntity.ok(certificationCatalogService.retire(id));
    }
}
