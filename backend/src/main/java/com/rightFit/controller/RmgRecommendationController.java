package com.rightFit.controller;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.IdentifyCandidateRequest;
import com.rightFit.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** RMG can recommend employees to a requirement but cannot shortlist them (BRD 4.3, BR-012). */
@RestController
@RequestMapping("/api/rmg/requirements/{requirementId}/recommendations")
@RequiredArgsConstructor
public class RmgRecommendationController {

    private final CandidateService candidateService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'CANDIDATE_RECOMMEND')")
    public ResponseEntity<CandidateDTO> recommend(@PathVariable String requirementId,
                                                  @Valid @RequestBody IdentifyCandidateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.recommend(requirementId, request));
    }
}
