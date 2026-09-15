package com.rightFit.controller;

import com.rightFit.dto.CreateProjectRequest;
import com.rightFit.dto.UpdateProjectRequest;
import com.rightFit.dto.ChangeManagerRequest;
import com.rightFit.dto.CloseProjectRequest;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.service.ProjectManagementService;
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

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin/projects")
@RequiredArgsConstructor
@Validated
public class AdminProjectController {

    private final ProjectManagementService projectManagementService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'PROJECT_CREATE')")
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody CreateProjectRequest request) {
        log.info("Creating project: {}", request.getProjectId());
        ProjectDTO project = projectManagementService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'PROJECT_VIEW')")
    public ResponseEntity<Page<ProjectDTO>> getProjects(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String projectName,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) String clientName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "projectName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        log.info("Fetching projects with filters");

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<ProjectDTO> projects = projectManagementService.getProjects(
                projectId, projectName, status, managerId, clientName, pageable);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("hasPermission(null, 'PROJECT_VIEW')")
    public ResponseEntity<ProjectDTO> getProject(@PathVariable Long projectId) {
        log.info("Fetching project: {}", projectId);
        ProjectDTO project = projectManagementService.getProject(projectId);
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("hasPermission(null, 'PROJECT_UPDATE')")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        log.info("Updating project: {}", projectId);
        ProjectDTO project = projectManagementService.updateProject(projectId, request);
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{projectId}/manager")
    @PreAuthorize("hasPermission(null, 'PROJECT_UPDATE')")
    public ResponseEntity<Void> changeManager(
            @PathVariable Long projectId,
            @Valid @RequestBody ChangeManagerRequest request) {
        log.info("Changing manager for project: {}", projectId);
        projectManagementService.changeManager(projectId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{projectId}/close")
    @PreAuthorize("hasPermission(null, 'PROJECT_CLOSE')")
    public ResponseEntity<Void> closeProject(
            @PathVariable Long projectId,
            @Valid @RequestBody CloseProjectRequest request) {
        log.info("Closing project: {}", projectId);
        projectManagementService.closeProject(projectId, request);
        return ResponseEntity.noContent().build();
    }
}
