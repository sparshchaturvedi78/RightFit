package com.rightFit.service;

import com.rightFit.dto.CreateProjectRequest;
import com.rightFit.dto.UpdateProjectRequest;
import com.rightFit.dto.ChangeManagerRequest;
import com.rightFit.dto.CloseProjectRequest;
import com.rightFit.dto.MyProjectsResponse;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.entity.Project;
import com.rightFit.entity.Employee;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.audit.Auditable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProjectManagementService {
    private final EventMailer eventMailer;

    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;
    private final RequirementAccessGuard accessGuard;
    private final ClosureService closureService;
    private final com.rightFit.repository.ProjectMemberRepository projectMemberRepository;
    private final com.rightFit.repository.AllocationRepository allocationRepository;

    @Auditable(action = "CREATE", entityType = "PROJECT", entityIdParamName = "result.id")
    public ProjectDTO createProject(CreateProjectRequest request) {
        log.info("Creating project: {}", request.getProjectId());

        validateProjectUniqueness(request.getProjectId());

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager not found: " + request.getManagerId()));

        String actor = actorLabel();
        Project project = Project.builder()
                .createdBy(actor)
                .updatedBy(actor)
                .projectId(request.getProjectId())
                .projectName(request.getProjectName())
                .description(request.getDescription())
                .manager(manager)
                .clientName(request.getClientName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Project savedProject = projectRepository.save(project);
        log.info("Project created successfully: {} (ID: {})", savedProject.getProjectId(), savedProject.getId());

        return mapToDTO(savedProject);
    }

    public ProjectDTO updateProject(String projectId, UpdateProjectRequest request) {
        log.info("Updating project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (request.getProjectName() != null) {
            project.setProjectName(request.getProjectName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getManagerId() != null) {
            Long previousManagerId = project.getManager() != null ? project.getManager().getId() : null;
            if (!request.getManagerId().equals(previousManagerId)) {
                Employee newManager = employeeRepository.findById(request.getManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Employee", String.valueOf(request.getManagerId())));
                project.assignManager(newManager);
                auditLogService.logAction(getCurrentUserId(), "MANAGER_CHANGED", "PROJECT", project.getId(),
                        previousManagerId, request.getManagerId(), "Updated via project edit");
            }
        }
        if (request.getClientName() != null) {
            project.setClientName(request.getClientName());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }

        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        Project updated = projectRepository.save(project);
        log.info("Project updated successfully: {}", projectId);

        return mapToDTO(updated);
    }

    public ProjectDTO changeManager(String projectId, ChangeManagerRequest request) {
        log.info("Changing manager for project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee newManager = resolveEmployee(request.getNewManagerId(), request.getNewManagerEmployeeId());

        Long previousManagerId = project.getManager() != null ? project.getManager().getId() : null;
        project.assignManager(newManager);
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        Project updated = projectRepository.save(project);

        log.info("Manager changed for project {} to {}", projectId, newManager.getEmployeeId());
        auditLogService.logAction(getCurrentUserId(), "MANAGER_CHANGED", "PROJECT", project.getId(),
                previousManagerId, newManager.getId(), request.getReason());

        return mapToDTO(updated);
    }

    public ProjectDTO closeProject(String projectId, CloseProjectRequest request) {
        log.info("Closing project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        project.setStatus("CLOSED");
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        Project updated = projectRepository.save(project);

        log.info("Project closed successfully: {}", projectId);
        auditLogService.logAction(getCurrentUserId(), "PROJECT_CLOSED", "PROJECT", project.getId(),
                "ACTIVE", "CLOSED", request.getReason());
        closureService.closeProject(project, request.getReason());

        return mapToDTO(updated);
    }

    public ProjectDTO reopenProject(String projectId, CloseProjectRequest request) {
        log.info("Reopening project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        project.setStatus("ACTIVE");
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        Project updated = projectRepository.save(project);

        log.info("Project reopened successfully: {}", projectId);
        auditLogService.logAction(getCurrentUserId(), "PROJECT_REOPENED", "PROJECT", project.getId(),
                "CLOSED", "ACTIVE", request.getReason());

        return mapToDTO(updated);
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProject(String projectId) {
        log.debug("Fetching project: {}", projectId);
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        return mapToDTO(project);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDTO> getProjects(String q, String projectId, String projectName, String status,
                                        Long managerId, String clientName, Boolean claimed, String managerStatus,
                                        Pageable pageable) {
        log.debug("Searching projects with filters");
        String query = q == null || q.isBlank() ? null : q.trim();
        String mgrStatus = managerStatus == null || managerStatus.isBlank() ? null : managerStatus.trim().toUpperCase();
        Page<Project> projects = projectRepository.searchProjects(
                query, projectId, projectName, status, managerId, clientName, claimed, mgrStatus, pageable);
        return projects.map(this::mapToDTO);
    }

    /** The project's team: its manager, active team members and active allocations, one row per person. */
    @Transactional(readOnly = true)
    public com.rightFit.dto.ProjectTeamDTO getTeam(String projectId, String grade, int page, int size) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        java.util.Map<Long, com.rightFit.dto.ProjectTeamDTO.MemberDTO> people = new java.util.LinkedHashMap<>();
        Employee manager = project.getManager();
        if (manager != null) {
            people.put(manager.getId(), member(manager, "Manager", true, null, null));
        }
        for (var a : allocationRepository.findActiveWithEmployeeByProjectId(project.getId())) {
            Employee e = a.getEmployee();
            var existing = people.get(e.getId());
            if (existing != null) {
                existing.setHoursPerDay(a.getHoursPerDay());
                continue;
            }
            people.put(e.getId(), member(e, "Team member", false, a.getHoursPerDay(), a.getStartDate()));
        }
        for (var m : projectMemberRepository.findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(project.getId())) {
            Employee e = m.getEmployee();
            var existing = people.get(e.getId());
            if (existing != null) {
                if (!existing.isManager() && m.getRole() != null && !m.getRole().isBlank()) existing.setRole(m.getRole());
                if (existing.getSince() == null && m.getJoinedAt() != null) existing.setSince(m.getJoinedAt().toLocalDate());
                continue;
            }
            people.put(e.getId(), member(e, m.getRole(), false, null,
                    m.getJoinedAt() != null ? m.getJoinedAt().toLocalDate() : null));
        }

        java.util.List<com.rightFit.dto.ProjectTeamDTO.MemberDTO> all = new java.util.ArrayList<>(people.values());
        java.util.List<String> grades = all.stream().map(com.rightFit.dto.ProjectTeamDTO.MemberDTO::getGrade)
                .filter(g -> g != null && !g.isBlank()).distinct()
                .sorted(GRADE_HIGH_FIRST).toList();

        String wanted = grade == null || grade.isBlank() ? null : grade.trim();
        java.util.List<com.rightFit.dto.ProjectTeamDTO.MemberDTO> filtered = all.stream()
                .filter(m -> wanted == null || wanted.equalsIgnoreCase(m.getGrade()))
                // Highest grade first, then the manager, then by name.
                .sorted(java.util.Comparator
                        .comparing(com.rightFit.dto.ProjectTeamDTO.MemberDTO::getGrade, GRADE_HIGH_FIRST)
                        .thenComparing(m -> !m.isManager())
                        .thenComparing(com.rightFit.dto.ProjectTeamDTO.MemberDTO::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        int pageSize = Math.max(1, Math.min(size, 50));
        int pageNo = Math.max(0, page);
        int from = Math.min(pageNo * pageSize, filtered.size());
        int to = Math.min(from + pageSize, filtered.size());

        return com.rightFit.dto.ProjectTeamDTO.builder()
                .content(filtered.subList(from, to))
                .totalElements(filtered.size())
                .totalPages((int) Math.ceil(filtered.size() / (double) pageSize))
                .number(pageNo)
                .size(pageSize)
                .teamSize(all.size())
                .grades(grades)
                .build();
    }

    /** Grades like "L1".."L5": higher number first; anything unparseable (or missing) last. */
    private static final java.util.Comparator<String> GRADE_HIGH_FIRST = (a, b) -> {
        int x = gradeRank(a);
        int y = gradeRank(b);
        return x != y ? Integer.compare(y, x) : String.valueOf(a).compareToIgnoreCase(String.valueOf(b));
    };

    private static int gradeRank(String grade) {
        if (grade == null) return -1;
        String digits = grade.replaceAll("\\D", "");
        return digits.isEmpty() ? -1 : Integer.parseInt(digits.length() > 6 ? digits.substring(0, 6) : digits);
    }

    private com.rightFit.dto.ProjectTeamDTO.MemberDTO member(Employee e, String role, boolean manager,
                                                              java.math.BigDecimal hours, java.time.LocalDate since) {
        return com.rightFit.dto.ProjectTeamDTO.MemberDTO.builder()
                .id(e.getId())
                .employeeId(e.getEmployeeId())
                .name(e.getFirstName() + " " + e.getLastName())
                .designation(e.getDesignation())
                .grade(e.getGrade())
                .role(role)
                .manager(manager)
                .employmentStatus(e.getEmploymentStatus())
                .hoursPerDay(hours)
                .since(since)
                .build();
    }

    @Transactional(readOnly = true)
    public MyProjectsResponse getMyProjects() {
        Employee caller = accessGuard.currentEmployee();
        List<Project> managed = projectRepository.findByManagerId(caller.getId());

        List<ProjectDTO> claimed = managed.stream()
                .filter(p -> Boolean.TRUE.equals(p.getManagerClaimed()))
                .map(this::mapToDTO)
                .toList();
        List<ProjectDTO> pending = managed.stream()
                .filter(p -> !Boolean.TRUE.equals(p.getManagerClaimed()))
                .map(this::mapToDTO)
                .toList();

        return MyProjectsResponse.builder().claimed(claimed).pendingClaim(pending).build();
    }

    public ProjectDTO claimProject(String projectId) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee caller = accessGuard.currentEmployee();
        if (project.getManager() == null || !project.getManager().getId().equals(caller.getId())) {
            throw ProjectAccessDeniedException.notOwned(projectId);
        }
        if (Boolean.TRUE.equals(project.getManagerClaimed())) {
            return mapToDTO(project);
        }

        project.setManagerClaimed(true);
        project.setClaimedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(actorLabel());
        Project saved = projectRepository.save(project);
        eventMailer.projectClaimed(saved, caller);

        auditLogService.logAction(getCurrentUserId(), "PROJECT_CLAIMED", "PROJECT", saved.getId(),
                false, true, "Manager " + caller.getEmployeeId() + " claimed project " + projectId);
        log.info("Project {} claimed by {}", projectId, caller.getEmployeeId());

        return mapToDTO(saved);
    }

    /** Accepts either the legacy numeric id or the business Employee ID; at least one must resolve. */
    private Employee resolveEmployee(Long numericId, String employeeId) {
        if (employeeId != null && !employeeId.isBlank()) {
            return employeeRepository.findByEmployeeId(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        }
        if (numericId != null) {
            return employeeRepository.findById(numericId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", String.valueOf(numericId)));
        }
        throw new BusinessRuleException("Either newManagerEmployeeId or newManagerId is required");
    }

    private void validateProjectUniqueness(String projectId) {
        if (projectRepository.findByProjectId(projectId).isPresent()) {
            throw new com.rightFit.exception.DuplicateEntityException("Project", "projectId", projectId);
        }
    }

    public ProjectDTO mapToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .managerId(project.getManager() != null ? project.getManager().getId() : null)
                .managerName(project.getManager() != null ?
                        project.getManager().getFirstName() + " " + project.getManager().getLastName() : null)
                .managerEmployeeId(project.getManager() != null ? project.getManager().getEmployeeId() : null)
                .managerEmploymentStatus(project.getManager() != null ? project.getManager().getEmploymentStatus() : null)
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .clientName(project.getClientName())
                .managerClaimed(project.getManagerClaimed())
                .claimedAt(project.getClaimedAt())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .createdBy(project.getCreatedBy())
                .updatedBy(project.getUpdatedBy())
                .build();
    }

    /** "Rajesh Kumar (EMP001)" for the signed-in admin; "System" when there is no employee profile. */
    private String actorLabel() {
        Employee me = accessGuard.currentEmployeeOrNull();
        return me == null ? "System" : me.getFirstName() + " " + me.getLastName() + " (" + me.getEmployeeId() + ")";
    }

    private Long getCurrentUserId() {
        return com.rightFit.security.SecurityContextUtil.getCurrentUserId();
    }
}
