package com.rightFit.controller;

import com.rightFit.dto.AllocationDtos.AllocationRequestDTO;
import com.rightFit.dto.AllocationDtos.CreateAllocationRequestRequest;
import com.rightFit.dto.AllocationDtos.ReviewRequest;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.AllocationApprovalService;
import com.rightFit.service.AllocationRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Manager requests allocation; RMG approves/rejects. Two different actors, two different permissions. */
@RestController
@RequiredArgsConstructor
@Validated
public class AllocationRequestController {

    private final AllocationRequestService requestService;
    private final AllocationApprovalService approvalService;

    @PostMapping("/api/manager/candidates/{applicationId}/allocation-requests")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_CREATE')")
    public ResponseEntity<AllocationRequestDTO> create(@PathVariable String applicationId,
                                                       @Valid @RequestBody CreateAllocationRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(requestService.create(applicationId, request));
    }

    @GetMapping("/api/manager/allocation-requests")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_READ')")
    public ResponseEntity<List<AllocationRequestDTO>> list() {
        return ResponseEntity.ok(requestService.list());
    }

    @GetMapping("/api/manager/allocation-requests/{requestId}")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_READ')")
    public ResponseEntity<AllocationRequestDTO> get(@PathVariable String requestId) {
        return ResponseEntity.ok(requestService.get(requestId));
    }

    @PutMapping("/api/manager/allocation-requests/{requestId}/cancel")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_CREATE')")
    public ResponseEntity<AllocationRequestDTO> cancel(@PathVariable String requestId,
                                                       @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(requestService.cancel(requestId, request.getReason()));
    }

    @GetMapping("/api/rmg/allocation-requests")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_APPROVE')")
    public ResponseEntity<List<AllocationRequestDTO>> pending() {
        return ResponseEntity.ok(approvalService.pending());
    }

    @GetMapping("/api/rmg/allocation-requests/{requestId}")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_APPROVE')")
    public ResponseEntity<AllocationRequestDTO> review(@PathVariable String requestId) {
        return ResponseEntity.ok(approvalService.get(requestId));
    }

    @PutMapping("/api/rmg/allocation-requests/{requestId}/approve")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_APPROVE')")
    public ResponseEntity<AllocationRequestDTO> approve(@PathVariable String requestId,
                                                        @RequestBody(required = false) ReviewRequest review) {
        return ResponseEntity.ok(approvalService.approve(requestId, review));
    }

    @PutMapping("/api/rmg/allocation-requests/{requestId}/reject")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_REQUEST_APPROVE')")
    public ResponseEntity<AllocationRequestDTO> reject(@PathVariable String requestId,
                                                       @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(approvalService.reject(requestId, request.getReason()));
    }
}
