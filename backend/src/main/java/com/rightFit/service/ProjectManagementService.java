package com.rightFit.service;

import com.rightFit.dto.CreateProjectRequest;
import com.rightFit.dto.UpdateProjectRequest;
import com.rightFit.dto.ChangeManagerRequest;
import com.rightFit.dto.CloseProjectRequest;
import com.rightFit.dto.ProjectDTO;
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

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProjectManagementService {

    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    @Auditable(action = "CREATE", entityType = "PROJECT", entityIdParamName = "result.id")
    public ProjectDTO createProject(CreateProjectRequest request) {
        log.info("Creating project: {}", request.getProjectId());

        validateProjectUniqueness(request.getProjectId());

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager not found: " + request.getManagerId()));

        Project project = Project.builder()
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
                        .orElseThrow(() -> new RuntimeException("Manager not found: " + request.getManagerId()));
                project.setManager(newManager);
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
        Project updated = projectRepository.save(project);
        log.info("Project updated successfully: {}", projectId);

        return mapToDTO(updated);
    }

    public ProjectDTO changeManager(String projectId, ChangeManagerRequest request) {
        log.info("Changing manager for project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        Employee newManager = employeeRepository.findById(request.getNewManagerId())
                .orElseThrow(() -> new RuntimeException("New manager not found: " + request.getNewManagerId()));

        Long previousManagerId = project.getManager() != null ? project.getManager().getId() : null;
        project.setManager(newManager);
        project.setUpdatedAt(LocalDateTime.now());
        Project updated = projectRepository.save(project);

        log.info("Manager changed for project {} to {}", projectId, request.getNewManagerId());
        auditLogService.logAction(getCurrentUserId(), "MANAGER_CHANGED", "PROJECT", project.getId(),
                previousManagerId, request.getNewManagerId(), request.getReason());

        return mapToDTO(updated);
    }

    public ProjectDTO closeProject(String projectId, CloseProjectRequest request) {
        log.info("Closing project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        project.setStatus("CLOSED");
        project.setUpdatedAt(LocalDateTime.now());
        Project updated = projectRepository.save(project);

        log.info("Project closed successfully: {}", projectId);
        auditLogService.logAction(getCurrentUserId(), "PROJECT_CLOSED", "PROJECT", project.getId(),
                "ACTIVE", "CLOSED", request.getReason());

        return mapToDTO(updated);
    }

    public ProjectDTO reopenProject(String projectId, CloseProjectRequest request) {
        log.info("Reopening project: {}", projectId);

        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        project.setStatus("ACTIVE");
        project.setUpdatedAt(LocalDateTime.now());
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
    public Page<ProjectDTO> getProjects(String projectId, String projectName, String status,
                                        Long managerId, String clientName, Pageable pageable) {
        log.debug("Searching projects with filters");
        Page<Project> projects = projectRepository.searchProjects(
                projectId, projectName, status, managerId, clientName, pageable);
        return projects.map(this::mapToDTO);
    }

    private void validateProjectUniqueness(String projectId) {
        if (projectRepository.findByProjectId(projectId).isPresent()) {
            throw new com.rightFit.exception.DuplicateEntityException("Project", "projectId", projectId);
        }
    }

    private ProjectDTO mapToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .managerId(project.getManager() != null ? project.getManager().getId() : null)
                .managerName(project.getManager() != null ?
                        project.getManager().getFirstName() + " " + project.getManager().getLastName() : null)
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .clientName(project.getClientName())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .createdBy(project.getCreatedBy())
                .updatedBy(project.getUpdatedBy())
                .build();
    }

    private Long getCurrentUserId() {
        return com.rightFit.security.SecurityContextUtil.getCurrentUserId();
    }
}
