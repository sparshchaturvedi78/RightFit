package com.rightFit.service;

import com.rightFit.dto.CandidateDtos.CandidateDTO;
import com.rightFit.dto.CandidateDtos.CandidateHistoryDTO;
import com.rightFit.dto.CandidateDtos.ContactRequest;
import com.rightFit.dto.CandidateDtos.ContactResultDTO;
import com.rightFit.dto.CandidateDtos.IdentifyCandidateRequest;
import com.rightFit.dto.CandidateDtos.PipelineDTO;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Manager Phases 4 and 6: identify / shortlist / withdraw, pipeline views, RMG recommendation, contact. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CandidateService {

    private final CandidateApplicationRepository candidateRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final EmployeeRepository employeeRepository;
    private final RequirementAccessGuard accessGuard;
    private final CandidateWorkflowService workflow;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public CandidateDTO identify(String requirementId, IdentifyCandidateRequest request) {
        ProjectRequirement requirement = loadRequirement(requirementId);
        accessGuard.assertCanSource(requirement);
        accessGuard.assertRequirementOpen(requirement);

        Employee actor = accessGuard.currentEmployee();
        String source = accessGuard.isAdmin() ? "ADMIN"
                : accessGuard.isManagerOf(requirement.getProject(), actor) ? "MANAGER" : "SOURCER";
        CandidateApplication saved = createCandidate(requirement, request, actor, source);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CANDIDATE_IDENTIFIED", "CANDIDATE",
                saved.getId(), null, CandidateStatus.IDENTIFIED,
                saved.getEmployee().getEmployeeId() + " identified for " + requirementId);
        notifyManagerIfOther(requirement, actor, "CANDIDATE_IDENTIFIED",
                CandidateWorkflowService.name(actor) + " identified " + CandidateWorkflowService.name(saved.getEmployee())
                        + " for " + requirementId,
                requirement.getPositionTitle(), saved);
        return workflow.toDTO(saved);
    }

    /** RMG can recommend but never shortlist (BR-012): the candidate enters the pipeline as IDENTIFIED only. */
    public CandidateDTO recommend(String requirementId, IdentifyCandidateRequest request) {
        ProjectRequirement requirement = loadRequirement(requirementId);
        accessGuard.assertRequirementOpen(requirement);

        Employee actor = accessGuard.currentEmployee();
        CandidateApplication saved = createCandidate(requirement, request, actor, "RMG_RECOMMENDATION");

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CANDIDATE_RECOMMENDED", "CANDIDATE",
                saved.getId(), null, CandidateStatus.IDENTIFIED,
                "RMG " + actor.getEmployeeId() + " recommended " + saved.getEmployee().getEmployeeId()
                        + " for " + requirementId);
        notificationService.notify(requirement.getProject().getManager(), "RMG_RECOMMENDATION",
                "RMG recommended a candidate for " + requirementId,
                CandidateWorkflowService.name(actor) + " recommended " + CandidateWorkflowService.name(saved.getEmployee())
                        + " for " + requirement.getPositionTitle(),
                "CANDIDATE", saved.getApplicationId());
        return workflow.toDTO(saved);
    }

    public CandidateDTO shortlist(String applicationId) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertCanSource(candidate.getRequirement());
        accessGuard.assertRequirementOpen(candidate.getRequirement());

        if (!CandidateStatus.IDENTIFIED.equals(candidate.getStatus()) && candidate.getShortlistedAt() != null
                && !CandidateStatus.TERMINAL.contains(candidate.getStatus())) {
            throw new DuplicateEntityException("Candidate " + candidate.getApplicationId() + " ("
                    + CandidateWorkflowService.name(candidate.getEmployee()) + ") is already shortlisted for "
                    + candidate.getRequirement().getRequirementId() + " - " + describe(candidate));
        }

        Employee actor = accessGuard.currentEmployee();
        workflow.transition(candidate, CandidateStatus.SHORTLISTED, actor, "Shortlisted");
        candidate.setShortlistedBy(actor);
        candidate.setShortlistedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
        notifyManagerIfOther(candidate.getRequirement(), actor, "CANDIDATE_SHORTLISTED",
                CandidateWorkflowService.name(actor) + " shortlisted " + CandidateWorkflowService.name(candidate.getEmployee())
                        + " for " + candidate.getRequirement().getRequirementId(),
                candidate.getRequirement().getPositionTitle(), candidate);
        return workflow.toDTO(candidate);
    }

    public CandidateDTO withdraw(String applicationId, String reason) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertCanSource(candidate.getRequirement());

        workflow.transition(candidate, CandidateStatus.WITHDRAWN, accessGuard.currentEmployee(), reason);
        workflow.cancelOpenItems(candidate, "Candidate withdrawn: " + reason);
        return workflow.toDTO(candidate);
    }

    @Transactional(readOnly = true)
    public List<CandidateDTO> list(String requirementId, String status, boolean includeArchived) {
        ProjectRequirement requirement = loadRequirement(requirementId);
        accessGuard.assertCanReadRequirement(requirement);
        return candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId()).stream()
                .filter(c -> includeArchived || !Boolean.TRUE.equals(c.getArchived()))
                .filter(c -> status == null || status.isBlank() || status.equalsIgnoreCase(c.getStatus()))
                .map(workflow::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CandidateDTO get(String applicationId) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertCanReadRequirement(candidate.getRequirement());
        return workflow.toDTO(candidate);
    }

    @Transactional(readOnly = true)
    public List<CandidateHistoryDTO> history(String applicationId) {
        CandidateApplication candidate = workflow.find(applicationId);
        accessGuard.assertCanReadRequirement(candidate.getRequirement());
        return workflow.history(candidate);
    }

    @Transactional(readOnly = true)
    public PipelineDTO pipeline(String requirementId) {
        ProjectRequirement requirement = loadRequirement(requirementId);
        accessGuard.assertCanReadRequirement(requirement);

        List<CandidateApplication> all = candidateRepository.findByRequirementIdOrderByCreatedAtDesc(requirement.getId())
                .stream().filter(c -> !Boolean.TRUE.equals(c.getArchived())).toList();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (CandidateApplication c : all) {
            counts.merge(c.getStatus(), 1L, Long::sum);
        }
        return PipelineDTO.builder()
                .requirementId(requirement.getRequirementId())
                .requirementStatus(requirement.getStatus())
                .stageCounts(counts)
                .candidates(all.stream().map(workflow::toDTO).toList())
                .build();
    }

    /**
     * Manager / RMG / Admin can contact an employee (BR-014); delivered as an in-app notification.
     * Returns what was actually sent so a caller (e.g. a chat UI) can render it immediately instead of
     * re-fetching it from the notification list.
     */
    public ContactResultDTO contact(String employeeId, ContactRequest request) {
        Employee target = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        if (!"ACTIVE".equals(target.getEmploymentStatus())) {
            throw new BusinessRuleException("Employee " + employeeId + " is not active");
        }
        Employee sender = accessGuard.currentEmployee();

        String requirementRef = null;
        if (request.getRequirementId() != null && !request.getRequirementId().isBlank()) {
            ProjectRequirement requirement = loadRequirement(request.getRequirementId());
            accessGuard.assertCanReadRequirement(requirement);
            requirementRef = requirement.getRequirementId();
        }

        LocalDateTime sentAt = LocalDateTime.now();
        notificationService.notify(target, "EMPLOYEE_CONTACT", request.getSubject(),
                CandidateWorkflowService.name(sender) + ": " + request.getMessage(),
                requirementRef != null ? "REQUIREMENT" : "EMPLOYEE",
                requirementRef != null ? requirementRef : sender.getEmployeeId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CANDIDATE_CONTACTED", "EMPLOYEE",
                target.getId(), null, null,
                sender.getEmployeeId() + " contacted " + employeeId + ": " + request.getSubject());

        return ContactResultDTO.builder()
                .status("SENT")
                .fromEmployeeId(sender.getEmployeeId())
                .fromName(CandidateWorkflowService.name(sender))
                .toEmployeeId(target.getEmployeeId())
                .toName(CandidateWorkflowService.name(target))
                .subject(request.getSubject())
                .message(request.getMessage())
                .requirementId(requirementRef)
                .sentAt(sentAt)
                .build();
    }

    private CandidateApplication createCandidate(ProjectRequirement requirement, IdentifyCandidateRequest request,
                                                 Employee actor, String source) {
        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));
        if (!"ACTIVE".equals(employee.getEmploymentStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not active");
        }
        if (accessGuard.isAdminAccount(employee)) {
            throw new BusinessRuleException("Admin accounts are not part of the candidate pool");
        }
        candidateRepository.findByRequirementIdAndEmployeeId(requirement.getId(), employee.getId()).ifPresent(existing -> {
            throw new DuplicateEntityException("Employee " + employee.getEmployeeId() + " ("
                    + CandidateWorkflowService.name(employee) + ") is already in the pipeline of "
                    + requirement.getRequirementId() + " as " + existing.getApplicationId() + " - " + describe(existing));
        });

        CandidateApplication saved = candidateRepository.save(CandidateApplication.builder()
                .applicationId("CAND-" + candidateRepository.nextCandidateSequence())
                .requirement(requirement)
                .employee(employee)
                .status(CandidateStatus.IDENTIFIED)
                .source(source)
                .notes(request.getNotes())
                .identifiedBy(actor)
                .build());
        workflow.recordCreation(saved, actor, "Identified (" + source + ")");
        return saved;
    }

    /** Who did what and when, e.g. "status SHORTLISTED; identified by X (SOURCER) on 2026-09-25; shortlisted by Y on 2026-09-25". */
    private String describe(CandidateApplication c) {
        StringBuilder text = new StringBuilder("status " + c.getStatus());
        if (c.getIdentifiedBy() != null) {
            text.append("; identified by ").append(CandidateWorkflowService.name(c.getIdentifiedBy()))
                    .append(" (").append(c.getSource()).append(") on ").append(c.getIdentifiedAt().toLocalDate());
        }
        if (c.getShortlistedBy() != null) {
            text.append("; shortlisted by ").append(CandidateWorkflowService.name(c.getShortlistedBy()))
                    .append(" on ").append(c.getShortlistedAt().toLocalDate());
        }
        return text.toString();
    }

    /** The Manager sees what SOURCERs and Admin do on their requirement without polling the pipeline. */
    private void notifyManagerIfOther(ProjectRequirement requirement, Employee actor, String type, String title,
                                      String message, CandidateApplication candidate) {
        Employee manager = requirement.getProject().getManager();
        if (manager != null && !manager.getId().equals(actor.getId())) {
            notificationService.notify(manager, type, title, message, "CANDIDATE", candidate.getApplicationId());
        }
    }

    private ProjectRequirement loadRequirement(String requirementId) {
        return requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
    }
}
