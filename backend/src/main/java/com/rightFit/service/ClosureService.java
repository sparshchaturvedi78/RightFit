package com.rightFit.service;

import com.rightFit.entity.Allocation;
import com.rightFit.entity.AllocationRequest;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectMember;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Manager Phase 11: what happens to Manager-owned data when a requirement or a project closes (BRD 30).
 * Requirements close, pipelines are archived (never deleted), members release, allocations end and
 * eligible employees return to the Resource Pool. Historical records always remain.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClosureService {

    private static final List<String> CLOSED_REQUIREMENT = List.of("CLOSED", "CANCELLED");

    private final ProjectRequirementRepository requirementRepository;
    private final CandidateApplicationRepository candidateRepository;
    private final AllocationRequestRepository allocationRequestRepository;
    private final AllocationRepository allocationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final CandidateWorkflowService workflow;
    private final AllocationService allocationService;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    /** Requirement closed/cancelled: withdraw open candidacies and archive the pipeline. Allocated history stays as-is. */
    public int archivePipeline(ProjectRequirement requirement, Employee actor, String reason) {
        int archived = 0;
        for (CandidateApplication candidate : candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())) {
            if (Boolean.TRUE.equals(candidate.getArchived())) {
                continue;
            }
            if (!CandidateStatus.TERMINAL.contains(candidate.getStatus())) {
                if (CandidateStatus.ALLOCATION_REQUESTED.equals(candidate.getStatus())) {
                    for (AllocationRequest r : allocationRequestRepository
                            .findByCandidateApplicationIdOrderBySubmittedAtDesc(candidate.getId())) {
                        if ("SUBMITTED".equals(r.getStatus())) {
                            r.setStatus("CANCELLED");
                            r.setReviewComments("Requirement closed: " + reason);
                            allocationRequestRepository.save(r);
                        }
                    }
                }
                workflow.cancelOpenItems(candidate, "Requirement closed: " + reason);
                workflow.forceTransition(candidate, CandidateStatus.WITHDRAWN, actor, "Requirement closed: " + reason);
                allocationService.refreshEmployee(candidate.getEmployee(), "RELEASE");
            }
            candidate.setArchived(true);
            candidate.setArchivedAt(LocalDateTime.now());
            candidateRepository.save(candidate);
            archived++;
        }
        return archived;
    }

    /** Admin closes a project: BR-041..044. Returns a short summary that is also written to the audit log. */
    public String closeProject(Project project, String reason) {
        Employee actor = currentActor();
        int requirementsClosed = 0;
        int pipelines = 0;
        for (ProjectRequirement requirement : requirementRepository.findByProjectId(project.getId())) {
            if (!CLOSED_REQUIREMENT.contains(requirement.getStatus())) {
                String before = requirement.getStatus();
                requirement.setStatus("DRAFT".equals(before) ? "CANCELLED" : "CLOSED");
                requirementRepository.save(requirement);
                auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "REQUIREMENT_" + requirement.getStatus(),
                        "REQUIREMENT", requirement.getId(), before, requirement.getStatus(),
                        "Project " + project.getProjectId() + " closed: " + reason);
                requirementsClosed++;
            }
            pipelines += archivePipeline(requirement, actor, "Project closed");
        }

        int allocationsEnded = 0;
        for (Allocation allocation : allocationRepository.findByProjectIdAndStatus(project.getId(), "ACTIVE")) {
            Employee employee = allocation.getEmployee();
            allocationService.end(allocation, LocalDate.now(), "PROJECT_CLOSED: " + reason, actor);
            notificationService.notify(employee, "PROJECT_CLOSED",
                    project.getProjectName() + " was closed", "Your allocation has ended. " + reason,
                    "PROJECT", project.getProjectId());
            allocationsEnded++;
        }

        int released = 0;
        for (ProjectMember member : projectMemberRepository.findByProjectId(project.getId())) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                member.setIsActive(false);
                member.setLeftAt(LocalDateTime.now());
                projectMemberRepository.save(member);
                released++;
            }
        }

        String summary = "Project closure cascade for " + project.getProjectId() + ": " + requirementsClosed
                + " requirements closed, " + pipelines + " candidate pipelines archived, " + allocationsEnded
                + " allocations ended, " + released + " members released";
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "PROJECT_CLOSURE_CASCADE", "PROJECT",
                project.getId(), null, null, summary);
        notificationService.notify(project.getManager(), "PROJECT_CLOSED", project.getProjectName() + " was closed",
                summary, "PROJECT", project.getProjectId());
        log.info(summary);
        return summary;
    }

    private Employee currentActor() {
        return accessGuard.currentEmployeeOrNull();
    }
}
