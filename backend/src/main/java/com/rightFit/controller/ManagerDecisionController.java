package com.rightFit.controller;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.DecisionRequest;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.CandidateDecisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Final candidate decision - the project's owning Manager only (no Admin bypass). */
@RestController
@RequestMapping("/api/manager/candidates/{applicationId}")
@RequiredArgsConstructor
@Validated
public class ManagerDecisionController {

    private final CandidateDecisionService decisionService;

    @PutMapping("/review")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_DECISION')")
    public ResponseEntity<CandidateDTO> startReview(@PathVariable String applicationId) {
        return ResponseEntity.ok(decisionService.startReview(applicationId));
    }

    @PutMapping("/decision")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_DECISION')")
    public ResponseEntity<CandidateDTO> decide(@PathVariable String applicationId,
                                               @Valid @RequestBody DecisionRequest request) {
        return ResponseEntity.ok(decisionService.decide(applicationId, request));
    }

    @PutMapping("/resume")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_DECISION')")
    public ResponseEntity<CandidateDTO> resume(@PathVariable String applicationId,
                                               @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(decisionService.resume(applicationId, request.getReason()));
    }
}
