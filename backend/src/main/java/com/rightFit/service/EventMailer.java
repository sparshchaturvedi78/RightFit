package com.rightFit.service;

import com.rightFit.entity.Allocation;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.Invitation;
import com.rightFit.entity.Project;
import com.rightFit.entity.TrainingAssignment;
import com.rightFit.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The emails for things that happen in the app: an invitation, a selection, an allocation, a training decision and so
 * on. Each event has its own colour, heading, details and button, drawn from one layout. Emails go out after the
 * database change commits, in the background, so a slow or failing mail server never blocks or undoes the action.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventMailer {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM yyyy");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM yyyy, h:mm a");

    private static final String BLUE = "#1d4ed8";
    private static final String VIOLET = "#6d28d9";
    private static final String GREEN = "#047857";
    private static final String TEAL = "#0f766e";
    private static final String AMBER = "#b45309";
    private static final String ROSE = "#be123c";
    private static final String SLATE = "#334155";
    private static final String SKY = "#0369a1";
    private static final String INDIGO = "#4338ca";

    private final EmailSender emailSender;
    private final MailTemplateRenderer renderer;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.login-url:http://localhost:5173/login}")
    private String loginUrl;

    // ---------------------------------------------------------------- associate: opportunities

    public void invitationReceived(Invitation invitation) {
        Employee to = invitation.getEmployee();
        String role = invitation.getRequirement().getPositionTitle();
        String project = invitation.getRequirement().getProject().getProjectName();
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Role", role});
        rows.add(new String[] {"Project", project});
        rows.add(new String[] {"Requirement", invitation.getRequirement().getRequirementId()});
        rows.add(new String[] {"Invited by", name(invitation.getInvitedBy())});
        rows.add(new String[] {"Reply by", invitation.getResponseDeadline() == null ? "No deadline set" : when(invitation.getResponseDeadline())});
        dispatch(new Event("invitation-received", to.getEmail(), "New invitation: " + role, BLUE, "#eff6ff",
                "Interview invitation", "You've been invited to a role", to.getFirstName(),
                name(invitation.getInvitedBy()) + " invited you to " + role + " on " + project + ".",
                rows, invitation.getMessage() == null || invitation.getMessage().isBlank() ? null : "info",
                invitation.getMessage(), null, "View invitation", frontendUrl + "/associate/invitations"));
    }

    public void interviewScheduled(Interview interview) {
        Employee to = interview.getEmployee();
        String role = interview.getRequirement().getPositionTitle();
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Role", role});
        rows.add(new String[] {"Round", String.valueOf(interview.getRoundNumber())});
        rows.add(new String[] {"When", when(interview.getScheduledAt())});
        rows.add(new String[] {"Duration", interview.getDurationMinutes() + " minutes"});
        rows.add(new String[] {"Format", humanMode(interview.getMode())});
        rows.add(new String[] {"Interviewer", name(interview.getInterviewer())});
        rows.add(new String[] {"Location or link", interview.getLocationOrLink()});
        dispatch(new Event("interview-scheduled", to.getEmail(), "Interview scheduled: " + role, VIOLET, "#f5f3ff",
                "Interview scheduled", "Your interview is booked", to.getFirstName(),
                "Your round " + interview.getRoundNumber() + " interview for " + role + " is on " + when(interview.getScheduledAt()) + ".",
                rows, null, null, null, "View interview", frontendUrl + "/associate/interviews"));
    }

    public void selected(CandidateApplication candidate, Employee manager) {
        Employee to = candidate.getEmployee();
        String role = candidate.getRequirement().getPositionTitle();
        String project = candidate.getRequirement().getProject().getProjectName();
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Role", role});
        rows.add(new String[] {"Project", project});
        rows.add(new String[] {"Requirement", candidate.getRequirement().getRequirementId()});
        rows.add(new String[] {"Selected by", name(manager)});
        dispatch(new Event("candidate-selected", to.getEmail(), "You've been selected: " + role, GREEN, "#ecfdf5",
                "Selection", "You've been selected", to.getFirstName(),
                name(manager) + " selected you for " + role + " on " + project + ". Confirm or decline the opportunity to go ahead.",
                rows, "success", "Once you confirm, your RMG arranges the allocation.", null,
                "Review opportunity", frontendUrl + "/associate/invitations"));
    }

    public void notSelected(CandidateApplication candidate) {
        Employee to = candidate.getEmployee();
        String requirement = candidate.getRequirement().getRequirementId();
        dispatch(new Event("candidate-not-selected", to.getEmail(), "Update on " + requirement, SLATE, "#f1f5f9",
                "Update on your application", "Not this time", to.getFirstName(),
                "You were not selected for " + requirement + " (" + candidate.getRequirement().getPositionTitle()
                        + "). This does not affect your other opportunities.",
                List.of(), null, null, null, "Open my dashboard", frontendUrl + "/associate/dashboard"));
    }

    // ---------------------------------------------------------------- allocation

    /** The associate hears they are allocated, and the requesting manager hears the RMG approved it. */
    public void allocationApproved(AllocationRequest request, Allocation allocation) {
        Employee employee = request.getEmployee();
        String project = request.getProject().getProjectName();
        String hours = hours(allocation.getHoursPerDay());

        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Project", project});
        rows.add(new String[] {"Project manager", name(request.getProject().getManager())});
        rows.add(new String[] {"Hours per day", hours});
        rows.add(new String[] {"Start date", when(allocation.getStartDate())});
        dispatch(new Event("allocation-approved", employee.getEmail(), "You're allocated to " + project, TEAL, "#f0fdfa",
                "Allocation approved", "You're on " + project, employee.getFirstName(),
                "Your RMG has approved your allocation. Here's where you'll be working.",
                rows, null, null, null, "View my project", frontendUrl + "/associate/projects"));

        List<String[]> managerRows = new ArrayList<>();
        managerRows.add(new String[] {"Associate", name(employee)});
        managerRows.add(new String[] {"Project", project});
        managerRows.add(new String[] {"Hours per day", hours});
        managerRows.add(new String[] {"Start date", when(allocation.getStartDate())});
        if (request.getSubmittedBy() != null) {
            dispatch(new Event("allocation-approved-manager", request.getSubmittedBy().getEmail(),
                    "Allocation approved: " + name(employee), TEAL, "#f0fdfa",
                    "Allocation approved", "Your request was approved", request.getSubmittedBy().getFirstName(),
                    "The RMG approved the allocation request " + request.getRequestId() + ". The requirement is now allocated.",
                    managerRows, null, null, null, "Open allocation requests", frontendUrl + "/manager/allocation-requests"));
        }
    }

    public void allocationRejected(AllocationRequest request, String reason) {
        Employee manager = request.getSubmittedBy();
        if (manager == null) return;
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Associate", name(request.getEmployee())});
        rows.add(new String[] {"Project", request.getProject().getProjectName()});
        rows.add(new String[] {"Request", request.getRequestId()});
        dispatch(new Event("allocation-rejected", manager.getEmail(), "Allocation rejected: " + name(request.getEmployee()), ROSE, "#fff1f2",
                "Allocation rejected", "The request was rejected", manager.getFirstName(),
                "The RMG rejected the allocation request for " + name(request.getEmployee()) + ".",
                rows, "danger", reason == null || reason.isBlank() ? "No reason was given." : "Reason: " + reason, null,
                "Open allocation requests", frontendUrl + "/manager/allocation-requests"));
    }

    /** Goes to the RMG who looks after the associate, so they can approve it. */
    public void allocationRequested(AllocationRequest request) {
        Employee rmg = request.getEmployee().getRmgManager();
        if (rmg == null) return;
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Associate", name(request.getEmployee())});
        rows.add(new String[] {"Project", request.getProject().getProjectName()});
        rows.add(new String[] {"Requirement", request.getRequirement().getRequirementId()});
        rows.add(new String[] {"Hours per day", hours(request.getRequestedHoursPerDay())});
        rows.add(new String[] {"Start date", when(request.getRequestedStartDate())});
        rows.add(new String[] {"Requested by", name(request.getSubmittedBy())});
        dispatch(new Event("allocation-requested", rmg.getEmail(), "Allocation needs approval: " + name(request.getEmployee()), AMBER, "#fffbeb",
                "Allocation request", "An allocation needs your approval", rmg.getFirstName(),
                "A manager has requested " + name(request.getEmployee()) + " for " + request.getProject().getProjectName() + ".",
                rows, null, null, null, "Review request", frontendUrl + "/rmg/allocation-requests"));
    }

    /** A manager adds someone straight to their team. */
    public void teamMemberAdded(Employee employee, Project project, Allocation allocation) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Project", project.getProjectName()});
        rows.add(new String[] {"Client", project.getClientName()});
        rows.add(new String[] {"Hours per day", hours(allocation.getHoursPerDay())});
        rows.add(new String[] {"Start date", when(allocation.getStartDate())});
        dispatch(new Event("team-member-added", employee.getEmail(), "You were added to " + project.getProjectName(), SKY, "#f0f9ff",
                "Team update", "Welcome to " + project.getProjectName(), employee.getFirstName(),
                "You've been added to the team on " + project.getProjectName() + ".",
                rows, null, null, null, "Open my team", frontendUrl + "/associate/team"));
    }

    // ---------------------------------------------------------------- manager

    /** Confirmation to the manager who claimed a project. */
    public void projectClaimed(Project project, Employee manager) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Project", project.getProjectName()});
        rows.add(new String[] {"Project ID", project.getProjectId()});
        rows.add(new String[] {"Client", project.getClientName()});
        rows.add(new String[] {"Claimed on", when(LocalDateTime.now())});
        dispatch(new Event("project-claimed", manager.getEmail(), "You now manage " + project.getProjectName(), GREEN, "#ecfdf5",
                "Project claimed", "You now manage " + project.getProjectName(), manager.getFirstName(),
                "Your claim on " + project.getProjectName() + " is confirmed. You can now staff the team and requirements.",
                rows, null, null, null, "Open project", frontendUrl + "/manager/projects/" + project.getProjectId()));
    }

    // ---------------------------------------------------------------- training

    public void trainingAssigned(TrainingAssignment assignment) {
        Employee to = assignment.getEmployee();
        String program = assignment.getTrainingProgram().getProgramName();
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Program", program});
        rows.add(new String[] {"Start date", assignment.getStartDate() == null ? "To be confirmed" : when(assignment.getStartDate())});
        rows.add(new String[] {"Expected end", assignment.getExpectedEndDate() == null ? null : when(assignment.getExpectedEndDate())});
        rows.add(new String[] {"Assigned by", name(assignment.getAssignedBy())});
        dispatch(new Event("training-assigned", to.getEmail(), "Training assigned: " + program, INDIGO, "#eef2ff",
                "Training assigned", "You've been assigned to " + program, to.getFirstName(),
                "Your RMG has scheduled this training for you. Reach out to them with any questions.",
                rows, null, null, null, "View training", frontendUrl + "/associate/training"));
    }

    /** The RMG's answer to an associate's request to join a course. The reason is shown in full. */
    public void trainingDecision(TrainingAssignment assignment, boolean approved, String reason) {
        Employee to = assignment.getEmployee();
        String program = assignment.getTrainingProgram().getProgramName();
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Program", program});
        rows.add(new String[] {"Decided by", approved ? name(assignment.getAssignedBy()) : "Your RMG"});
        if (approved) {
            rows.add(new String[] {"Start date", assignment.getStartDate() == null ? "To be confirmed" : when(assignment.getStartDate())});
            rows.add(new String[] {"Expected end", assignment.getExpectedEndDate() == null ? null : when(assignment.getExpectedEndDate())});
        }
        String tone = approved ? "success" : "warn";
        String note = reason == null || reason.isBlank() ? null : "Your RMG's reason:\n" + reason;
        dispatch(new Event("training-decision", to.getEmail(),
                (approved ? "You're in " : "Training request declined: ") + program, approved ? GREEN : ROSE,
                approved ? "#ecfdf5" : "#fff1f2", "Training request",
                approved ? "You're in " + program : "Your request was declined", to.getFirstName(),
                approved ? "Your request to join " + program + " was approved."
                        : "Your request to join " + program + " was declined.",
                rows, note == null ? null : tone, note, null, "View training", frontendUrl + "/associate/training"));
    }

    // ---------------------------------------------------------------- account security

    /** The one-time code for a forgotten password. Returned, not dispatched, because the caller waits for SMTP. */
    public MailMessage forgotPasswordCode(String to, String firstName, String code, int minutes) {
        return build(new Event("forgot-password-code", to, "Reset your RightFit password: " + code, AMBER, "#fffbeb",
                "Forgot password", "Your reset code", firstName,
                "We received a request to reset your password. Enter this code to continue.",
                List.of(), null, null, code, null, null),
                "Valid for " + minutes + " minutes and can be used once. If you didn't request this, ignore this email.");
    }

    /** Confirms a password change, whether it was done by reset or from the account page. */
    public void passwordChanged(User user) {
        String name = user.getEmployee() != null ? user.getEmployee().getFirstName() : "there";
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Account", user.getEmail()});
        rows.add(new String[] {"Changed on", when(LocalDateTime.now())});
        dispatch(new Event("password-changed", user.getEmail(), "Your RightFit password was changed", SLATE, "#f1f5f9",
                "Password changed", "Your password was changed", name,
                "The password for your RightFit account was just changed.",
                rows, "danger", "If this wasn't you, reset your password straight away and tell your RMG.", null,
                "Sign in", loginUrl));
    }

    // ---------------------------------------------------------------- internals

    /** One email's content. {@code code} is a one-time code shown large above the button, if there is one. */
    private record Event(String kind, String to, String subject, String accent, String soft, String eyebrow, String heading,
                         String firstName, String intro, List<String[]> details, String calloutTone, String callout,
                         String code, String ctaLabel, String ctaUrl) {
    }

    private void dispatch(Event event) {
        MailMessage message = build(event, null);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    emailSender.deliverAsync(message);
                }
            });
        } else {
            emailSender.deliverAsync(message);
        }
    }

    private MailMessage build(Event e, String codeNote) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("title", e.subject());
        values.put("accent", e.accent());
        values.put("eyebrow", e.eyebrow());
        values.put("heading", e.heading());
        values.put("greeting", "Hi " + (e.firstName() == null || e.firstName().isBlank() ? "there" : e.firstName().trim()) + ",");
        values.put("intro", e.intro());
        values.put("footer", "This is an automatic message from RightFit. Please don't reply to it.");

        StringBuilder raw = new StringBuilder();
        if (!e.details().isEmpty()) raw.append(MailBlocks.details(e.details()));
        if (e.code() != null) raw.append(MailBlocks.code(e.code(), codeNote != null ? codeNote : "Expires in 10 minutes", e.accent(), e.soft()));
        if (e.callout() != null && e.calloutTone() != null) raw.append(MailBlocks.callout(e.calloutTone(), e.callout()));
        if (e.ctaLabel() != null && e.ctaUrl() != null) raw.append(MailBlocks.button(e.ctaLabel(), e.ctaUrl(), e.accent()));
        Map<String, String> rawValues = Map.of("rawBody", raw.toString());
        String html = renderer.render("event", values, rawValues);

        StringBuilder text = new StringBuilder(values.get("greeting")).append("\n\n").append(e.intro()).append("\n\n");
        for (String[] row : e.details()) {
            if (row[1] != null && !row[1].isBlank()) text.append(row[0]).append(": ").append(row[1]).append('\n');
        }
        if (e.code() != null) text.append("\nYour code: ").append(e.code()).append('\n');
        if (e.callout() != null) text.append('\n').append(e.callout()).append('\n');
        if (e.ctaUrl() != null) text.append('\n').append(e.ctaLabel()).append(": ").append(e.ctaUrl()).append('\n');
        return new MailMessage(e.to(), e.subject(), text.toString(), html, e.kind());
    }

    private static String name(Employee e) {
        return e == null ? "Your RMG" : com.rightFit.service.CandidateWorkflowService.name(e);
    }

    private static String when(Object t) {
        if (t == null) return "";
        if (t instanceof LocalDateTime dt) return dt.format(WHEN);
        if (t instanceof LocalDate d) return d.format(DAY);
        return t.toString();
    }

    private static String hours(java.math.BigDecimal h) {
        return h == null ? "" : h.stripTrailingZeros().toPlainString() + " h";
    }

    private static String humanMode(String mode) {
        if (mode == null) return "";
        return switch (mode) {
            case "IN_PERSON" -> "In person";
            case "PHONE" -> "Phone";
            default -> "Online";
        };
    }
}
