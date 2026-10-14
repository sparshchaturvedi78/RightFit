package com.rightFit.controller;

import com.rightFit.dto.SkillCatalogDtos.CreateSkillCategoryRequest;
import com.rightFit.dto.SkillCatalogDtos.SkillCategoryDTO;
import com.rightFit.dto.SkillCatalogDtos.UpdateSkillCategoryRequest;
import com.rightFit.service.SkillCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin Skills page: the categories that group the skill catalog. */
@Slf4j
@RestController
@RequestMapping("/api/admin/skill-categories")
@RequiredArgsConstructor
@Validated
public class AdminSkillCategoryController {

    private final SkillCatalogService skillCatalogService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_READ')")
    public ResponseEntity<List<SkillCategoryDTO>> list() {
        return ResponseEntity.ok(skillCatalogService.listCategories());
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillCategoryDTO> create(@Valid @RequestBody CreateSkillCategoryRequest request) {
        log.info("Creating skill category: {}", request.getName());
        return ResponseEntity.ok(skillCatalogService.createCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillCategoryDTO> update(@PathVariable Long id, @RequestBody UpdateSkillCategoryRequest request) {
        return ResponseEntity.ok(skillCatalogService.updateCategory(id, request));
    }

    @PutMapping("/{id}/retire")
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillCategoryDTO> retire(@PathVariable Long id) {
        return ResponseEntity.ok(skillCatalogService.setCategoryActive(id, false));
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasPermission(null, 'SKILL_CATALOG_MANAGE')")
    public ResponseEntity<SkillCategoryDTO> restore(@PathVariable Long id) {
        return ResponseEntity.ok(skillCatalogService.setCategoryActive(id, true));
    }
}
