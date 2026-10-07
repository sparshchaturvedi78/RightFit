package com.rightFit.controller;

import com.rightFit.dto.InvitationDtos.InvitationDTO;
import com.rightFit.dto.InvitationDtos.SendInvitationRequest;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.InvitationService;
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
public class ManagerInvitationController {

    private final InvitationService invitationService;

    @PostMapping("/candidates/{applicationId}/invitations")
    @PreAuthorize("hasPermission(null, 'INVITATION_SEND')")
    public ResponseEntity<InvitationDTO> send(@PathVariable String applicationId,
                                              @Valid @RequestBody SendInvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invitationService.send(applicationId, request));
    }

    @GetMapping("/requirements/{requirementId}/invitations")
    @PreAuthorize("hasPermission(null, 'INVITATION_READ')")
    public ResponseEntity<List<InvitationDTO>> listForRequirement(@PathVariable String requirementId) {
        return ResponseEntity.ok(invitationService.listForRequirement(requirementId));
    }

    @GetMapping("/invitations/{invitationId}")
    @PreAuthorize("hasPermission(null, 'INVITATION_READ')")
    public ResponseEntity<InvitationDTO> get(@PathVariable String invitationId) {
        return ResponseEntity.ok(invitationService.get(invitationId));
    }

    @PutMapping("/invitations/{invitationId}/withdraw")
    @PreAuthorize("hasPermission(null, 'INVITATION_SEND')")
    public ResponseEntity<InvitationDTO> withdraw(@PathVariable String invitationId,
                                                  @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(invitationService.withdraw(invitationId, request.getReason()));
    }
}
