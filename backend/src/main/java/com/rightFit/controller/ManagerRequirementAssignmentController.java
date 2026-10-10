package com.rightFit.controller;

import com.rightFit.dto.AssignResponsibilityRequest;
import com.rightFit.dto.RequirementAssignmentDTO;
import com.rightFit.service.RequirementAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/manager/requirements/{requirementId}/assignments")
@RequiredArgsConstructor
@Validated
public class ManagerRequirementAssignmentController {

    private final RequirementAssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_ASSIGN_RESPONSIBILITY')")
    public ResponseEntity<RequirementAssignmentDTO> assignResponsibility(
            @PathVariable String requirementId,
            @Valid @RequestBody AssignResponsibilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignResponsibility(requirementId, request));
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_READ')")
    public ResponseEntity<List<RequirementAssignmentDTO>> listAssignments(
            @PathVariable String requirementId,
            @RequestParam(required = false) String responsibilityType) {
        return ResponseEntity.ok(assignmentService.listAssignments(requirementId, responsibilityType));
    }

    /** Removes the employee's responsibilities (all, or one type) and returns the updated assigned team. */
    @DeleteMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_ASSIGN_RESPONSIBILITY')")
    public ResponseEntity<List<RequirementAssignmentDTO>> removeResponsibility(
            @PathVariable String requirementId,
            @PathVariable String employeeId,
            @RequestParam(required = false) String responsibilityType) {
        return ResponseEntity.ok(assignmentService.removeResponsibility(requirementId, employeeId, responsibilityType));
    }
}
