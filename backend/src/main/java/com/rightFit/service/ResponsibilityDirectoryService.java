package com.rightFit.service;

import com.rightFit.dto.ResponsibilityDirectoryDTO;
import com.rightFit.dto.ResponsibilityDirectoryDTO.Workload;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.RequirementAssignment;
import com.rightFit.entity.UserRole;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The employee dropdown a Manager uses inside a project to pick SOURCER / INTERVIEWER / COORDINATOR users,
 * each with their current responsibility counts. Counts are computed live from the requirements' status, so
 * closing, cancelling or holding a requirement lowers them and resuming it raises them again.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponsibilityDirectoryService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final RequirementAssignmentRepository assignmentRepository;
    private final RequirementAccessGuard accessGuard;

    /**
     * "Who actually is a SOURCER / INTERVIEWER / COORDINATOR" - current active holders only, grouped by type.
     * Scoped to one requirement when requirementId is given, otherwise every requirement in the project.
     */
    public com.rightFit.dto.ResponsibilityRosterDTO roster(String projectId, String requirementId) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        accessGuard.assertOwnsProjectOrAdmin(project);

        List<RequirementAssignment> assignments;
        if (requirementId != null && !requirementId.isBlank()) {
            ProjectRequirement requirement = requirementRepository.findByRequirementId(requirementId)
                    .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
            if (!requirement.getProject().getId().equals(project.getId())) {
                throw new BusinessRuleException("Requirement " + requirementId + " does not belong to project " + projectId);
            }
            assignments = assignmentRepository.findByRequirementIdAndIsActiveTrue(requirement.getId());
        } else {
            assignments = requirementRepository.findByProjectId(project.getId()).stream()
                    .flatMap(r -> assignmentRepository.findByRequirementIdAndIsActiveTrue(r.getId()).stream())
                    .toList();
        }

        return com.rightFit.dto.ResponsibilityRosterDTO.builder()
                .sourcer(holders(assignments, RequirementAssignment.SOURCER))
                .interviewer(holders(assignments, RequirementAssignment.INTERVIEWER))
                .coordinator(holders(assignments, RequirementAssignment.COORDINATOR))
                .build();
    }

    private List<com.rightFit.dto.ResponsibilityRosterDTO.Holder> holders(List<RequirementAssignment> assignments, String type) {
        Map<Employee, List<String>> byEmployee = new java.util.LinkedHashMap<>();
        for (RequirementAssignment a : assignments) {
            if (type.equals(a.getResponsibilityType())) {
                byEmployee.computeIfAbsent(a.getEmployee(), k -> new ArrayList<>())
                        .add(a.getRequirement().getRequirementId());
            }
        }
        return byEmployee.entrySet().stream()
                .map(e -> com.rightFit.dto.ResponsibilityRosterDTO.Holder.builder()
                        .employeeId(e.getKey().getEmployeeId())
                        .name(CandidateWorkflowService.name(e.getKey()))
                        .requirementIds(e.getValue())
                        .build())
                .toList();
    }

    public Page<ResponsibilityDirectoryDTO> list(String projectId, String requirementId, String q, Pageable pageable) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        accessGuard.assertOwnsProjectOrAdmin(project);

        ProjectRequirement requirement = null;
        if (requirementId != null && !requirementId.isBlank()) {
            requirement = requirementRepository.findByRequirementId(requirementId)
                    .orElseThrow(() -> new ResourceNotFoundException("Requirement", requirementId));
            if (!requirement.getProject().getId().equals(project.getId())) {
                throw new BusinessRuleException("Requirement " + requirementId + " does not belong to project " + projectId);
            }
        }

        Page<Employee> page = employeeRepository.findAll(assignable(q), pageable);
        List<Long> ids = page.getContent().stream().map(Employee::getId).toList();

        Map<Long, int[]> overall = ids.isEmpty() ? Map.of() : tally(assignmentRepository.countWorkload(ids));
        Map<Long, int[]> inProject = ids.isEmpty() ? Map.of()
                : tally(assignmentRepository.countWorkloadInProject(ids, project.getId()));

        Map<Long, List<String>> held = new HashMap<>();
        if (requirement != null) {
            for (RequirementAssignment a : assignmentRepository.findByRequirementIdAndIsActiveTrue(requirement.getId())) {
                held.computeIfAbsent(a.getEmployee().getId(), k -> new ArrayList<>()).add(a.getResponsibilityType());
            }
        }

        final boolean withRequirement = requirement != null;
        return page.map(e -> ResponsibilityDirectoryDTO.builder()
                .employeeId(e.getEmployeeId())
                .name(CandidateWorkflowService.name(e))
                .email(e.getEmail())
                .designation(e.getDesignation())
                .grade(e.getGrade())
                .workload(toWorkload(overall.get(e.getId())))
                .projectWorkload(toWorkload(inProject.get(e.getId())))
                .heldOnRequirement(withRequirement ? held.getOrDefault(e.getId(), List.of()) : null)
                .build());
    }

    /** ACTIVE employees who can actually hold a responsibility: no Admin accounts, no RMG-only accounts. */
    private Specification<Employee> assignable(String q) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("employmentStatus"), "ACTIVE"));

            Subquery<Long> admin = query.subquery(Long.class);
            Root<UserRole> adminRole = admin.from(UserRole.class);
            admin.select(adminRole.<Long>get("id")).where(cb.equal(adminRole.get("user"), root.get("user")),
                    cb.isTrue(adminRole.<Boolean>get("isActive")),
                    cb.equal(adminRole.get("role").get("code"), RequirementAccessGuard.ADMIN));
            predicates.add(cb.not(cb.exists(admin)));

            Subquery<Long> rmg = query.subquery(Long.class);
            Root<UserRole> rmgRole = rmg.from(UserRole.class);
            rmg.select(rmgRole.<Long>get("id")).where(cb.equal(rmgRole.get("user"), root.get("user")),
                    cb.isTrue(rmgRole.<Boolean>get("isActive")),
                    cb.equal(rmgRole.get("role").get("code"), RequirementAccessGuard.RMG));
            Subquery<Long> manager = query.subquery(Long.class);
            Root<UserRole> managerRole = manager.from(UserRole.class);
            manager.select(managerRole.<Long>get("id")).where(cb.equal(managerRole.get("user"), root.get("user")),
                    cb.isTrue(managerRole.<Boolean>get("isActive")),
                    cb.equal(managerRole.get("role").get("code"), RequirementAccessGuard.MANAGER));
            predicates.add(cb.not(cb.and(cb.exists(rmg), cb.not(cb.exists(manager)))));

            if (q != null && !q.isBlank()) {
                String term = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("employeeId")), term),
                        cb.like(cb.lower(root.get("firstName")), term),
                        cb.like(cb.lower(root.get("lastName")), term),
                        cb.like(cb.lower(root.get("email")), term),
                        cb.like(cb.lower(cb.concat(cb.concat(root.<String>get("firstName"), " "),
                                root.<String>get("lastName"))), term)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** [sourcer, interviewer, coordinator] per employee id. */
    private Map<Long, int[]> tally(List<Object[]> rows) {
        Map<Long, int[]> counts = new HashMap<>();
        for (Object[] row : rows) {
            int[] c = counts.computeIfAbsent((Long) row[0], k -> new int[3]);
            int n = ((Number) row[2]).intValue();
            switch ((String) row[1]) {
                case RequirementAssignment.SOURCER -> c[0] = n;
                case RequirementAssignment.INTERVIEWER -> c[1] = n;
                default -> c[2] = n;
            }
        }
        return counts;
    }

    private Workload toWorkload(int[] c) {
        int[] v = c == null ? new int[3] : c;
        return Workload.builder().sourcer(v[0]).interviewer(v[1]).coordinator(v[2]).total(v[0] + v[1] + v[2]).build();
    }
}
