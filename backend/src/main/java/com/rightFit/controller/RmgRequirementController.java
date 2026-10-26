package com.rightFit.controller;

import com.rightFit.dto.PoolBenchDtos.PoolEntryDTO;
import com.rightFit.dto.RmgSelectionDtos.OpenRequirementDTO;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.service.ResourcePoolGovernanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** RMG sees the published requirements it can recommend people to. */
@RestController
@RequestMapping("/api/rmg/requirements")
@RequiredArgsConstructor
public class RmgRequirementController {

    private final ProjectRequirementRepository requirementRepository;
    private final ResourcePoolGovernanceService poolService;

    /** Pool people who can still be recommended to this requirement (not already in its pipeline). */
    @GetMapping("/{requirementId}/pool-candidates")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_RECOMMEND')")
    public ResponseEntity<List<PoolEntryDTO>> poolCandidates(@PathVariable String requirementId,
                                                             @RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String grade) {
        return ResponseEntity.ok(poolService.candidatesFor(requirementId, q, grade));
    }

    @GetMapping("/open")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_RECOMMEND')")
    public ResponseEntity<List<OpenRequirementDTO>> open() {
        return ResponseEntity.ok(requirementRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED").stream()
                .map(RmgRequirementController::toDTO)
                .toList());
    }

    private static OpenRequirementDTO toDTO(ProjectRequirement r) {
        return OpenRequirementDTO.builder()
                .requirementId(r.getRequirementId())
                .positionTitle(r.getPositionTitle())
                .projectName(r.getProject().getProjectName())
                .priority(r.getPriority())
                .requiredSkills(r.getRequiredSkills())
                .minExperience(r.getMinExperience())
                .maxExperience(r.getMaxExperience())
                .allocationStartDate(r.getAllocationStartDate())
                .build();
    }
}
