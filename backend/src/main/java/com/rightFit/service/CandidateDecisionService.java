package com.rightFit.service;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.DecisionRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.repository.CandidateApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Manager Phase 8. The decision hierarchy is INTERVIEWER -> recommendation -> MANAGER -> final decision (BRD 16).
 * Only the project's owning Manager decides: no Admin, RMG, Interviewer or Coordinator (BR-025, FR-032/033).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CandidateDecisionService {

    private static final List<String> REVIEWABLE = List.of(
            CandidateStatus.ACCEPTED, CandidateStatus.INTERVIEW_COMPLETED, CandidateStatus.RECOMMENDED);

    private final CandidateApplicationRepository candidateRepository;
    private final CandidateWorkflowService workflow;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;

    /** Move the candidate into MANAGER_REVIEW so the Manager can review feedback and the recommendation. */
    public CandidateDTO startReview(String applicationId) {
        CandidateApplication candidate = load(applicationId);
        toReview(candidate, accessGuard.currentEmployee());
        return workflow.toDTO(candidate);
    }

    public CandidateDTO decide(String applicationId, DecisionRequest request) {
        CandidateApplication candidate = load(applicationId);
        Employee manager = accessGuard.currentEmployee();
        ProjectRequirement requirement = candidate.getRequirement();
        String decision = request.getDecision();

        switch (decision) {
            case "SELECT" -> {
                if (CandidateStatus.INTERVIEW.equals(candidate.getStatus())) {
                    throw new BusinessRuleException("Interviews are still in progress; complete or cancel them before deciding");
                }
                toReview(candidate, manager);
                boolean requirementFilled = candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())
                        .stream().anyMatch(c -> !c.getId().equals(candidate.getId())
                                && List.of(CandidateStatus.ALLOCATION_REQUESTED, CandidateStatus.ALLOCATED).contains(c.getStatus()));
                if (requirementFilled) {
                    throw new BusinessRuleException("Requirement " + requirement.getRequirementId()
                            + " already has a candidate at allocation stage (one requirement = one resource)");
                }
                workflow.transition(candidate, CandidateStatus.SELECTED, manager, request.getComment());
                stamp(candidate, manager, "SELECT", request.getComment());
                notificationService.notify(candidate.getEmployee(), "MANAGER_DECISION",
                        "You were selected for " + requirement.getPositionTitle(),
                        "Please confirm or decline the opportunity for " + requirement.getProject().getProjectName(),
                        "CANDIDATE", candidate.getApplicationId());
            }
            case "REJECT" -> {
                String code = request.getReasonCode() == null ? null : request.getReasonCode().toUpperCase();
                if (code == null || !CandidateStatus.REJECTION_REASON_CODES.contains(code)) {
                    throw new BusinessRuleException("A rejection reasonCode is required: "
                            + String.join(", ", new java.util.TreeSet<>(CandidateStatus.REJECTION_REASON_CODES)));
                }
                workflow.transition(candidate, CandidateStatus.REJECTED, manager,
                        code + (request.getComment() != null ? " - " + request.getComment() : ""));
                candidate.setRejectionReasonCode(code);
                candidate.setRejectionComment(request.getComment());
                candidate.setRejectedAt(LocalDateTime.now());
                stamp(candidate, manager, "REJECT", request.getComment());
                workflow.cancelOpenItems(candidate, "Candidate rejected");
                notificationService.notify(candidate.getEmployee(), "MANAGER_DECISION",
                        "Update on " + requirement.getPositionTitle(),
                        "You were not selected for " + requirement.getRequirementId()
                                + ". This does not affect other opportunities.",
                        "CANDIDATE", candidate.getApplicationId());
            }
            default -> {
                workflow.transition(candidate, CandidateStatus.ON_HOLD, manager, request.getComment());
                stamp(candidate, manager, "HOLD", request.getComment());
            }
        }
        return workflow.toDTO(candidate);
    }

    public CandidateDTO resume(String applicationId, String reason) {
        CandidateApplication candidate = load(applicationId);
        if (!CandidateStatus.ON_HOLD.equals(candidate.getStatus()) || candidate.getPreviousStatus() == null) {
            throw new BusinessRuleException("Only an ON_HOLD candidate can be resumed");
        }
        workflow.transition(candidate, candidate.getPreviousStatus(), accessGuard.currentEmployee(),
                "Resumed: " + reason);
        candidate.setDecision(null);
        candidateRepository.save(candidate);
        return workflow.toDTO(candidate);
    }

    private void toReview(CandidateApplication candidate, Employee manager) {
        if (CandidateStatus.MANAGER_REVIEW.equals(candidate.getStatus())) {
            return;
        }
        if (!REVIEWABLE.contains(candidate.getStatus())) {
            throw new BusinessRuleException("Candidate is " + candidate.getStatus()
                    + "; only an ACCEPTED, INTERVIEW_COMPLETED or RECOMMENDED candidate can go to Manager review");
        }
        workflow.transition(candidate, CandidateStatus.MANAGER_REVIEW, manager, "Manager review");
    }

    private void stamp(CandidateApplication candidate, Employee manager, String decision, String reason) {
        candidate.setDecision(decision);
        candidate.setDecisionBy(manager);
        candidate.setDecisionAt(LocalDateTime.now());
        candidate.setDecisionReason(reason);
        candidateRepository.save(candidate);
    }

    private CandidateApplication load(String applicationId) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertOwnsProject(candidate.getRequirement().getProject());
        accessGuard.assertRequirementOpen(candidate.getRequirement());
        return candidate;
    }
}
