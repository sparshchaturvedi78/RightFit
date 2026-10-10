package com.rightFit.controller;

import com.rightFit.dto.MyProjectsResponse;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.dto.CandidateDtos.ProjectLookupDTO;
import com.rightFit.service.CandidateSearchService;
import com.rightFit.dto.ResponsibilityDirectoryDTO;
import com.rightFit.service.ProjectManagementService;
import com.rightFit.service.ResponsibilityDirectoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/manager/projects")
@RequiredArgsConstructor
public class ManagerProjectController {

    private final ProjectManagementService projectManagementService;
    private final CandidateSearchService searchService;
    private final ResponsibilityDirectoryService directoryService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'PROJECT_READ_OWN')")
    public ResponseEntity<MyProjectsResponse> getMyProjects() {
        return ResponseEntity.ok(projectManagementService.getMyProjects());
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'PROJECT_LOOKUP')")
    public ResponseEntity<List<ProjectLookupDTO>> lookupProjects(@RequestParam(required = false) String projectId) {
        return ResponseEntity.ok(searchService.lookupProjects(projectId));
    }

    /** Dropdown for assigning SOURCER / INTERVIEWER / COORDINATOR, with each employee's live responsibility counts. */
    @GetMapping("/{projectId}/responsibility-candidates")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_ASSIGN_RESPONSIBILITY')")
    public ResponseEntity<Page<ResponsibilityDirectoryDTO>> responsibilityCandidates(
            @PathVariable String projectId,
            @RequestParam(required = false) String requirementId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(directoryService.list(projectId, requirementId, q,
                PageRequest.of(page, size, Sort.by("employeeId"))));
    }

    /** "Who actually is a SOURCER / INTERVIEWER / COORDINATOR right now" - grouped by type, across the project or one requirement. */
    @GetMapping("/{projectId}/responsibility-roster")
    @PreAuthorize("hasPermission(null, 'REQUIREMENT_READ')")
    public ResponseEntity<com.rightFit.dto.ResponsibilityRosterDTO> responsibilityRoster(
            @PathVariable String projectId,
            @RequestParam(required = false) String requirementId) {
        return ResponseEntity.ok(directoryService.roster(projectId, requirementId));
    }

    @PutMapping("/{projectId}/claim")
    @PreAuthorize("hasPermission(null, 'PROJECT_CLAIM')")
    public ResponseEntity<ProjectDTO> claimProject(@PathVariable String projectId) {
        log.info("Claiming project: {}", projectId);
        return ResponseEntity.ok(projectManagementService.claimProject(projectId));
    }
}
