package com.rightFit.controller;

import com.rightFit.dto.CreateRequirementRequest;
import com.rightFit.dto.RequirementDTO;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.RequirementManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/manager/requirements")
@RequiredArgsConstructor
@Validated
public class ManagerRequirementController {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("createdAt", "updatedAt", "requirementId", "positionTitle", "priority", "status");

    private final RequirementManagementService requirementService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_CREATE')")
    public ResponseEntity<RequirementDTO> createRequirement(@Valid @RequestBody CreateRequirementRequest request) {
        log.info("Creating requirement under project: {}", request.getProjectId());
        return ResponseEntity.status(HttpStatus.CREATED).body(requirementService.createRequirement(request));
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_READ')")
    public ResponseEntity<Page<RequirementDTO>> getRequirements(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String positionTitle,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        return ResponseEntity.ok(requirementService.searchRequirements(projectId, status, priority, positionTitle, pageable));
    }

    @GetMapping("/{requirementId}")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_READ')")
    public ResponseEntity<RequirementDTO> getRequirement(@PathVariable String requirementId) {
        return ResponseEntity.ok(requirementService.getRequirement(requirementId));
    }

    @PutMapping("/{requirementId}")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_UPDATE')")
    public ResponseEntity<RequirementDTO> updateRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody CreateRequirementRequest request) {
        return ResponseEntity.ok(requirementService.updateRequirement(requirementId, request));
    }

    @PutMapping("/{requirementId}/publish")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_PUBLISH')")
    public ResponseEntity<RequirementDTO> publishRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requirementService.publishRequirement(requirementId, request));
    }

    @PutMapping("/{requirementId}/hold")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_UPDATE')")
    public ResponseEntity<RequirementDTO> holdRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requirementService.holdRequirement(requirementId, request));
    }

    @PutMapping("/{requirementId}/resume")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_UPDATE')")
    public ResponseEntity<RequirementDTO> resumeRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requirementService.resumeRequirement(requirementId, request));
    }

    @PutMapping("/{requirementId}/close")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_CLOSE')")
    public ResponseEntity<RequirementDTO> closeRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requirementService.closeRequirement(requirementId, request));
    }

    @PutMapping("/{requirementId}/cancel")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_CLOSE')")
    public ResponseEntity<RequirementDTO> cancelRequirement(
            @PathVariable String requirementId,
            @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requirementService.cancelRequirement(requirementId, request));
    }
}
