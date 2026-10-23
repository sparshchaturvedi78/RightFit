package com.rightFit.controller;

import com.rightFit.dto.AssociateDtos.DutyDTO;
import com.rightFit.dto.AssociateDtos.MyProjectDTO;
import com.rightFit.dto.AssociateDtos.OpenRequirementDTO;
import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.service.AssociateWorkService;
import com.rightFit.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The associate's own work: open requirements to apply to, their project and team, and their hiring duties. */
@RestController
@RequestMapping("/api/associate")
@RequiredArgsConstructor
public class AssociateWorkController {

    private final AssociateWorkService workService;
    private final CandidateService candidateService;

    @GetMapping("/requirements")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<List<OpenRequirementDTO>> openRequirements() {
        return ResponseEntity.ok(workService.openRequirements());
    }

    /** Applying makes the associate a candidate (IDENTIFIED) the manager can shortlist. Only while unallocated. */
    @PostMapping("/requirements/{requirementId}/apply")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<CandidateDTO> apply(@PathVariable String requirementId) {
        return ResponseEntity.ok(candidateService.selfApply(requirementId));
    }

    @PutMapping("/applications/{applicationId}/withdraw")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<CandidateDTO> withdraw(@PathVariable String applicationId) {
        return ResponseEntity.ok(candidateService.withdrawOwn(applicationId));
    }

    @GetMapping("/my-projects")
    @PreAuthorize("hasPermission(null, 'ASSOCIATE_DASHBOARD_READ')")
    public ResponseEntity<List<MyProjectDTO>> myProjects() {
        return ResponseEntity.ok(workService.myProjects());
    }

    @GetMapping("/duties")
    @PreAuthorize("hasPermission(null, 'ASSOCIATE_DASHBOARD_READ')")
    public ResponseEntity<List<DutyDTO>> duties() {
        return ResponseEntity.ok(workService.myDuties());
    }
}
