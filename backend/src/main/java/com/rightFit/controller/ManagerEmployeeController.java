package com.rightFit.controller;

import com.rightFit.dto.CandidateDtos.ContactRequest;
import com.rightFit.dto.CandidateDtos.ContactResultDTO;
import com.rightFit.dto.CandidateDtos.EmployeeCandidateDTO;
import com.rightFit.service.CandidateSearchService;
import com.rightFit.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/manager/employees")
@RequiredArgsConstructor
@Validated
public class ManagerEmployeeController {

    private static final Set<String> SORTABLE = Set.of("employeeId", "firstName", "lastName", "grade",
            "yearsOfExperience", "availabilityStatus", "poolStatus");

    private final CandidateSearchService searchService;
    private final CandidateService candidateService;

    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_SEARCH')")
    public ResponseEntity<Page<EmployeeCandidateDTO>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) Integer minProficiency,
            @RequestParam(required = false) Double minExperience,
            @RequestParam(required = false) Double maxExperience,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String certification,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String technology,
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) String poolStatus,
            @RequestParam(required = false) String allocationStatus,
            @RequestParam(defaultValue = "false") boolean availableOnly,
            @RequestParam(required = false) String preferredTechnology,
            @RequestParam(required = false) String preferredDomain,
            @RequestParam(required = false) String preferredWorkMode,
            @RequestParam(required = false) String preferredLocation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "employeeId") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = SORTABLE.contains(sortBy) ? sortBy : "employeeId";

        CandidateSearchService.Criteria criteria = new CandidateSearchService.Criteria(q, employeeId, name, skills,
                minProficiency, minExperience, maxExperience, location, certification, grade, domain, technology,
                availabilityStatus, poolStatus, allocationStatus, availableOnly, preferredTechnology,
                preferredDomain, preferredWorkMode, preferredLocation);
        return ResponseEntity.ok(searchService.search(criteria, PageRequest.of(page, size, Sort.by(direction, sortField))));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_SEARCH')")
    public ResponseEntity<EmployeeCandidateDTO> getProfile(@PathVariable String employeeId) {
        return ResponseEntity.ok(searchService.getProfile(employeeId));
    }

    @PostMapping("/{employeeId}/contact")
    @PreAuthorize("hasPermission(null, 'CANDIDATE_CONTACT')")
    public ResponseEntity<ContactResultDTO> contact(@PathVariable String employeeId,
                                                    @Valid @RequestBody ContactRequest request) {
        return ResponseEntity.ok(candidateService.contact(employeeId, request));
    }
}
