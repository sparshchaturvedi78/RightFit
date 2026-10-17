package com.rightFit.service;

import com.rightFit.dto.AuditLogDTO;
import com.rightFit.dto.DashboardDtos.DecisionCardDTO;
import com.rightFit.dto.DashboardDtos.ManagerDashboardDTO;
import com.rightFit.dto.DashboardDtos.ProjectStaffingDTO;
import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.dto.DashboardDtos.RequirementCardDTO;
import com.rightFit.dto.DashboardDtos.SelectionGroupDTO;
import com.rightFit.dto.DashboardDtos.SelectionPersonDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.AuditLog;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.AuditLogRepository;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.InterviewFeedbackRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.repository.InvitationRepository;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Manager Phase 13: dashboard (BRD 42), Manager-relevant reports (BRD 43) and requirement history. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManagerDashboardService {

    private final ProjectRepository projectRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final CandidateApplicationRepository candidateRepository;
    private final InvitationRepository invitationRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final AllocationRequestRepository allocationRequestRepository;
    private final AllocationRepository allocationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final RequirementAssignmentRepository assignmentRepository;
    private final RequirementAccessGuard accessGuard;

    /** Active team members on a project, counting its manager (who is on the team too) and leaving out anyone who has left. */
    private int teamSize(Project p) {
        List<com.rightFit.entity.ProjectMember> members = projectMemberRepository
                .findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(p.getId()).stream()
                .filter(m -> "ACTIVE".equals(m.getEmployee().getEmploymentStatus())).toList();
        Employee mgr = p.getManager();
        boolean managerListed = mgr != null && members.stream().anyMatch(m -> m.getEmployee().getId().equals(mgr.getId()));
        boolean addManager = mgr != null && "ACTIVE".equals(mgr.getEmploymentStatus()) && !managerListed;
        return members.size() + (addManager ? 1 : 0);
    }

    /** How many open requirements the dashboard lists. */
    private static final int DASHBOARD_REQUIREMENTS = 6;

    /** Dashboard stage for each candidate status; statuses not listed (rejected, declined, withdrawn, on hold) are out of the process. */
    private static final Map<String, String> STAGE_OF = Map.ofEntries(
            Map.entry(CandidateStatus.IDENTIFIED, "identified"),
            Map.entry(CandidateStatus.SHORTLISTED, "shortlisted"),
            Map.entry(CandidateStatus.INVITATION_SENT, "invited"),
            Map.entry(CandidateStatus.ACCEPTED, "invited"),
            Map.entry(CandidateStatus.INTERVIEW, "interviewing"),
            Map.entry(CandidateStatus.INTERVIEW_COMPLETED, "interviewing"),
            Map.entry(CandidateStatus.RECOMMENDED, "interviewing"),
            Map.entry(CandidateStatus.MANAGER_REVIEW, "interviewing"),
            Map.entry(CandidateStatus.SELECTED, "selected"),
            Map.entry(CandidateStatus.ALLOCATION_REQUESTED, "selected"),
            Map.entry(CandidateStatus.ALLOCATED, "selected"));

    public ManagerDashboardDTO dashboard() {
        Employee me = accessGuard.currentEmployee();
        List<Project> projects = projectRepository.findByManagerId(me.getId());

        List<ProjectStaffingDTO> staffing = new ArrayList<>();
        BigDecimal totalHours = BigDecimal.ZERO;
        for (Project p : projects) {
            List<Allocation> active = allocationRepository.findByProjectIdAndStatus(p.getId(), "ACTIVE");
            BigDecimal hours = active.stream().map(Allocation::getHoursPerDay).reduce(BigDecimal.ZERO, BigDecimal::add);
            totalHours = totalHours.add(hours);
            long open = requirementRepository.findByProjectId(p.getId()).stream()
                    .filter(r -> List.of("DRAFT", "PUBLISHED", "ON_HOLD").contains(r.getStatus())).count();
            staffing.add(ProjectStaffingDTO.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .status(p.getStatus())
                    .claimed(p.getManagerClaimed())
                    .activeMembers(teamSize(p))
                    .allocatedHoursPerDay(hours)
                    .openRequirements(open)
                    .candidates(candidateRepository.findByProjectId(p.getId()).stream()
                            .filter(c -> STAGE_OF.containsKey(c.getStatus()) && !Boolean.TRUE.equals(c.getArchived())).count())
                    .build());
        }

        Map<String, Long> pipeline = toMap(candidateRepository.countByStatusForManager(me.getId()));
        long claimed = projects.stream().filter(p -> Boolean.TRUE.equals(p.getManagerClaimed())).count();
        return ManagerDashboardDTO.builder()
                .totalProjects(projects.size())
                .claimedProjects((int) claimed)
                .pendingClaimProjects(projects.size() - (int) claimed)
                .requirementsByStatus(toMap(requirementRepository.countByStatusForManager(me.getId())))
                .candidatePipeline(pipeline)
                .pendingInvitations(invitationRepository.countPendingForManager(me.getId()))
                .upcomingInterviews(interviewRepository.countUpcomingForManager(me.getId(), LocalDateTime.now()))
                .pendingDecisions(pipeline.getOrDefault(CandidateStatus.MANAGER_REVIEW, 0L))
                .allocationRequestsByStatus(toMap(allocationRequestRepository.countByStatusForManager(me.getId())))
                .teamMembers(projectMemberRepository.countByProjectManagerIdAndIsActiveTrue(me.getId()))
                .totalAllocatedHoursPerDay(totalHours)
                .unreadNotifications(notificationRepository.countByRecipientIdAndIsReadFalse(me.getId()))
                .projectStaffing(staffing)
                .openRequirements(openRequirementCards(me))
                .decisionQueue(decisionQueue(me))
                .selectionProcess(selectionProcess(me))
                .build();
    }

    /** Every live candidate on the manager's requirements, grouped by requirement, in the order they were last moved. */
    private List<SelectionGroupDTO> selectionProcess(Employee me) {
        Map<Long, SelectionGroupDTO> groups = new LinkedHashMap<>();
        for (CandidateApplication c : candidateRepository.findOpenForManager(me.getId())) {
            ProjectRequirement r = c.getRequirement();
            SelectionGroupDTO group = groups.computeIfAbsent(r.getId(), id -> SelectionGroupDTO.builder()
                    .requirementId(r.getRequirementId())
                    .positionTitle(r.getPositionTitle())
                    .projectName(r.getProject().getProjectName())
                    .requirementStatus(r.getStatus())
                    .people(new ArrayList<>())
                    .build());
            group.getPeople().add(SelectionPersonDTO.builder()
                    .applicationId(c.getApplicationId())
                    .employeeId(c.getEmployee().getEmployeeId())
                    .employeeName(CandidateWorkflowService.name(c.getEmployee()))
                    .status(c.getStatus())
                    .updatedAt(c.getUpdatedAt())
                    .build());
        }
        return new ArrayList<>(groups.values());
    }

    /** Candidates whose interviews are done and who now wait for the manager's decision, longest waiting first. */
    private List<DecisionCardDTO> decisionQueue(Employee me) {
        return candidateRepository.findForManagerByStatus(me.getId(), CandidateStatus.MANAGER_REVIEW).stream()
                .limit(DASHBOARD_REQUIREMENTS)
                .map(c -> DecisionCardDTO.builder()
                        .applicationId(c.getApplicationId())
                        .employeeId(c.getEmployee().getEmployeeId())
                        .employeeName(CandidateWorkflowService.name(c.getEmployee()))
                        .requirementId(c.getRequirement().getRequirementId())
                        .positionTitle(c.getRequirement().getPositionTitle())
                        .projectName(c.getRequirement().getProject().getProjectName())
                        .waitingSince(c.getUpdatedAt())
                        .build())
                .toList();
    }

    /** The manager's open requirements, newest first, each with its pipeline stages and who holds each responsibility. */
    private List<RequirementCardDTO> openRequirementCards(Employee me) {
        List<String> open = List.of("PUBLISHED", "ON_HOLD", "DRAFT");
        List<ProjectRequirement> requirements = requirementRepository.findByProjectManagerId(me.getId()).stream()
                .filter(r -> open.contains(r.getStatus()))
                .sorted((a, b) -> {
                    int byStatus = Integer.compare(open.indexOf(a.getStatus()), open.indexOf(b.getStatus()));
                    if (byStatus != 0) return byStatus;
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(DASHBOARD_REQUIREMENTS)
                .toList();

        return requirements.stream().map(this::toCard).toList();
    }

    /** One requirement with where its candidates are and who holds each responsibility. */
    private RequirementCardDTO toCard(ProjectRequirement r) {
        Map<String, Long> stages = new LinkedHashMap<>();
        for (String stage : List.of("identified", "shortlisted", "invited", "interviewing", "selected")) {
            stages.put(stage, 0L);
        }
        int inProcess = 0;
        for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(r.getId())) {
            String stage = STAGE_OF.get(c.getStatus());
            if (stage != null && !Boolean.TRUE.equals(c.getArchived())) {
                stages.merge(stage, 1L, Long::sum);
                inProcess++;
            }
        }
        List<String> sourcers = new ArrayList<>(), interviewers = new ArrayList<>(), coordinators = new ArrayList<>();
        for (var a : assignmentRepository.findByRequirementIdAndIsActiveTrue(r.getId())) {
            String name = CandidateWorkflowService.name(a.getEmployee());
            switch (a.getResponsibilityType()) {
                case "SOURCER" -> sourcers.add(name);
                case "INTERVIEWER" -> interviewers.add(name);
                case "COORDINATOR" -> coordinators.add(name);
                default -> { }
            }
        }
        return RequirementCardDTO.builder()
                .requirementId(r.getRequirementId())
                .projectId(r.getProject().getProjectId())
                .projectName(r.getProject().getProjectName())
                .positionTitle(r.getPositionTitle())
                .status(r.getStatus())
                .priority(r.getPriority())
                .createdAt(r.getCreatedAt())
                .candidates(inProcess)
                .stages(stages)
                .sourcers(sourcers)
                .interviewers(interviewers)
                .coordinators(coordinators)
                .build();
    }

    /** Every requirement across the manager's claimed projects (any status), newest first, as cards. */
    public List<RequirementCardDTO> allRequirementCards() {
        Employee me = accessGuard.currentEmployee();
        return requirementRepository.findByProjectManagerId(me.getId()).stream()
                .filter(r -> Boolean.TRUE.equals(r.getProject().getManagerClaimed()))
                .sorted((a, b) -> a.getCreatedAt() == null || b.getCreatedAt() == null ? 0 : b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toCard)
                .toList();
    }

    /** One requirement as a card. The caller must be allowed to read it. */
    public RequirementCardDTO requirementCard(String requirementId) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        accessGuard.assertCanReadRequirement(requirement);
        return toCard(requirement);
    }

    /** Every requirement of one project (any status), newest first, as cards. The caller must own the project (or be Admin). */
    public List<RequirementCardDTO> projectRequirementCards(String projectId) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        accessGuard.assertOwnsProjectOrAdmin(project);
        return requirementRepository.findByProjectId(project.getId()).stream()
                .sorted((a, b) -> a.getCreatedAt() == null || b.getCreatedAt() == null ? 0 : b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toCard)
                .toList();
    }

    public ReportDTO report(String type) {
        List<Map<String, Object>> rows = switch (type) {
            case "requirements" -> requirementRows();
            case "pipeline" -> pipelineRows();
            case "interviews" -> interviewRows();
            case "allocations" -> allocationRows();
            default -> throw new BusinessRuleException("Unknown report '" + type
                    + "'. Available: requirements, pipeline, interviews, allocations");
        };
        return ReportDTO.builder().report(type).generatedAt(LocalDateTime.now()).rowCount(rows.size()).rows(rows).build();
    }

    /** Audit trail of a requirement (created / updated / lifecycle / responsibilities). */
    public Page<AuditLogDTO> requirementHistory(String requirementId, int page, int size) {
        ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
        accessGuard.assertOwnsProjectOrAdmin(requirement.getProject());
        return auditLogRepository.findByEntityTypeAndEntityId("REQUIREMENT", requirement.getId(), PageRequest.of(page, size))
                .map(this::toAuditDTO);
    }

    private List<ProjectRequirement> scopedRequirements() {
        return accessGuard.isAdmin() ? requirementRepository.findAll()
                : requirementRepository.findByProjectManagerId(accessGuard.currentEmployee().getId());
    }

    private List<Map<String, Object>> requirementRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProjectRequirement r : scopedRequirements()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("requirementId", r.getRequirementId());
            row.put("projectId", r.getProject().getProjectId());
            row.put("positionTitle", r.getPositionTitle());
            row.put("priority", r.getPriority());
            row.put("status", r.getStatus());
            row.put("candidates", candidateRepository.findByRequirementIdOrderByCreatedAtDesc(r.getId()).size());
            row.put("createdAt", r.getCreatedAt());
            row.put("allocationStartDate", r.getAllocationStartDate());
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> pipelineRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProjectRequirement r : scopedRequirements()) {
            for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(r.getId())) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("applicationId", c.getApplicationId());
                row.put("requirementId", r.getRequirementId());
                row.put("employeeId", c.getEmployee().getEmployeeId());
                row.put("employee", CandidateWorkflowService.name(c.getEmployee()));
                row.put("status", c.getStatus());
                row.put("source", c.getSource());
                row.put("identifiedAt", c.getIdentifiedAt());
                row.put("decision", c.getDecision());
                row.put("rejectionReasonCode", c.getRejectionReasonCode());
                row.put("archived", c.getArchived());
                rows.add(row);
            }
        }
        return rows;
    }

    private List<Map<String, Object>> interviewRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProjectRequirement r : scopedRequirements()) {
            for (CandidateApplication c : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(r.getId())) {
                for (Interview i : interviewRepository.findByCandidateApplicationIdOrderByScheduledAtAscIdAsc(c.getId())) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("interviewId", i.getInterviewId());
                    row.put("requirementId", r.getRequirementId());
                    row.put("employeeId", i.getEmployee().getEmployeeId());
                    row.put("employee", CandidateWorkflowService.name(i.getEmployee()));
                    row.put("interviewer", CandidateWorkflowService.name(i.getInterviewer()));
                    row.put("round", i.getRoundNumber());
                    row.put("scheduledAt", i.getScheduledAt());
                    row.put("status", i.getStatus());
                    feedbackRepository.findByInterviewId(i.getId()).ifPresent(f -> {
                        row.put("rating", f.getRating());
                        row.put("recommendation", f.getRecommendation());
                    });
                    rows.add(row);
                }
            }
        }
        return rows;
    }

    private List<Map<String, Object>> allocationRows() {
        List<Project> projects = accessGuard.isAdmin() ? projectRepository.findAll()
                : projectRepository.findByManagerId(accessGuard.currentEmployee().getId());
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Project p : projects) {
            for (Allocation a : allocationRepository.findByProjectIdOrderByStartDateDescIdDesc(p.getId())) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("allocationId", a.getAllocationId());
                row.put("projectId", p.getProjectId());
                row.put("employeeId", a.getEmployee().getEmployeeId());
                row.put("employee", CandidateWorkflowService.name(a.getEmployee()));
                row.put("hoursPerDay", a.getHoursPerDay());
                row.put("startDate", a.getStartDate());
                row.put("endDate", a.getEndDate());
                row.put("status", a.getStatus());
                row.put("endReason", a.getEndReason());
                rows.add(row);
            }
        }
        return rows;
    }

    private Map<String, Long> toMap(List<Object[]> grouped) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : grouped) {
            map.put((String) row[0], (Long) row[1]);
        }
        return map;
    }

    private AuditLogDTO toAuditDTO(AuditLog a) {
        return AuditLogDTO.builder()
                .id(a.getId())
                .auditId(a.getAuditId())
                .performedByEmail(a.getPerformedByEmail())
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .changeSummary(a.getChangeSummary())
                .status(a.getStatus())
                .timestamp(a.getTimestamp())
                .build();
    }
}
