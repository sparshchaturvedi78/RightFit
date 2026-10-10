package com.rightFit.controller;

import com.rightFit.dto.InvitationDtos.ConfirmationRequest;
import com.rightFit.dto.InvitationDtos.InvitationDTO;
import com.rightFit.dto.InvitationDtos.InvitationResponseRequest;
import com.rightFit.dto.InvitationDtos.OpportunityDetailsDTO;
import com.rightFit.dto.InvitationDtos.OpportunityHistoryDTO;
import com.rightFit.service.AssociateOpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Employee-side endpoints for the opportunity flow. Every call is restricted to the caller's own records. */
@RestController
@RequestMapping("/api/associate")
@RequiredArgsConstructor
@Validated
public class AssociateOpportunityController {

    private final AssociateOpportunityService opportunityService;

    @GetMapping("/invitations")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<List<InvitationDTO>> myInvitations() {
        return ResponseEntity.ok(opportunityService.myInvitations());
    }

    @GetMapping("/invitations/{invitationId}")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<OpportunityDetailsDTO> openInvitation(@PathVariable String invitationId) {
        return ResponseEntity.ok(opportunityService.openInvitation(invitationId));
    }

    @PutMapping("/invitations/{invitationId}/respond")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<InvitationDTO> respond(@PathVariable String invitationId,
                                                 @Valid @RequestBody InvitationResponseRequest request) {
        return ResponseEntity.ok(opportunityService.respond(invitationId, request));
    }

    @GetMapping("/opportunities")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<List<OpportunityHistoryDTO>> myOpportunities() {
        return ResponseEntity.ok(opportunityService.myOpportunities());
    }

    @PutMapping("/opportunities/{applicationId}/confirmation")
    @PreAuthorize("hasPermission(null, 'INVITATION_RESPOND')")
    public ResponseEntity<OpportunityHistoryDTO> confirm(@PathVariable String applicationId,
                                                         @Valid @RequestBody ConfirmationRequest request) {
        return ResponseEntity.ok(opportunityService.confirm(applicationId, request));
    }
}
