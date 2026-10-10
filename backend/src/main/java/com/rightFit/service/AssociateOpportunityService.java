package com.rightFit.service;

import com.rightFit.dto.InvitationDtos.ConfirmationRequest;
import com.rightFit.dto.InvitationDtos.InvitationDTO;
import com.rightFit.dto.InvitationDtos.InvitationResponseRequest;
import com.rightFit.dto.InvitationDtos.OpportunityDetailsDTO;
import com.rightFit.dto.InvitationDtos.OpportunityHistoryDTO;
import com.rightFit.dto.InvitationDtos.TeamMemberInfo;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Invitation;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.InvitationRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Minimal Associate-side integration needed to drive the Manager pipeline: open an invitation
 * (opportunity-details page), Accept / Reject / Join, confirm or decline after selection.
 * RMG confirmation is not required before an employee accepts (BR-016).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AssociateOpportunityService {

    private static final List<String> RESERVING_STATUSES = List.of(CandidateStatus.ALLOCATION_REQUESTED);

    private final InvitationRepository invitationRepository;
    private final CandidateApplicationRepository candidateRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final InvitationService invitationService;
    private final CandidateWorkflowService workflow;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<InvitationDTO> myInvitations() {
        Employee me = accessGuard.currentEmployee();
        return invitationRepository.findByEmployeeIdOrderByInvitedAtDesc(me.getId()).stream()
                .map(invitationService::toDTO).toList();
    }

    /** Opening an invitation marks it VIEWED and returns everything the employee may review (BRD 12 step 7). */
    public OpportunityDetailsDTO openInvitation(String invitationId) {
        Invitation invitation = mine(invitationId);
        expireIfNeeded(invitation);
        if ("SENT".equals(invitation.getStatus())) {
            invitation.setStatus("VIEWED");
            invitation.setViewedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
        }

        ProjectRequirement r = invitation.getRequirement();
        Project p = r.getProject();
        List<TeamMemberInfo> team = projectMemberRepository.findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(p.getId())
                .stream()
                .map(m -> TeamMemberInfo.builder()
                        .employeeId(m.getEmployee().getEmployeeId())
                        .name(CandidateWorkflowService.name(m.getEmployee()))
                        .designation(m.getEmployee().getDesignation())
                        .role(m.getRole())
                        .build())
                .toList();

        return OpportunityDetailsDTO.builder()
                .invitation(invitationService.toDTO(invitation))
                .projectId(p.getProjectId())
                .projectName(p.getProjectName())
                .projectDescription(p.getDescription())
                .clientName(p.getClientName())
                .projectStatus(p.getStatus())
                .projectStartDate(p.getStartDate())
                .projectEndDate(p.getEndDate())
                .managerName(CandidateWorkflowService.name(p.getManager()))
                .requirementId(r.getRequirementId())
                .positionTitle(r.getPositionTitle())
                .requirementDescription(r.getDescription())
                .requiredSkills(r.getRequiredSkills())
                .minExperience(r.getMinExperience())
                .maxExperience(r.getMaxExperience())
                .requiredCertifications(r.getRequiredCertifications())
                .priority(r.getPriority())
                .allocationStartDate(r.getAllocationStartDate())
                .allocationEndDate(r.getAllocationEndDate())
                .team(team)
                .build();
    }

    /** noRollbackFor: lazily expiring a stale invitation must persist even though the caller gets a 400. */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public InvitationDTO respond(String invitationId, InvitationResponseRequest request) {
        Invitation invitation = mine(invitationId);
        expireIfNeeded(invitation);
        if (!List.of("SENT", "VIEWED").contains(invitation.getStatus())) {
            throw new BusinessRuleException("This invitation is already " + invitation.getStatus());
        }

        CandidateApplication candidate = invitation.getCandidateApplication();
        Employee me = invitation.getEmployee();
        String response = request.getResponse();

        switch (response) {
            case "ACCEPT" -> {
                invitation.setStatus("ACCEPTED");
                workflow.transition(candidate, CandidateStatus.ACCEPTED, me, "Invitation accepted");
            }
            case "JOIN" -> {
                if (Boolean.TRUE.equals(invitation.getRequiresInterview())) {
                    throw new BusinessRuleException("Join is only available for invitations that do not require an interview");
                }
                assertNoReservation(me, candidate);
                invitation.setStatus("JOINED");
                workflow.transition(candidate, CandidateStatus.ACCEPTED, me, "Employee chose to join directly");
                candidate.setConfirmedAt(LocalDateTime.now());
                candidateRepository.save(candidate);
            }
            default -> {
                invitation.setStatus("REJECTED");
                workflow.transition(candidate, CandidateStatus.DECLINED, me, "Invitation rejected");
                workflow.cancelOpenItems(candidate, "Invitation rejected by employee");
            }
        }
        invitation.setRespondedAt(LocalDateTime.now());
        invitation.setResponseComment(request.getComment());
        invitationRepository.save(invitation);

        String label = "REJECT".equals(response) ? "rejected" : "JOIN".equals(response) ? "joined" : "accepted";
        notificationService.notify(invitation.getRequirement().getProject().getManager(),
                "REJECT".equals(response) ? "INVITATION_REJECTED" : "INVITATION_ACCEPTED",
                CandidateWorkflowService.name(me) + " " + label + " the invitation for "
                        + invitation.getRequirement().getRequirementId(),
                request.getComment(), "CANDIDATE", candidate.getApplicationId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INVITATION_" + invitation.getStatus(),
                "INVITATION", invitation.getId(), "OPEN", invitation.getStatus(),
                invitation.getInvitationId() + " " + label + " by " + me.getEmployeeId());
        return invitationService.toDTO(invitation);
    }

    @Transactional(readOnly = true)
    public List<OpportunityHistoryDTO> myOpportunities() {
        Employee me = accessGuard.currentEmployee();
        return candidateRepository.findByEmployeeIdOrderByCreatedAtDesc(me.getId()).stream()
                .map(c -> OpportunityHistoryDTO.builder()
                        .applicationId(c.getApplicationId())
                        .requirementId(c.getRequirement().getRequirementId())
                        .projectId(c.getRequirement().getProject().getProjectId())
                        .projectName(c.getRequirement().getProject().getProjectName())
                        .positionTitle(c.getRequirement().getPositionTitle())
                        .status(c.getStatus())
                        .confirmed(c.getConfirmedAt() != null)
                        .confirmedAt(c.getConfirmedAt())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .toList();
    }

    /**
     * After the Manager SELECTS, the employee decides which selected opportunity to take (BR-019/020).
     * Confirming is what makes the candidate eligible for an allocation request; declining ends the candidacy.
     */
    public OpportunityHistoryDTO confirm(String applicationId, ConfirmationRequest request) {
        CandidateApplication candidate = workflow.find(applicationId);
        Employee me = accessGuard.currentEmployee();
        if (!candidate.getEmployee().getId().equals(me.getId())) {
            throw ProjectAccessDeniedException.notYours("This opportunity");
        }
        if (!CandidateStatus.SELECTED.equals(candidate.getStatus())) {
            throw new BusinessRuleException("Only a SELECTED opportunity can be confirmed or declined (status "
                    + candidate.getStatus() + ")");
        }

        if ("ACCEPT".equals(request.getDecision())) {
            assertNoReservation(me, candidate);
            candidate.setConfirmedAt(LocalDateTime.now());
            candidateRepository.save(candidate);
            auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CANDIDATE_CONFIRMED", "CANDIDATE",
                    candidate.getId(), null, "CONFIRMED", me.getEmployeeId() + " confirmed " + applicationId);
            notificationService.notify(candidate.getRequirement().getProject().getManager(), "OPPORTUNITY_CONFIRMED",
                    CandidateWorkflowService.name(me) + " accepted the opportunity for "
                            + candidate.getRequirement().getRequirementId(),
                    "You can now submit an allocation request.", "CANDIDATE", applicationId);
        } else {
            workflow.transition(candidate, CandidateStatus.DECLINED, me,
                    request.getComment() != null ? request.getComment() : "Declined after selection");
            notificationService.notify(candidate.getRequirement().getProject().getManager(), "OPPORTUNITY_DECLINED",
                    CandidateWorkflowService.name(me) + " declined the opportunity for "
                            + candidate.getRequirement().getRequirementId(),
                    request.getComment(), "CANDIDATE", applicationId);
        }
        return myOpportunities().stream()
                .filter(o -> o.getApplicationId().equals(applicationId)).findFirst().orElseThrow();
    }

    /** BR-024: once acceptance + allocation request exist for one opportunity, another selected one cannot be accepted. */
    private void assertNoReservation(Employee employee, CandidateApplication current) {
        if (candidateRepository.existsByEmployeeIdAndStatusInAndIdNot(
                employee.getId(), RESERVING_STATUSES, current.getId())) {
            throw new BusinessRuleException(
                    "You already have an allocation request pending for another opportunity; "
                            + "you cannot accept another selected opportunity right now");
        }
    }

    private Invitation mine(String invitationId) {
        Invitation invitation = invitationRepository.findByInvitationId(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", invitationId));
        if (!invitation.getEmployee().getId().equals(accessGuard.currentEmployee().getId())) {
            throw ProjectAccessDeniedException.notYours("This invitation");
        }
        return invitation;
    }

    private void expireIfNeeded(Invitation invitation) {
        if (List.of("SENT", "VIEWED").contains(invitation.getStatus())
                && invitation.getResponseDeadline() != null
                && LocalDate.now().isAfter(invitation.getResponseDeadline())) {
            invitation.setStatus("EXPIRED");
            invitation.setRespondedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
            CandidateApplication candidate = invitation.getCandidateApplication();
            if (CandidateStatus.INVITATION_SENT.equals(candidate.getStatus())) {
                workflow.forceTransition(candidate, CandidateStatus.SHORTLISTED, invitation.getEmployee(),
                        "Invitation expired");
            }
        }
    }
}
