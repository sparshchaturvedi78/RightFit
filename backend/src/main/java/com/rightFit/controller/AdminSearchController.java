package com.rightFit.controller;

import com.rightFit.dto.EmployeeSearchRequest;
import com.rightFit.dto.ProjectSearchRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.service.EmployeeSearchService;
import com.rightFit.service.ProjectSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin/search")
@RequiredArgsConstructor
@Validated
public class AdminSearchController {

    private final EmployeeSearchService employeeSearchService;
    private final ProjectSearchService projectSearchService;

    @PostMapping("/employees")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_SEARCH')")
    public ResponseEntity<Page<EmployeeDTO>> searchEmployees(
            @Valid @RequestBody EmployeeSearchRequest request) {
        log.info("Searching employees with filters");
        Page<EmployeeDTO> results = employeeSearchService.searchEmployees(request);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/projects")
    @PreAuthorize("hasPermission(null, 'PROJECT_SEARCH')")
    public ResponseEntity<Page<ProjectDTO>> searchProjects(
            @Valid @RequestBody ProjectSearchRequest request) {
        log.info("Searching projects with filters");
        Page<ProjectDTO> results = projectSearchService.searchProjects(request);
        return ResponseEntity.ok(results);
    }
}
