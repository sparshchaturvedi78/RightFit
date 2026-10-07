package com.rightFit.controller;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.CandidateHistoryDTO;
import com.rightFit.dto.CandidateDtos.IdentifyCandidateRequest;
import com.rightFit.dto.CandidateDtos.PipelineDTO;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@Validated
public class ManagerCandidateController {

    private final CandidateService candidateService;

    @PostMapping("/requirements/{requirementId}/candidates")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_SHORTLIST')")
    public ResponseEntity<CandidateDTO> identifyCandidate(@PathVariable String requirementId,
                                                          @Valid @RequestBody IdentifyCandidateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.identify(requirementId, request));
    }

    @GetMapping("/requirements/{requirementId}/candidates")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_READ')")
    public ResponseEntity<List<CandidateDTO>> listCandidates(@PathVariable String requirementId,
                                                             @RequestParam(required = false) String status,
                                                             @RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(candidateService.list(requirementId, status, includeArchived));
    }

    @GetMapping("/requirements/{requirementId}/pipeline")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_READ')")
    public ResponseEntity<PipelineDTO> pipeline(@PathVariable String requirementId) {
        return ResponseEntity.ok(candidateService.pipeline(requirementId));
    }

    @GetMapping("/candidates/{applicationId}")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_READ')")
    public ResponseEntity<CandidateDTO> getCandidate(@PathVariable String applicationId) {
        return ResponseEntity.ok(candidateService.get(applicationId));
    }

    @GetMapping("/candidates/{applicationId}/history")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_READ')")
    public ResponseEntity<List<CandidateHistoryDTO>> history(@PathVariable String applicationId) {
        return ResponseEntity.ok(candidateService.history(applicationId));
    }

    @PutMapping("/candidates/{applicationId}/shortlist")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_SHORTLIST')")
    public ResponseEntity<CandidateDTO> shortlist(@PathVariable String applicationId) {
        return ResponseEntity.ok(candidateService.shortlist(applicationId));
    }

    @PutMapping("/candidates/{applicationId}/withdraw")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_SHORTLIST')")
    public ResponseEntity<CandidateDTO> withdraw(@PathVariable String applicationId,
                                                 @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(candidateService.withdraw(applicationId, request.getReason()));
    }
}
