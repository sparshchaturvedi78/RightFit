package com.rightFit.controller;

import com.rightFit.dto.AssignmentPreviewDTO;
import com.rightFit.dto.ReplaceManagerRequest;
import com.rightFit.dto.ReplaceRmgRequest;
import com.rightFit.dto.ReplacementResultDTO;
import com.rightFit.service.AssignmentReplacementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin/assignments")
@RequiredArgsConstructor
@Validated
public class AdminAssignmentController {

    private final AssignmentReplacementService assignmentReplacementService;

    @GetMapping("/departing/manager/{managerId}")
    @PreAuthorize("hasPermission(null, 'ASSIGNMENT_VIEW')")
    public ResponseEntity<AssignmentPreviewDTO> getManagerAssignments(@PathVariable Long managerId) {
        log.info("Fetching manager assignments preview: {}", managerId);
        AssignmentPreviewDTO preview = assignmentReplacementService.getManagerAssignments(managerId);
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/departing/rmg/{rmgId}")
    @PreAuthorize("hasPermission(null, 'ASSIGNMENT_VIEW')")
    public ResponseEntity<AssignmentPreviewDTO> getRmgAssignments(@PathVariable Long rmgId) {
        log.info("Fetching RMG assignments preview: {}", rmgId);
        AssignmentPreviewDTO preview = assignmentReplacementService.getRmgAssignments(rmgId);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/replace-manager/{departingManagerId}")
    @PreAuthorize("hasPermission(null, 'ASSIGNMENT_REPLACE_MANAGER')")
    public ResponseEntity<ReplacementResultDTO> replaceManager(
            @PathVariable Long departingManagerId,
            @Valid @RequestBody ReplaceManagerRequest request) {
        log.info("Executing manager replacement - Departing: {}, New: {}", departingManagerId, request.getNewManagerId());
        ReplacementResultDTO result = assignmentReplacementService.replaceManager(departingManagerId, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/replace-rmg/{departingRmgId}")
    @PreAuthorize("hasPermission(null, 'ASSIGNMENT_REPLACE_RMG')")
    public ResponseEntity<ReplacementResultDTO> replaceRmg(
            @PathVariable Long departingRmgId,
            @Valid @RequestBody ReplaceRmgRequest request) {
        log.info("Executing RMG replacement - Departing: {}, New: {}", departingRmgId, request.getNewRmgId());
        ReplacementResultDTO result = assignmentReplacementService.replaceRmg(departingRmgId, request);
        return ResponseEntity.ok(result);
    }
}
