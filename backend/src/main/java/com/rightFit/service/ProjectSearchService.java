package com.rightFit.service;

import com.rightFit.dto.ProjectSearchRequest;
import com.rightFit.dto.ProjectDTO;
import com.rightFit.entity.Project;
import com.rightFit.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectSearchService {

    private final ProjectRepository projectRepository;

    public Page<ProjectDTO> searchProjects(ProjectSearchRequest request) {
        log.debug("Searching projects with filters: {}", request);

        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        String sortBy = request.getSortBy() != null ? request.getSortBy() : "projectName";
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), Sort.by(direction, sortBy));

        Page<Project> projects = projectRepository.searchProjects(
                request.getProjectId(),
                request.getProjectName(),
                request.getStatus(),
                request.getManagerId(),
                request.getClientName(),
                pageable);

        return projects.map(this::mapToDTO);
    }

    private ProjectDTO mapToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .status(project.getStatus())
                .managerId(project.getManager() != null ? project.getManager().getId() : null)
                .managerName(project.getManager() != null ?
                        project.getManager().getFirstName() + " " + project.getManager().getLastName() : null)
                .clientName(project.getClientName())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .build();
    }
}
