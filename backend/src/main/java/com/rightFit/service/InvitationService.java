package com.rightFit.service;

import com.rightFit.dto.InvitationDtos.InvitationDTO;
import com.rightFit.dto.InvitationDtos.SendInvitationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Invitation;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.InvitationRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Manager Phase 5: send / withdraw / read invitations. RMG confirmation is never required (BR-016). */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final CandidateWorkflowService workflow;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public InvitationDTO send(String applicationId, SendInvitationRequest request) {
        CandidateApplication candidate = workflow.find(applicationId);
        // Sending invitations is a Manager action: strict ownership, no Admin bypass (BRD 4.2 / 39).
        accessGuard.assertOwnsProject(candidate.getRequirement().getProject());
        accessGuard.assertRequirementOpen(candidate.getRequirement());

        if (!CandidateStatus.SHORTLISTED.equals(candidate.getStatus())) {
            throw new BusinessRuleException("Only a SHORTLISTED candidate can be invited (current status "
                    + candidate.getStatus() + ")");
        }
        Employee employee = candidate.getEmployee();
        if (!"ACTIVE".equals(employee.getEmploymentStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not active");
        }
        if (request.getResponseDeadline() != null && request.getResponseDeadline().isBefore(LocalDate.now())) {
            throw new BusinessRuleException("Response deadline must not be in the past");
        }

        Employee actor = accessGuard.currentEmployee();
        boolean requiresInterview = request.getRequiresInterview() == null || request.getRequiresInterview();

        Invitation invitation = invitationRepository.save(Invitation.builder()
                .invitationId("INV-" + invitationRepository.nextInvitationSequence())
                .candidateApplication(candidate)
                .requirement(candidate.getRequirement())
                .employee(employee)
                .status("SENT")
                .message(request.getMessage())
                .requiresInterview(requiresInterview)
                .invitedBy(actor)
                .responseDeadline(request.getResponseDeadline())
                .build());

        candidate.setRequiresInterview(requiresInterview);
        workflow.transition(candidate, CandidateStatus.INVITATION_SENT, actor, "Invitation " + invitation.getInvitationId());

        notificationService.notify(employee, "INVITATION_SENT",
                "New project invitation: " + candidate.getRequirement().getPositionTitle(),
                CandidateWorkflowService.name(actor) + " invited you to "
                        + candidate.getRequirement().getProject().getProjectName(),
                "INVITATION", invitation.getInvitationId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INVITATION_SENT", "INVITATION",
                invitation.getId(), null, "SENT",
                invitation.getInvitationId() + " sent to " + employee.getEmployeeId() + " for "
                        + candidate.getRequirement().getRequirementId());
        return toDTO(invitation);
    }

    public InvitationDTO withdraw(String invitationId, String reason) {
        Invitation invitation = find(invitationId);
        accessGuard.assertOwnsProject(invitation.getRequirement().getProject());

        if (!List.of("SENT", "VIEWED").contains(invitation.getStatus())) {
            throw new BusinessRuleException("Only an open invitation can be withdrawn (status "
                    + invitation.getStatus() + ")");
        }
        invitation.setStatus("WITHDRAWN");
        invitation.setRespondedAt(LocalDateTime.now());
        invitation.setResponseComment(reason);
        invitationRepository.save(invitation);

        CandidateApplication candidate = invitation.getCandidateApplication();
        if (CandidateStatus.INVITATION_SENT.equals(candidate.getStatus())) {
            workflow.transition(candidate, CandidateStatus.SHORTLISTED, accessGuard.currentEmployee(),
                    "Invitation withdrawn: " + reason);
        }
        notificationService.notify(invitation.getEmployee(), "INVITATION_WITHDRAWN",
                "Invitation withdrawn", reason, "INVITATION", invitation.getInvitationId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INVITATION_WITHDRAWN", "INVITATION",
                invitation.getId(), "OPEN", "WITHDRAWN", reason);
        return toDTO(invitation);
    }

    @Transactional(readOnly = true)
    public InvitationDTO get(String invitationId) {
        Invitation invitation = find(invitationId);
        accessGuard.assertOwnsProjectOrAdmin(invitation.getRequirement().getProject());
        return toDTO(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationDTO> listForRequirement(String requirementId) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        accessGuard.assertOwnsProjectOrAdmin(requirement.getProject());
        return invitationRepository.findByRequirementIdOrderByInvitedAtDesc(requirement.getId()).stream()
                .map(this::toDTO).toList();
    }

    private Invitation find(String invitationId) {
        return invitationRepository.findByInvitationId(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", invitationId));
    }

    public InvitationDTO toDTO(Invitation i) {
        return InvitationDTO.builder()
                .id(i.getId())
                .invitationId(i.getInvitationId())
                .applicationId(i.getCandidateApplication().getApplicationId())
                .requirementId(i.getRequirement().getRequirementId())
                .projectId(i.getRequirement().getProject().getProjectId())
                .employeeId(i.getEmployee().getEmployeeId())
                .employeeName(CandidateWorkflowService.name(i.getEmployee()))
                .status(i.getStatus())
                .message(i.getMessage())
                .requiresInterview(i.getRequiresInterview())
                .invitedByName(CandidateWorkflowService.name(i.getInvitedBy()))
                .invitedAt(i.getInvitedAt())
                .responseDeadline(i.getResponseDeadline())
                .viewedAt(i.getViewedAt())
                .respondedAt(i.getRespondedAt())
                .responseComment(i.getResponseComment())
                .build();
    }
}
