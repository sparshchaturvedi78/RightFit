package com.rightFit.service;

import com.rightFit.dto.CreateRequirementRequest;
import com.rightFit.dto.RequirementDTO;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.InvalidStateTransitionException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RequirementManagementService {

    static final String DRAFT = "DRAFT";
    static final String PUBLISHED = "PUBLISHED";
    static final String ON_HOLD = "ON_HOLD";
    static final String ALLOCATED = "ALLOCATED";
    static final String CLOSED = "CLOSED";
    static final String CANCELLED = "CANCELLED";

    private final ProjectRequirementRepository requirementRepository;
    private final ProjectRepository projectRepository;
    private final RequirementAccessGuard accessGuard;
    private final ClosureService closureService;
    private final AuditLogService auditLogService;

    public RequirementDTO createRequirement(CreateRequirementRequest request) {
        Project project = projectRepository.findByProjectId(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", request.getProjectId()));

        accessGuard.assertOwnsProjectOrAdmin(project);

        if ("CLOSED".equals(project.getStatus())) {
            throw new BusinessRuleException("Cannot create a requirement under closed project " + project.getProjectId());
        }
        validateRanges(request.getMinExperience(), request.getMaxExperience(),
                request.getAllocationStartDate(), request.getAllocationEndDate());

        Employee creator = accessGuard.currentEmployee();
        String actorName = fullName(creator);

        ProjectRequirement requirement = ProjectRequirement.builder()
                .requirementId("REQ-" + requirementRepository.nextRequirementSequence())
                .project(project)
                .positionTitle(request.getPositionTitle())
                .description(request.getDescription())
                .requiredSkills(request.getRequiredSkills())
                .minExperience(request.getMinExperience())
                .maxExperience(request.getMaxExperience())
                .requiredCertifications(request.getRequiredCertifications())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status(DRAFT)
                .allocationStartDate(request.getAllocationStartDate())
                .allocationEndDate(request.getAllocationEndDate())
                .createdByEmployee(creator)
                .createdByName(actorName)
                .updatedByName(actorName)
                .build();

        ProjectRequirement saved = requirementRepository.save(requirement);
        auditLogService.logAction(currentUserId(), "REQUIREMENT_CREATED", "REQUIREMENT", saved.getId(),
                null, snapshot(saved), "Requirement " + saved.getRequirementId() + " created under " + project.getProjectId());
        log.info("Requirement {} created under project {}", saved.getRequirementId(), project.getProjectId());

        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public RequirementDTO getRequirement(String requirementId) {
        ProjectRequirement requirement = load(requirementId);
        accessGuard.assertCanReadRequirement(requirement);
        return mapToDTO(requirement);
    }

    @Transactional(readOnly = true)
    public Page<RequirementDTO> searchRequirements(String projectId, String status, String priority,
                                                   String positionTitle, Pageable pageable) {
        if (projectId != null && !projectId.isBlank()) {
            // Filtering by a project you have no business with is an error, not an empty page.
            Project project = projectRepository.findByProjectId(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
            accessGuard.assertCanBrowseProject(project);
        }
        Long managerScope = accessGuard.isAdmin() ? null : accessGuard.currentEmployee().getId();
        return requirementRepository
                .searchRequirements(projectId, status, priority, positionTitle, managerScope, pageable)
                .map(this::mapToDTO);
    }

    /** Same body as create: the form is opened pre-filled, edited and saved back as a whole. */
    public RequirementDTO updateRequirement(String requirementId, CreateRequirementRequest request) {
        ProjectRequirement requirement = load(requirementId);
        accessGuard.assertOwnsProjectOrAdmin(requirement.getProject());

        if (isTerminal(requirement.getStatus())) {
            throw new BusinessRuleException("Cannot update a " + requirement.getStatus() + " requirement");
        }
        if (!requirement.getProject().getProjectId().equals(request.getProjectId())) {
            throw new BusinessRuleException("A requirement cannot be moved to another project ("
                    + requirement.getProject().getProjectId() + " -> " + request.getProjectId() + ")");
        }
        validateRanges(request.getMinExperience(), request.getMaxExperience(),
                request.getAllocationStartDate(), request.getAllocationEndDate());

        Map<String, Object> before = snapshot(requirement);

        requirement.setPositionTitle(request.getPositionTitle());
        requirement.setDescription(request.getDescription());
        requirement.setRequiredSkills(request.getRequiredSkills());
        requirement.setMinExperience(request.getMinExperience());
        requirement.setMaxExperience(request.getMaxExperience());
        requirement.setRequiredCertifications(request.getRequiredCertifications());
        if (request.getPriority() != null) {
            requirement.setPriority(request.getPriority());
        }
        requirement.setAllocationStartDate(request.getAllocationStartDate());
        requirement.setAllocationEndDate(request.getAllocationEndDate());

        requirement.setUpdatedByName(fullName(accessGuard.currentEmployee()));
        ProjectRequirement saved = requirementRepository.save(requirement);

        auditLogService.logAction(currentUserId(), "REQUIREMENT_UPDATED", "REQUIREMENT", saved.getId(),
                before, snapshot(saved), "Requirement " + saved.getRequirementId() + " updated");

        return mapToDTO(saved);
    }

    public RequirementDTO publishRequirement(String requirementId, RequirementStatusChangeRequest request) {
        return transition(requirementId, request, Set.of(DRAFT), PUBLISHED, "REQUIREMENT_PUBLISHED");
    }

    public RequirementDTO holdRequirement(String requirementId, RequirementStatusChangeRequest request) {
        return transition(requirementId, request, Set.of(PUBLISHED), ON_HOLD, "REQUIREMENT_HELD");
    }

    public RequirementDTO resumeRequirement(String requirementId, RequirementStatusChangeRequest request) {
        return transition(requirementId, request, Set.of(ON_HOLD), PUBLISHED, "REQUIREMENT_RESUMED");
    }

    public RequirementDTO closeRequirement(String requirementId, RequirementStatusChangeRequest request) {
        return transition(requirementId, request, Set.of(PUBLISHED, ON_HOLD, ALLOCATED), CLOSED, "REQUIREMENT_CLOSED");
    }

    public RequirementDTO cancelRequirement(String requirementId, RequirementStatusChangeRequest request) {
        return transition(requirementId, request, Set.of(DRAFT, PUBLISHED, ON_HOLD), CANCELLED, "REQUIREMENT_CANCELLED");
    }

    private RequirementDTO transition(String requirementId, RequirementStatusChangeRequest request,
                                      Set<String> allowedFrom, String target, String auditAction) {
        ProjectRequirement requirement = load(requirementId);
        accessGuard.assertOwnsProjectOrAdmin(requirement.getProject());

        String current = requirement.getStatus();
        if (!allowedFrom.contains(current)) {
            throw new InvalidStateTransitionException("requirement", current, target);
        }

        requirement.setStatus(target);
        requirement.setUpdatedByName(fullName(accessGuard.currentEmployee()));
        ProjectRequirement saved = requirementRepository.save(requirement);

        auditLogService.logAction(currentUserId(), auditAction, "REQUIREMENT", saved.getId(),
                current, target, request.getReason());
        log.info("Requirement {} {} -> {}", saved.getRequirementId(), current, target);

        if (CLOSED.equals(target) || CANCELLED.equals(target)) {
            closureService.archivePipeline(saved, accessGuard.currentEmployeeOrNull(), request.getReason());
        }

        return mapToDTO(saved);
    }

    private ProjectRequirement load(String requirementId) {
        return requirementRepository.findByRequirementId(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
    }

    private boolean isTerminal(String status) {
        return CLOSED.equals(status) || CANCELLED.equals(status) || ALLOCATED.equals(status);
    }

    private void validateRanges(Integer minExp, Integer maxExp, LocalDate start, LocalDate end) {
        if (minExp != null && maxExp != null && minExp > maxExp) {
            throw new BusinessRuleException("Minimum experience must not exceed maximum experience");
        }
        if (start != null && end != null && end.isBefore(start)) {
            throw new BusinessRuleException("Allocation end date must not be before the start date");
        }
    }

    private Map<String, Object> snapshot(ProjectRequirement r) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("requirementId", r.getRequirementId());
        state.put("positionTitle", r.getPositionTitle());
        state.put("description", r.getDescription());
        state.put("requiredSkills", r.getRequiredSkills());
        state.put("minExperience", r.getMinExperience());
        state.put("maxExperience", r.getMaxExperience());
        state.put("requiredCertifications", r.getRequiredCertifications());
        state.put("priority", r.getPriority());
        state.put("status", r.getStatus());
        state.put("allocationStartDate", r.getAllocationStartDate());
        state.put("allocationEndDate", r.getAllocationEndDate());
        return state;
    }

    private Long currentUserId() {
        return SecurityContextUtil.getCurrentUserId();
    }

    private String fullName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }

    private RequirementDTO mapToDTO(ProjectRequirement r) {
        Project project = r.getProject();
        Employee creator = r.getCreatedByEmployee();
        return RequirementDTO.builder()
                .id(r.getId())
                .requirementId(r.getRequirementId())
                .projectId(project != null ? project.getProjectId() : null)
                .projectName(project != null ? project.getProjectName() : null)
                .positionTitle(r.getPositionTitle())
                .description(r.getDescription())
                .requiredSkills(r.getRequiredSkills())
                .minExperience(r.getMinExperience())
                .maxExperience(r.getMaxExperience())
                .requiredCertifications(r.getRequiredCertifications())
                .priority(r.getPriority())
                .status(r.getStatus())
                .allocationStartDate(r.getAllocationStartDate())
                .allocationEndDate(r.getAllocationEndDate())
                .createdByEmployeeId(creator != null ? creator.getEmployeeId() : null)
                .createdByName(r.getCreatedByName())
                .updatedByName(r.getUpdatedByName())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
