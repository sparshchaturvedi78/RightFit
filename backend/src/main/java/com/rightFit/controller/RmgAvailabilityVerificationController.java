package com.rightFit.controller;

import com.rightFit.dto.AssociateProfileDtos.EmployeeAvailabilityDTO;
import com.rightFit.dto.AssociateProfileDtos.RejectAvailabilityRequest;
import com.rightFit.service.EmployeeAvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** RMG verifies employees' temporary-unavailability requests (BRD 21). */
@Slf4j
@RestController
@RequestMapping("/api/rmg/availability-requests")
@RequiredArgsConstructor
@Validated
public class RmgAvailabilityVerificationController {

    private final EmployeeAvailabilityService availabilityService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_VERIFY')")
    public ResponseEntity<List<EmployeeAvailabilityDTO>> pending() {
        return ResponseEntity.ok(availabilityService.pendingForMyAssociates());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_VERIFY')")
    public ResponseEntity<EmployeeAvailabilityDTO> approve(@PathVariable Long id) {
        log.info("Approving availability request {}", id);
        return ResponseEntity.ok(availabilityService.approve(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_VERIFY')")
    public ResponseEntity<EmployeeAvailabilityDTO> reject(@PathVariable Long id,
                                                          @Valid @RequestBody RejectAvailabilityRequest request) {
        log.info("Rejecting availability request {}", id);
        return ResponseEntity.ok(availabilityService.reject(id, request.getReason()));
    }
}
