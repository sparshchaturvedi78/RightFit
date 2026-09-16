package com.rightFit.controller;

import com.rightFit.dto.EmployeeDTO;
import com.rightFit.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Validated
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * Admin users listing tab: filterable, paginated list of all employees/accounts.
     * Every filter is optional and can be combined freely.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_READ')")
    public ResponseEntity<Page<EmployeeDTO>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Double minExperience,
            @RequestParam(required = false) Double maxExperience,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(required = false) String allocationStatus,
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) String poolStatus,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String designation,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) Long rmgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        log.info("Fetching admin users list with filters - role: {}, employmentStatus: {}, allocationStatus: {}",
                role, employmentStatus, allocationStatus);

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<EmployeeDTO> users = adminUserService.searchUsers(query, role, minExperience, maxExperience,
                employmentStatus, allocationStatus, availabilityStatus, poolStatus, departmentId, locationId,
                designation, domain, grade, rmgId, pageable);

        return ResponseEntity.ok(users);
    }
}
