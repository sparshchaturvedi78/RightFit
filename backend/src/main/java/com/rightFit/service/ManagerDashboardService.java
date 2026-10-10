package com.rightFit.service;

import com.rightFit.dto.AuditLogDTO;
import com.rightFit.dto.DashboardDtos.ManagerDashboardDTO;
import com.rightFit.dto.DashboardDtos.ProjectStaffingDTO;
import com.rightFit.dto.DashboardDtos.ReportDTO;
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
    private final RequirementAccessGuard accessGuard;

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
                    .activeMembers(projectMemberRepository
                            .findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(p.getId()).size())
                    .allocatedHoursPerDay(hours)
                    .openRequirements(open)
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
                .build();
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
