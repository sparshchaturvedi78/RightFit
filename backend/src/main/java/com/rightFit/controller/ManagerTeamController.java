package com.rightFit.controller;

import com.rightFit.dto.AllocationDtos.AddTeamMemberRequest;
import com.rightFit.dto.AllocationDtos.AllocationDTO;
import com.rightFit.dto.AllocationDtos.AllocationEventDTO;
import com.rightFit.dto.AllocationDtos.CapacityDTO;
import com.rightFit.dto.AllocationDtos.MoveAllocationRequest;
import com.rightFit.dto.AllocationDtos.SplitAllocationRequest;
import com.rightFit.dto.AllocationDtos.TeamDTO;
import com.rightFit.dto.AllocationDtos.TeamMemberDTO;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.TeamManagementService;
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
public class ManagerTeamController {

    private final TeamManagementService teamService;

    @GetMapping("/projects/{projectId}/team")
    @PreAuthorize("hasPermission(null, 'TEAM_READ')")
    public ResponseEntity<TeamDTO> getTeam(@PathVariable String projectId) {
        return ResponseEntity.ok(teamService.getTeam(projectId));
    }

    @PostMapping("/projects/{projectId}/team")
    @PreAuthorize("hasPermission(null, 'TEAM_MANAGE')")
    public ResponseEntity<TeamMemberDTO> addMember(@PathVariable String projectId,
                                                   @Valid @RequestBody AddTeamMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.addMember(projectId, request));
    }

    @DeleteMapping("/projects/{projectId}/team/{employeeId}")
    @PreAuthorize("hasPermission(null, 'TEAM_MANAGE')")
    public ResponseEntity<Void> removeMember(@PathVariable String projectId, @PathVariable String employeeId,
                                             @Valid @RequestBody RequirementStatusChangeRequest request) {
        teamService.removeMember(projectId, employeeId, request.getReason());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/allocations")
    @PreAuthorize("hasPermission(null, 'TEAM_READ')")
    public ResponseEntity<List<AllocationDTO>> projectAllocations(@PathVariable String projectId) {
        return ResponseEntity.ok(teamService.projectAllocations(projectId));
    }

    @GetMapping("/projects/{projectId}/allocations/history")
    @PreAuthorize("hasPermission(null, 'TEAM_READ')")
    public ResponseEntity<List<AllocationEventDTO>> projectHistory(@PathVariable String projectId) {
        return ResponseEntity.ok(teamService.projectHistory(projectId));
    }

    @GetMapping("/employees/{employeeId}/capacity")
    @PreAuthorize("hasPermission(null, 'TEAM_READ')")
    public ResponseEntity<CapacityDTO> capacity(@PathVariable String employeeId) {
        return ResponseEntity.ok(teamService.capacity(employeeId));
    }

    @GetMapping("/employees/{employeeId}/allocations")
    @PreAuthorize("hasPermission(null, 'TEAM_READ')")
    public ResponseEntity<List<AllocationDTO>> employeeAllocations(@PathVariable String employeeId) {
        return ResponseEntity.ok(teamService.employeeAllocations(employeeId));
    }

    @PostMapping("/employees/{employeeId}/allocations/move")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_MANAGE')")
    public ResponseEntity<CapacityDTO> move(@PathVariable String employeeId,
                                            @Valid @RequestBody MoveAllocationRequest request) {
        return ResponseEntity.ok(teamService.move(employeeId, request));
    }

    @PostMapping("/employees/{employeeId}/allocations/split")
    @PreAuthorize("hasPermission(null, 'ALLOCATION_MANAGE')")
    public ResponseEntity<CapacityDTO> split(@PathVariable String employeeId,
                                             @Valid @RequestBody SplitAllocationRequest request) {
        return ResponseEntity.ok(teamService.split(employeeId, request));
    }
}
