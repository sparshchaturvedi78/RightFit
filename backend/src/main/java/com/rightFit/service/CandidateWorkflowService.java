package com.rightFit.service;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.CandidateHistoryDTO;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.CandidateStatusHistory;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.Invitation;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.InvalidStateTransitionException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.CandidateStatusHistoryRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.repository.InvitationRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Single place that moves a CandidateApplication between statuses, records history and audit. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CandidateWorkflowService {

    private final CandidateApplicationRepository candidateRepository;
    private final CandidateStatusHistoryRepository historyRepository;
    private final InvitationRepository invitationRepository;
    private final InterviewRepository interviewRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public CandidateApplication find(String applicationId) {
        return candidateRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", applicationId));
    }

    public void transition(CandidateApplication candidate, String to, Employee actor, String reason) {
        String from = candidate.getStatus();
        if (!CandidateStatus.canTransition(from, to)) {
            throw new InvalidStateTransitionException("candidate", from, to);
        }
        apply(candidate, from, to, actor, reason);
    }

    /** System-driven moves (closure, archival) that are not part of the interactive lifecycle. */
    public void forceTransition(CandidateApplication candidate, String to, Employee actor, String reason) {
        apply(candidate, candidate.getStatus(), to, actor, reason);
    }

    private void apply(CandidateApplication candidate, String from, String to, Employee actor, String reason) {
        candidate.setPreviousStatus(from);
        candidate.setStatus(to);
        candidateRepository.save(candidate);

        historyRepository.save(CandidateStatusHistory.builder()
                .candidateApplication(candidate)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(actor)
                .reason(reason)
                .build());

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CANDIDATE_" + to, "CANDIDATE",
                candidate.getId(), from, to,
                "Candidate " + candidate.getApplicationId() + " (" + candidate.getRequirement().getRequirementId()
                        + "): " + from + " -> " + to + (reason != null ? " - " + reason : ""));
        log.info("Candidate {} {} -> {}", candidate.getApplicationId(), from, to);
    }

    public void recordCreation(CandidateApplication candidate, Employee actor, String reason) {
        historyRepository.save(CandidateStatusHistory.builder()
                .candidateApplication(candidate)
                .toStatus(candidate.getStatus())
                .changedBy(actor)
                .reason(reason)
                .build());
    }

    /** Withdraw open invitations and cancel scheduled interviews when a candidacy ends. */
    public void cancelOpenItems(CandidateApplication candidate, String reason) {
        List<Invitation> invitations = invitationRepository
                .findByCandidateApplicationIdAndStatusIn(candidate.getId(), List.of("SENT", "VIEWED"));
        for (Invitation invitation : invitations) {
            invitation.setStatus("WITHDRAWN");
            invitation.setRespondedAt(LocalDateTime.now());
            invitation.setResponseComment(reason);
            invitationRepository.save(invitation);
        }
        List<Interview> interviews = interviewRepository
                .findByCandidateApplicationIdAndStatusIn(candidate.getId(), List.of("SCHEDULED", "ACCEPTED"));
        for (Interview interview : interviews) {
            interview.setStatus("CANCELLED");
            interview.setCancelledReason(reason);
            interviewRepository.save(interview);
        }
    }

    @Transactional(readOnly = true)
    public List<CandidateHistoryDTO> history(CandidateApplication candidate) {
        return historyRepository.findByCandidateApplicationIdOrderByChangedAtAscIdAsc(candidate.getId()).stream()
                .map(h -> CandidateHistoryDTO.builder()
                        .fromStatus(h.getFromStatus())
                        .toStatus(h.getToStatus())
                        .changedByName(name(h.getChangedBy()))
                        .reason(h.getReason())
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
    }

    public CandidateDTO toDTO(CandidateApplication c) {
        Employee employee = c.getEmployee();
        boolean declined = CandidateStatus.ACCEPTED.equals(c.getStatus())
                && !interviewRepository.findByCandidateApplicationIdAndStatusIn(c.getId(), List.of("DECLINED")).isEmpty();
        return CandidateDTO.builder()
                .interviewDeclined(declined)
                .id(c.getId())
                .applicationId(c.getApplicationId())
                .requirementId(c.getRequirement().getRequirementId())
                .projectId(c.getRequirement().getProject().getProjectId())
                .employeeId(employee.getEmployeeId())
                .employeeName(name(employee))
                .grade(employee.getGrade())
                .designation(employee.getDesignation())
                .status(c.getStatus())
                .previousStatus(c.getPreviousStatus())
                .source(c.getSource())
                .notes(c.getNotes())
                .identifiedByName(name(c.getIdentifiedBy()))
                .identifiedAt(c.getIdentifiedAt())
                .shortlistedByName(name(c.getShortlistedBy()))
                .shortlistedAt(c.getShortlistedAt())
                .requiresInterview(c.getRequiresInterview())
                .confirmedAt(c.getConfirmedAt())
                .decision(c.getDecision())
                .decisionByName(name(c.getDecisionBy()))
                .decisionAt(c.getDecisionAt())
                .decisionReason(c.getDecisionReason())
                .rejectionReasonCode(c.getRejectionReasonCode())
                .rejectionComment(c.getRejectionComment())
                .rejectedAt(c.getRejectedAt())
                .archived(c.getArchived())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    /** A candidate still in the process: not allocated, declined, rejected or withdrawn, and not archived. */
    private static boolean live(CandidateApplication c) {
        return !CandidateStatus.TERMINAL.contains(c.getStatus()) && !Boolean.TRUE.equals(c.getArchived());
    }

    /** Someone on the requirement has gone into allocation: everyone else still in the process waits on hold. */
    public void holdOthers(ProjectRequirement requirement, CandidateApplication keep, Employee actor) {
        for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())) {
            if (c.getId().equals(keep.getId()) || !live(c) || CandidateStatus.ON_HOLD.equals(c.getStatus())) {
                continue;
            }
            String reason = "On hold while " + name(keep.getEmployee()) + " is in allocation";
            forceTransition(c, CandidateStatus.ON_HOLD, actor, reason);
            notificationService.notify(c.getEmployee(), "CANDIDATE_ON_HOLD", "On hold for " + requirement.getRequirementId(),
                    reason, "CANDIDATE", c.getApplicationId());
        }
    }

    /** The requirement is filled by someone else: everyone else still in the process is released. */
    public void releaseOthers(ProjectRequirement requirement, CandidateApplication filledBy, Employee actor) {
        String reason = "Released: " + requirement.getRequirementId() + " was filled by " + name(filledBy.getEmployee());
        for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())) {
            if (c.getId().equals(filledBy.getId()) || !live(c)) {
                continue;
            }
            forceTransition(c, CandidateStatus.WITHDRAWN, actor, reason);
            cancelOpenItems(c, reason);
            notificationService.notify(c.getEmployee(), "CANDIDATE_RELEASED", "Update on " + requirement.getPositionTitle(),
                    reason, "CANDIDATE", c.getApplicationId());
        }
    }

    /**
     * The person was allocated: every other live candidacy they have, on any requirement, is closed. Each of those
     * requirements' managers is told which project took them and who manages it.
     */
    public void closeOtherCandidacies(CandidateApplication allocated, Employee actor) {
        Employee person = allocated.getEmployee();
        com.rightFit.entity.Project project = allocated.getRequirement().getProject();
        Employee pm = project.getManager();
        String selectedFor = project.getProjectName()
                + (pm != null ? " (manager " + name(pm) + ", " + pm.getEmployeeId() + ")" : "");
        String reason = name(person) + " was selected for " + selectedFor;
        for (CandidateApplication c : candidateRepository.findByEmployeeIdOrderByCreatedAtDesc(person.getId())) {
            if (c.getId().equals(allocated.getId()) || !live(c)) {
                continue;
            }
            forceTransition(c, CandidateStatus.WITHDRAWN, actor, reason);
            cancelOpenItems(c, reason);
            Employee otherManager = c.getRequirement().getProject().getManager();
            if (otherManager != null) {
                notificationService.notify(otherManager, "CANDIDATE_ALLOCATED_ELSEWHERE",
                        name(person) + " was allocated to another project",
                        reason + ". Their candidacy for " + c.getRequirement().getRequirementId() + " was closed.",
                        "CANDIDATE", c.getApplicationId());
            }
        }
    }

    /** The allocation fell through: candidates who were held go back to the stage they were in. */
    public void resumeHeld(ProjectRequirement requirement, Employee actor, String reason) {
        for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())) {
            if (!CandidateStatus.ON_HOLD.equals(c.getStatus())) {
                continue;
            }
            String back = c.getPreviousStatus() == null || CandidateStatus.ON_HOLD.equals(c.getPreviousStatus())
                    ? CandidateStatus.IDENTIFIED : c.getPreviousStatus();
            forceTransition(c, back, actor, reason);
            notificationService.notify(c.getEmployee(), "CANDIDATE_RESUMED", "Back in the process for " + requirement.getRequirementId(),
                    reason, "CANDIDATE", c.getApplicationId());
        }
    }

    public static String name(Employee employee) {
        return employee == null ? null : employee.getFirstName() + " " + employee.getLastName();
    }
}
