package com.rightFit.service;

import com.rightFit.dto.InterviewDtos.FeedbackDTO;
import com.rightFit.dto.InterviewDtos.InterviewDTO;
import com.rightFit.dto.InterviewDtos.InterviewResponseRequest;
import com.rightFit.dto.InterviewDtos.ScheduleInterviewRequest;
import com.rightFit.dto.InterviewDtos.SubmitFeedbackRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.InterviewFeedback;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.InterviewFeedbackRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Manager Phase 7. Multiple interviews per employee, including several on the same day, are allowed
 * (BR-017/018). Interviewing never reserves the employee (BR-022). Feedback recommends; the Manager decides.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InterviewService {

    private static final List<String> OPEN = List.of("SCHEDULED", "ACCEPTED");

    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final EmployeeRepository employeeRepository;
    private final CandidateWorkflowService workflow;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public InterviewDTO schedule(String applicationId, ScheduleInterviewRequest request) {
        CandidateApplication candidate = workflow.find(applicationId);
        ProjectRequirement requirement = candidate.getRequirement();
        accessGuard.assertCanCoordinate(requirement);
        accessGuard.assertRequirementOpen(requirement);

        Employee interviewer = resolveInterviewer(requirement, request.getInterviewerEmployeeId());
        Employee actor = accessGuard.currentEmployee();

        if (!CandidateStatus.INTERVIEW.equals(candidate.getStatus())) {
            workflow.transition(candidate, CandidateStatus.INTERVIEW, actor, "Interview scheduled");
        }

        Interview interview = interviewRepository.save(Interview.builder()
                .interviewId("INT-" + interviewRepository.nextInterviewSequence())
                .candidateApplication(candidate)
                .requirement(requirement)
                .employee(candidate.getEmployee())
                .interviewer(interviewer)
                .scheduledBy(actor)
                .roundNumber((int) interviewRepository.countByCandidateApplicationId(candidate.getId()) + 1)
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60)
                .mode(request.getMode() != null ? request.getMode() : "ONLINE")
                .locationOrLink(request.getLocationOrLink())
                .notes(request.getNotes())
                .status("SCHEDULED")
                .build());

        String when = request.getScheduledAt().toString();
        notificationService.notify(candidate.getEmployee(), "INTERVIEW_SCHEDULED",
                "Interview scheduled for " + requirement.getPositionTitle(),
                "Round " + interview.getRoundNumber() + " on " + when + " with " + CandidateWorkflowService.name(interviewer),
                "INTERVIEW", interview.getInterviewId());
        if (!interviewer.getId().equals(actor.getId())) {
            notificationService.notify(interviewer, "INTERVIEW_ASSIGNED",
                    "You are interviewing " + CandidateWorkflowService.name(candidate.getEmployee()),
                    requirement.getRequirementId() + " - " + when, "INTERVIEW", interview.getInterviewId());
        }
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_SCHEDULED", "INTERVIEW",
                interview.getId(), null, "SCHEDULED",
                interview.getInterviewId() + " for " + candidate.getApplicationId() + " with "
                        + interviewer.getEmployeeId() + " at " + when);
        return toDTO(interview, true);
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> listForCandidate(String applicationId) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertCanReadRequirement(candidate.getRequirement());
        return interviewRepository.findByCandidateApplicationIdOrderByScheduledAtAscIdAsc(candidate.getId()).stream()
                .map(i -> toDTO(i, true)).toList();
    }

    @Transactional(readOnly = true)
    public InterviewDTO get(String interviewId) {
        Interview interview = find(interviewId);
        accessGuard.assertCanReadRequirement(interview.getRequirement());
        return toDTO(interview, true);
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> assignedToMe() {
        accessGuard.assertNotRmgOnly();
        Employee me = accessGuard.currentEmployee();
        return interviewRepository.findByInterviewerIdOrderByScheduledAtDesc(me.getId()).stream()
                .map(i -> toDTO(i, true)).toList();
    }

    public InterviewDTO cancel(String interviewId, String reason) {
        Interview interview = find(interviewId);
        accessGuard.assertCanCoordinate(interview.getRequirement());
        if (!OPEN.contains(interview.getStatus())) {
            throw new BusinessRuleException("Only a scheduled interview can be cancelled (status " + interview.getStatus() + ")");
        }
        interview.setStatus("CANCELLED");
        interview.setCancelledReason(reason);
        interviewRepository.save(interview);
        reconcileCandidate(interview.getCandidateApplication());

        notificationService.notify(interview.getEmployee(), "INTERVIEW_CANCELLED",
                "Interview cancelled", reason, "INTERVIEW", interview.getInterviewId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_CANCELLED", "INTERVIEW",
                interview.getId(), "OPEN", "CANCELLED", reason);
        return toDTO(interview, true);
    }

    /** Associate accepts/declines the interview invitation (BRD 4.4, 41.6). */
    public InterviewDTO respond(String interviewId, InterviewResponseRequest request) {
        Interview interview = find(interviewId);
        Employee me = accessGuard.currentEmployee();
        if (!interview.getEmployee().getId().equals(me.getId())) {
            throw ProjectAccessDeniedException.notYours("This interview");
        }
        if (!"SCHEDULED".equals(interview.getStatus())) {
            throw new BusinessRuleException("This interview is already " + interview.getStatus());
        }
        boolean accept = "ACCEPT".equals(request.getResponse());
        interview.setStatus(accept ? "ACCEPTED" : "DECLINED");
        interview.setCandidateResponseAt(LocalDateTime.now());
        interview.setCandidateResponseComment(request.getComment());
        interviewRepository.save(interview);
        if (!accept) {
            reconcileCandidate(interview.getCandidateApplication());
        }

        String verb = accept ? "accepted" : "declined";
        notificationService.notify(interview.getScheduledBy(), "INTERVIEW_RESPONSE",
                CandidateWorkflowService.name(me) + " " + verb + " interview " + interview.getInterviewId(),
                request.getComment(), "INTERVIEW", interview.getInterviewId());
        if (interview.getScheduledBy() == null || !interview.getScheduledBy().getId().equals(interview.getInterviewer().getId())) {
            notificationService.notify(interview.getInterviewer(), "INTERVIEW_RESPONSE",
                    CandidateWorkflowService.name(me) + " " + verb + " interview " + interview.getInterviewId(),
                    request.getComment(), "INTERVIEW", interview.getInterviewId());
        }
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_" + interview.getStatus(),
                "INTERVIEW", interview.getId(), "SCHEDULED", interview.getStatus(),
                me.getEmployeeId() + " " + verb + " " + interview.getInterviewId());
        return toDTO(interview, false);
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> myInterviews() {
        Employee me = accessGuard.currentEmployee();
        return interviewRepository.findByEmployeeIdOrderByScheduledAtDesc(me.getId()).stream()
                .map(i -> toDTO(i, false)).toList();
    }

    /**
     * The interviewer (or the owning Manager / Admin) records feedback. This completes the interview and
     * moves the candidate to INTERVIEW_COMPLETED -> RECOMMENDED - a recommendation, never the final decision.
     */
    public InterviewDTO submitFeedback(String interviewId, SubmitFeedbackRequest request) {
        Interview interview = find(interviewId);
        ProjectRequirement requirement = interview.getRequirement();
        accessGuard.assertNotRmgOnly();
        Employee me = accessGuard.currentEmployee();
        boolean isInterviewer = interview.getInterviewer().getId().equals(me.getId());
        if (!isInterviewer && !accessGuard.isAdmin()) {
            accessGuard.assertOwnsProject(requirement.getProject());
        }
        if (!OPEN.contains(interview.getStatus())) {
            throw new BusinessRuleException("Feedback can only be submitted for a scheduled interview (status "
                    + interview.getStatus() + ")");
        }
        if (feedbackRepository.findByInterviewId(interview.getId()).isPresent()) {
            throw new BusinessRuleException("Feedback was already submitted for " + interviewId);
        }

        feedbackRepository.save(InterviewFeedback.builder()
                .interview(interview)
                .rating(request.getRating())
                .technicalScore(request.getTechnicalScore())
                .communicationScore(request.getCommunicationScore())
                .culturalFitScore(request.getCulturalFitScore())
                .recommendation(request.getRecommendation())
                .comments(request.getComments())
                .givenBy(me)
                .build());
        interview.setStatus("COMPLETED");
        interview.setCompletedAt(LocalDateTime.now());
        interviewRepository.save(interview);

        CandidateApplication candidate = interview.getCandidateApplication();
        if (CandidateStatus.INTERVIEW.equals(candidate.getStatus())
                && interviewRepository.findByCandidateApplicationIdAndStatusIn(candidate.getId(), OPEN).isEmpty()) {
            workflow.transition(candidate, CandidateStatus.INTERVIEW_COMPLETED, me, "Interview " + interviewId + " completed");
            workflow.transition(candidate, CandidateStatus.RECOMMENDED, me,
                    "Recommendation: " + request.getRecommendation());
        }

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_COMPLETED", "INTERVIEW",
                interview.getId(), "OPEN", "COMPLETED", interviewId + " completed by " + me.getEmployeeId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "RECOMMENDATION_SUBMITTED", "INTERVIEW",
                interview.getId(), null, request.getRecommendation(),
                me.getEmployeeId() + " recommends " + request.getRecommendation() + " for "
                        + candidate.getApplicationId() + " (rating " + request.getRating() + ")");
        Employee manager = requirement.getProject().getManager();
        if (manager != null && !manager.getId().equals(me.getId())) {
            notificationService.notify(manager, "INTERVIEW_FEEDBACK",
                    "Interview feedback for " + CandidateWorkflowService.name(candidate.getEmployee()),
                    CandidateWorkflowService.name(me) + " recommends " + request.getRecommendation()
                            + " (rating " + request.getRating() + "/10)",
                    "CANDIDATE", candidate.getApplicationId());
        }
        return toDTO(interview, true);
    }

    /** After a cancelled/declined interview: fall back to the right candidate stage when nothing is open. */
    private void reconcileCandidate(CandidateApplication candidate) {
        if (!CandidateStatus.INTERVIEW.equals(candidate.getStatus())) {
            return;
        }
        if (!interviewRepository.findByCandidateApplicationIdAndStatusIn(candidate.getId(), OPEN).isEmpty()) {
            return;
        }
        boolean anyCompleted = !interviewRepository
                .findByCandidateApplicationIdAndStatusIn(candidate.getId(), List.of("COMPLETED")).isEmpty();
        workflow.transition(candidate, anyCompleted ? CandidateStatus.INTERVIEW_COMPLETED : CandidateStatus.ACCEPTED,
                accessGuard.currentEmployee(), "No open interviews remain");
    }

    private Employee resolveInterviewer(ProjectRequirement requirement, String interviewerEmployeeId) {
        Employee interviewer = interviewerEmployeeId == null || interviewerEmployeeId.isBlank()
                ? requirement.getProject().getManager()
                : employeeRepository.findByEmployeeId(interviewerEmployeeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee", interviewerEmployeeId));
        if (interviewer == null || !accessGuard.isEligibleInterviewer(requirement, interviewer)) {
            throw new BusinessRuleException("The interviewer must be the project's Manager or an assigned INTERVIEWER "
                    + "of " + requirement.getRequirementId() + " (RMG cannot interview)");
        }
        return interviewer;
    }

    private Interview find(String interviewId) {
        return interviewRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview", interviewId));
    }

    private InterviewDTO toDTO(Interview i, boolean includeFeedback) {
        FeedbackDTO feedback = null;
        if (includeFeedback) {
            feedback = feedbackRepository.findByInterviewId(i.getId()).map(f -> FeedbackDTO.builder()
                    .rating(f.getRating())
                    .technicalScore(f.getTechnicalScore())
                    .communicationScore(f.getCommunicationScore())
                    .culturalFitScore(f.getCulturalFitScore())
                    .recommendation(f.getRecommendation())
                    .comments(f.getComments())
                    .givenByName(CandidateWorkflowService.name(f.getGivenBy()))
                    .createdAt(f.getCreatedAt())
                    .build()).orElse(null);
        }
        return InterviewDTO.builder()
                .id(i.getId())
                .interviewId(i.getInterviewId())
                .applicationId(i.getCandidateApplication().getApplicationId())
                .requirementId(i.getRequirement().getRequirementId())
                .projectId(i.getRequirement().getProject().getProjectId())
                .employeeId(i.getEmployee().getEmployeeId())
                .employeeName(CandidateWorkflowService.name(i.getEmployee()))
                .interviewerId(i.getInterviewer().getEmployeeId())
                .interviewerName(CandidateWorkflowService.name(i.getInterviewer()))
                .scheduledByName(CandidateWorkflowService.name(i.getScheduledBy()))
                .roundNumber(i.getRoundNumber())
                .scheduledAt(i.getScheduledAt())
                .durationMinutes(i.getDurationMinutes())
                .mode(i.getMode())
                .locationOrLink(i.getLocationOrLink())
                .notes(i.getNotes())
                .status(i.getStatus())
                .candidateResponseAt(i.getCandidateResponseAt())
                .candidateResponseComment(i.getCandidateResponseComment())
                .completedAt(i.getCompletedAt())
                .cancelledReason(i.getCancelledReason())
                .feedback(feedback)
                .build();
    }
}
