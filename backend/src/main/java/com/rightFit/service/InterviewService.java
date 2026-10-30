package com.rightFit.service;

import com.rightFit.dto.InterviewDtos.FeedbackDTO;
import com.rightFit.dto.InterviewDtos.InterviewDTO;
import com.rightFit.dto.InterviewDtos.InterviewResponseRequest;
import com.rightFit.dto.InterviewDtos.RescheduleInterviewRequest;
import com.rightFit.dto.InterviewDtos.ScheduleInterviewRequest;
import com.rightFit.dto.InterviewDtos.SubmitFeedbackRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.InterviewFeedback;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.InterviewConflictException;
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

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
    private final EventMailer eventMailer;

    private static final List<String> OPEN = List.of("SCHEDULED", "ACCEPTED");
    private static final LocalTime DAY_START = LocalTime.of(9, 0);
    private static final LocalTime DAY_END = LocalTime.of(18, 0);
    private static final int SUGGESTIONS = 6;

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

        // Check the slot before anything changes: the interviewer and the candidate must both be free at that time.
        int minutes = request.getDurationMinutes() != null ? request.getDurationMinutes() : 60;
        List<String> clashes = clashesFor(interviewer, candidate.getEmployee(), request.getScheduledAt(), minutes);
        if (!clashes.isEmpty()) {
            throw new InterviewConflictException(clashes,
                    suggestSlots(interviewer, candidate.getEmployee(), request.getScheduledAt(), minutes));
        }

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

        String when = IstTime.format(request.getScheduledAt(), "EEE d MMM yyyy, h:mm a") + " IST";
        notificationService.notify(candidate.getEmployee(), "INTERVIEW_SCHEDULED",
                "Interview scheduled for " + requirement.getPositionTitle(),
                "Round " + interview.getRoundNumber() + " on " + when + " with " + CandidateWorkflowService.name(interviewer),
                "INTERVIEW", interview.getInterviewId());
        eventMailer.interviewScheduled(interview);
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

    /** Admin sees every interview; a manager sees the interviews on requirements they run. */
    @Transactional(readOnly = true)
    public List<InterviewDTO> listForManager() {
        accessGuard.assertNotRmgOnly();
        List<Interview> interviews = accessGuard.isAdmin()
                ? interviewRepository.findAll().stream()
                        .sorted(java.util.Comparator.comparing(Interview::getScheduledAt).reversed()).toList()
                : interviewRepository.findByProjectManagerId(accessGuard.currentEmployee().getId());
        return interviews.stream().map(i -> toDTO(i, false)).toList();
    }

    /**
     * Interviews on the requirements the signed-in person coordinates or interviews on. Coordinators book and track them;
     * interviewers conduct them and give feedback.
     */
    @Transactional(readOnly = true)
    public List<InterviewDTO> dutyInterviews() {
        accessGuard.assertNotRmgOnly();
        Employee me = accessGuard.currentEmployee();
        java.util.Set<Long> requirementIds = accessGuard.dutyRequirementIds(me);
        if (requirementIds.isEmpty()) {
            return List.of();
        }
        return interviewRepository.findByRequirementIds(requirementIds).stream()
                .map(i -> toDTO(i, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> assignedToMe() {
        accessGuard.assertNotRmgOnly();
        Employee me = accessGuard.currentEmployee();
        return interviewRepository.findByInterviewerIdOrderByScheduledAtDesc(me.getId()).stream()
                .map(i -> toDTO(i, true)).toList();
    }

    /**
     * Sets or changes the meeting link on an open interview and tells the candidate. The interviewer can do this for
     * their own interview; a coordinator on the requirement can do it for any interview there.
     */
    public InterviewDTO setLink(String interviewId, String link) {
        Interview interview = find(interviewId);
        Employee me = accessGuard.currentEmployee();
        // Only the people who book interviews share the meeting link; the interviewer joins it.
        accessGuard.assertCanCoordinate(interview.getRequirement());
        if (!OPEN.contains(interview.getStatus())) {
            throw new BusinessRuleException("Only an open interview can get a link (status " + interview.getStatus() + ")");
        }
        String clean = link == null || link.isBlank() ? null : link.trim();
        interview.setLocationOrLink(clean);
        interviewRepository.save(interview);
        notificationService.notify(interview.getEmployee(), "INTERVIEW_LINK",
                "Interview link for " + interview.getRequirement().getPositionTitle(),
                clean == null ? "The link was removed. Your RMG will confirm the details." : "Join here: " + clean,
                "INTERVIEW", interview.getInterviewId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_LINK_SET", "INTERVIEW",
                interview.getId(), null, null, interview.getInterviewId() + " link updated by " + me.getEmployeeId());
        return toDTO(interview, true);
    }

    /** Coordinators and the manager can change any open interview; the interviewer only their own, more than an hour before it starts. */
    private void assertCanChangeInterview(Interview interview) {
        Employee me = accessGuard.currentEmployee();
        boolean mine = interview.getInterviewer() != null && interview.getInterviewer().getId().equals(me.getId());
        if (!mine) {
            accessGuard.assertCanCoordinate(interview.getRequirement());
            return;
        }
        if (!interview.getScheduledAt().isAfter(LocalDateTime.now().plusHours(1))) {
            throw new BusinessRuleException("An interviewer can change an interview only more than an hour before it starts");
        }
    }

    /**
     * Running an interview (marking it held) is the interviewer's own job at any time, even after it has started;
     * anyone else needs to be a coordinator or the project's manager.
     */
    private void assertCanRunInterview(Interview interview) {
        Employee me = accessGuard.currentEmployee();
        boolean mine = interview.getInterviewer() != null && interview.getInterviewer().getId().equals(me.getId());
        if (!mine) {
            accessGuard.assertCanCoordinate(interview.getRequirement());
        }
    }

    /** The interviewer (or a coordinator) marks an open interview as held once it has started. Feedback opens then. */
    public InterviewDTO markHeld(String interviewId) {
        Interview interview = find(interviewId);
        assertCanRunInterview(interview);
        if (!OPEN.contains(interview.getStatus())) {
            throw new BusinessRuleException("Only an open interview can be marked as held (status " + interview.getStatus() + ")");
        }
        if (interview.getScheduledAt().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("The interview has not started yet");
        }
        interview.setHeldAt(LocalDateTime.now());
        interviewRepository.save(interview);
        return toDTO(interview, true);
    }

    /** Moves an open interview to a new time, mode or room. The candidate and the interviewer are told. */
    public InterviewDTO reschedule(String interviewId, RescheduleInterviewRequest request) {
        Interview interview = find(interviewId);
        assertCanChangeInterview(interview);
        if (!OPEN.contains(interview.getStatus())) {
            throw new BusinessRuleException("Only an open interview can be rescheduled (status " + interview.getStatus() + ")");
        }
        int minutes = request.getDurationMinutes() != null ? request.getDurationMinutes()
                : interview.getDurationMinutes() != null ? interview.getDurationMinutes() : 60;
        Employee candidate = interview.getEmployee();
        Employee interviewer = interview.getInterviewer();
        List<String> clashes = clashesFor(interviewer, candidate, request.getScheduledAt(), minutes, interview.getId());
        if (!clashes.isEmpty()) {
            throw new InterviewConflictException(clashes, suggestSlots(interviewer, candidate, request.getScheduledAt(), minutes));
        }
        LocalDateTime previous = interview.getScheduledAt();
        interview.setScheduledAt(request.getScheduledAt());
        interview.setDurationMinutes(minutes);
        if (request.getMode() != null) {
            interview.setMode(request.getMode());
        }
        if (request.getLocationOrLink() != null) {
            interview.setLocationOrLink(request.getLocationOrLink().isBlank() ? null : request.getLocationOrLink().trim());
        }
        interviewRepository.save(interview);

        String when = IstTime.format(request.getScheduledAt(), "EEE d MMM, h:mm a");
        String was = IstTime.format(previous, "EEE d MMM, h:mm a");
        notificationService.notify(candidate, "INTERVIEW_RESCHEDULED", "Interview moved to " + when,
                interview.getRequirement().getPositionTitle() + ". It was " + was + ".", "INTERVIEW", interview.getInterviewId());
        Employee me = accessGuard.currentEmployee();
        if (!interviewer.getId().equals(me.getId())) {
            notificationService.notify(interviewer, "INTERVIEW_RESCHEDULED", "Interview moved to " + when,
                    CandidateWorkflowService.name(candidate) + ". It was " + was + ".", "INTERVIEW", interview.getInterviewId());
        }
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "INTERVIEW_RESCHEDULED", "INTERVIEW",
                interview.getId(), was, when, interview.getInterviewId() + " moved by " + me.getEmployeeId());
        return toDTO(interview, true);
    }

    public InterviewDTO cancel(String interviewId, String reason) {
        Interview interview = find(interviewId);
        assertCanChangeInterview(interview);
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

    /** Free times from now for the candidate's next interview, with the manager as interviewer. Booking nothing. */
    @Transactional(readOnly = true)
    public List<LocalDateTime> suggestSlotsFor(String applicationId, int minutes, String interviewerEmployeeId) {
        if (minutes < 15 || minutes > 480) {
            throw new BusinessRuleException("Duration must be between 15 and 480 minutes");
        }
        CandidateApplication candidate = workflow.find(applicationId);
        ProjectRequirement requirement = candidate.getRequirement();
        accessGuard.assertCanCoordinate(requirement);
        // The chosen interviewer (validated as eligible), or the project manager when none is chosen.
        Employee interviewer = resolveInterviewer(requirement, interviewerEmployeeId);
        return suggestSlots(interviewer, candidate.getEmployee(), LocalDateTime.now(), minutes);
    }

    /** Interviews of the interviewer, or of the candidate in any requirement, that overlap the requested slot. */
    private List<String> clashesFor(Employee interviewer, Employee candidate, LocalDateTime start, int minutes) {
        return clashesFor(interviewer, candidate, start, minutes, null);
    }

    /** As above, but ignoring one interview (the one being moved). */
    private List<String> clashesFor(Employee interviewer, Employee candidate, LocalDateTime start, int minutes, Long exclude) {
        List<String> clashes = new ArrayList<>();
        for (Interview i : interviewRepository.findByInterviewerIdOrderByScheduledAtDesc(interviewer.getId())) {
            if (exclude != null && i.getId().equals(exclude)) {
                continue;
            }
            if (overlaps(i, start, minutes)) {
                clashes.add(CandidateWorkflowService.name(interviewer) + " is already interviewing at "
                        + IstTime.format(i.getScheduledAt(), "EEE d MMM, h:mm a") + " (" + i.getInterviewId() + ")");
            }
        }
        for (Interview i : interviewRepository.findByEmployeeIdOrderByScheduledAtDesc(candidate.getId())) {
            if (exclude != null && i.getId().equals(exclude)) {
                continue;
            }
            if (overlaps(i, start, minutes)) {
                clashes.add(CandidateWorkflowService.name(candidate) + " already has an interview at "
                        + IstTime.format(i.getScheduledAt(), "EEE d MMM, h:mm a") + " (" + i.getInterviewId() + ")");
            }
        }
        return clashes;
    }

    /**
     * Free times after the requested one for both people: weekdays 09:00 to 18:00, half-hour steps, next two weeks.
     * Up to six, so the manager can pick one straight away.
     */
    private List<LocalDateTime> suggestSlots(Employee interviewer, Employee candidate, LocalDateTime requested, int minutes) {
        List<Interview> busy = new ArrayList<>(interviewRepository.findByInterviewerIdOrderByScheduledAtDesc(interviewer.getId()));
        busy.addAll(interviewRepository.findByEmployeeIdOrderByScheduledAtDesc(candidate.getId()));

        // Business hours are India hours; the loop works in IST and each slot is returned as UTC like every other time.
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = requested.isAfter(now) ? requested : now;
        LocalDateTime t = roundUpToHalfHour(IstTime.toIst(start));
        LocalDateTime limit = t.plusDays(14);
        List<LocalDateTime> out = new ArrayList<>();
        while (out.size() < SUGGESTIONS && t.isBefore(limit)) {
            DayOfWeek day = t.getDayOfWeek();
            if (day == DayOfWeek.SATURDAY) {
                t = t.toLocalDate().plusDays(2).atTime(DAY_START);
                continue;
            }
            if (day == DayOfWeek.SUNDAY) {
                t = t.toLocalDate().plusDays(1).atTime(DAY_START);
                continue;
            }
            if (t.toLocalTime().isBefore(DAY_START)) {
                t = t.toLocalDate().atTime(DAY_START);
                continue;
            }
            LocalDateTime end = t.plusMinutes(minutes);
            if (!end.toLocalDate().equals(t.toLocalDate()) || end.toLocalTime().isAfter(DAY_END)) {
                t = t.toLocalDate().plusDays(1).atTime(DAY_START);
                continue;
            }
            LocalDateTime slot = IstTime.toUtc(t);
            if (busy.stream().noneMatch(i -> overlaps(i, slot, minutes))) {
                out.add(slot);
            }
            t = t.plusMinutes(30);
        }
        return out;
    }

    private boolean overlaps(Interview i, LocalDateTime start, int minutes) {
        if (!OPEN.contains(i.getStatus()) || i.getScheduledAt() == null) {
            return false;
        }
        LocalDateTime busyStart = i.getScheduledAt();
        LocalDateTime busyEnd = busyStart.plusMinutes(i.getDurationMinutes() != null ? i.getDurationMinutes() : 60);
        return busyStart.isBefore(start.plusMinutes(minutes)) && start.isBefore(busyEnd);
    }

    private static LocalDateTime roundUpToHalfHour(LocalDateTime t) {
        LocalDateTime whole = t.withSecond(0).withNano(0);
        int minute = whole.getMinute();
        return minute == 0 || minute == 30 ? whole : whole.plusMinutes(30 - (minute % 30));
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
                .heldAt(i.getHeldAt())
                .cancelledReason(i.getCancelledReason())
                .feedback(feedback)
                .build();
    }
}
