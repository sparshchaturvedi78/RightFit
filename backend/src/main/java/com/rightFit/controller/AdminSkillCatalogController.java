package com.rightFit.controller;

import com.rightFit.dto.AssociateProfileDtos.CreateSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.SkillDTO;
import com.rightFit.dto.AssociateProfileDtos.UpdateSkillRequest;
import com.rightFit.service.SkillCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Shared skill catalog (BRD 18). Any employee can browse it (to pick one when adding a skill);
 * only Admin manages it. */
@Slf4j
@RestController
@RequestMapping("/api/admin/skills")
@RequiredArgsConstructor
@Validated
public class AdminSkillCatalogController {

    private final SkillCatalogService skillCatalogService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_READ')")
    public ResponseEntity<List<SkillDTO>> list(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(skillCatalogService.list(activeOnly));
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillDTO> create(@Valid @RequestBody CreateSkillRequest request) {
        log.info("Creating skill catalog entry: {}", request.getSkillName());
        return ResponseEntity.ok(skillCatalogService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillDTO> update(@PathVariable Long id, @RequestBody UpdateSkillRequest request) {
        return ResponseEntity.ok(skillCatalogService.update(id, request));
    }

    @PutMapping("/{id}/retire")
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillDTO> retire(@PathVariable Long id) {
        log.info("Retiring skill catalog entry: {}", id);
        return ResponseEntity.ok(skillCatalogService.retire(id));
    }
}
