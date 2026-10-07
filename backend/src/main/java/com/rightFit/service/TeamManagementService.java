package com.rightFit.service;

import com.rightFit.dto.AllocationDtos.AddTeamMemberRequest;
import com.rightFit.dto.AllocationDtos.AllocationDTO;
import com.rightFit.dto.AllocationDtos.AllocationEventDTO;
import com.rightFit.dto.AllocationDtos.CapacityDTO;
import com.rightFit.dto.AllocationDtos.MoveAllocationRequest;
import com.rightFit.dto.AllocationDtos.SplitAllocationRequest;
import com.rightFit.dto.AllocationDtos.SplitEntry;
import com.rightFit.dto.AllocationDtos.TeamDTO;
import com.rightFit.dto.AllocationDtos.TeamMemberDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectMember;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.AllocationEventRepository;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Manager Phase 10: project team, moving an employee between projects, and dividing capacity
 * across projects (BRD 7, 7.1). Capacity can never be exceeded; history is preserved.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TeamManagementService {

    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final AllocationRepository allocationRepository;
    private final AllocationEventRepository eventRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AllocationService allocationService;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public TeamDTO getTeam(String projectId) {
        Project project = loadProject(projectId);
        accessGuard.assertOwnsProjectOrAdmin(project);

        Map<Long, Allocation> activeByEmployee = allocationRepository.findByProjectIdAndStatus(project.getId(), "ACTIVE")
                .stream().collect(Collectors.toMap(a -> a.getEmployee().getId(), Function.identity(), (a, b) -> a));
        List<TeamMemberDTO> members = projectMemberRepository
                .findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(project.getId()).stream()
                .map(m -> {
                    Allocation a = activeByEmployee.get(m.getEmployee().getId());
                    return TeamMemberDTO.builder()
                            .employeeId(m.getEmployee().getEmployeeId())
                            .name(CandidateWorkflowService.name(m.getEmployee()))
                            .designation(m.getEmployee().getDesignation())
                            .role(m.getRole())
                            .joinedAt(m.getJoinedAt())
                            .allocationId(a != null ? a.getAllocationId() : null)
                            .hoursPerDay(a != null ? a.getHoursPerDay() : null)
                            .allocationStartDate(a != null ? a.getStartDate() : null)
                            .allocationEndDate(a != null ? a.getEndDate() : null)
                            .requirementId(a != null && a.getRequirement() != null ? a.getRequirement().getRequirementId() : null)
                            .build();
                }).toList();
        BigDecimal total = members.stream().map(TeamMemberDTO::getHoursPerDay)
                .filter(h -> h != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        return TeamDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .managerName(CandidateWorkflowService.name(project.getManager()))
                .memberCount(members.size())
                .totalHoursPerDay(total)
                .members(members)
                .build();
    }

    public TeamMemberDTO addMember(String projectId, AddTeamMemberRequest request) {
        Project project = loadProject(projectId);
        accessGuard.assertOwnsProjectOrAdmin(project);
        assertProjectOpen(project);

        Employee employee = loadEmployee(request.getEmployeeId());
        if (!"ACTIVE".equals(employee.getEmploymentStatus()) || !"AVAILABLE".equals(employee.getAvailabilityStatus())) {
            throw new BusinessRuleException("Employee " + employee.getEmployeeId() + " is not available for allocation");
        }
        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        Employee actor = accessGuard.currentEmployee();
        Allocation allocation = allocationService.create(employee, project, null, null, start, request.getEndDate(),
                request.getHoursPerDay(), actor, request.getRole());

        notificationService.notify(employee, "TEAM_MEMBER_ADDED", "You were added to " + project.getProjectName(),
                request.getHoursPerDay().stripTrailingZeros().toPlainString() + "h/day from " + start,
                "ALLOCATION", allocation.getAllocationId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TEAM_MEMBER_ADDED", "PROJECT",
                project.getId(), null, employee.getEmployeeId(),
                employee.getEmployeeId() + " added to " + projectId + " (" + allocation.getAllocationId() + ")");
        return getTeam(projectId).getMembers().stream()
                .filter(m -> m.getEmployeeId().equals(employee.getEmployeeId())).findFirst().orElseThrow();
    }

    public void removeMember(String projectId, String employeeId, String reason) {
        Project project = loadProject(projectId);
        accessGuard.assertOwnsProjectOrAdmin(project);
        Employee employee = loadEmployee(employeeId);
        if (project.getManager() != null && project.getManager().getId().equals(employee.getId())) {
            throw new BusinessRuleException("The project's Manager cannot be removed from the team; change the Manager instead");
        }

        Employee actor = accessGuard.currentEmployee();
        Allocation allocation = allocationRepository
                .findByEmployeeIdAndProjectIdAndStatus(employee.getId(), project.getId(), "ACTIVE").orElse(null);
        if (allocation != null) {
            allocationService.end(allocation, LocalDate.now(), "REMOVED_FROM_TEAM: " + reason, actor);
        } else {
            ProjectMember member = projectMemberRepository.findByProjectIdAndEmployeeId(project.getId(), employee.getId())
                    .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                    .orElseThrow(() -> new ResourceNotFoundException("Team member", employeeId));
            member.setIsActive(false);
            member.setLeftAt(LocalDateTime.now());
            projectMemberRepository.save(member);
        }
        notificationService.notify(employee, "TEAM_MEMBER_REMOVED", "You were released from " + project.getProjectName(),
                reason, "PROJECT", projectId);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TEAM_MEMBER_REMOVED", "PROJECT",
                project.getId(), employeeId, null, employeeId + " removed from " + projectId + ": " + reason);
    }

    public CapacityDTO move(String employeeId, MoveAllocationRequest request) {
        if (request.getFromProjectId().equals(request.getToProjectId())) {
            throw new BusinessRuleException("Source and target project must differ");
        }
        Project from = loadProject(request.getFromProjectId());
        Project to = loadProject(request.getToProjectId());
        accessGuard.assertOwnsProjectOrAdmin(from);
        accessGuard.assertOwnsProjectOrAdmin(to);
        assertProjectOpen(to);

        Employee employee = loadEmployee(employeeId);
        Employee actor = accessGuard.currentEmployee();
        Allocation source = allocationRepository
                .findByEmployeeIdAndProjectIdAndStatus(employee.getId(), from.getId(), "ACTIVE")
                .orElseThrow(() -> new BusinessRuleException(
                        "Employee " + employeeId + " has no active allocation on " + from.getProjectId()));
        if (allocationRepository.findByEmployeeIdAndProjectIdAndStatus(employee.getId(), to.getId(), "ACTIVE").isPresent()) {
            throw new BusinessRuleException("Employee " + employeeId + " is already allocated to "
                    + to.getProjectId() + "; use the split endpoint to redistribute hours");
        }

        LocalDate effective = request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now();
        BigDecimal hours = request.getHoursPerDay() != null ? request.getHoursPerDay() : source.getHoursPerDay();
        String memberRole = projectMemberRepository.findByProjectIdAndEmployeeId(from.getId(), employee.getId())
                .map(ProjectMember::getRole).orElse(null);

        allocationService.end(source, effective, "MOVED_TO " + to.getProjectId() + ": " + request.getReason(), actor, false);
        Allocation target = allocationService.create(employee, to, null, null, effective, source.getEndDate(), hours,
                actor, memberRole);
        allocationService.event(target, "MOVED_IN", "From " + from.getProjectId() + " (" + source.getAllocationId()
                + "). " + request.getReason(), actor);

        notificationService.notify(employee, "EMPLOYEE_MOVED",
                "You were moved from " + from.getProjectName() + " to " + to.getProjectName(), request.getReason(),
                "ALLOCATION", target.getAllocationId());
        if (to.getManager() != null && !to.getManager().getId().equals(actor.getId())) {
            notificationService.notify(to.getManager(), "EMPLOYEE_MOVED",
                    CandidateWorkflowService.name(employee) + " moved to " + to.getProjectName(),
                    request.getReason(), "ALLOCATION", target.getAllocationId());
        }
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_MOVED", "ALLOCATION",
                target.getId(), from.getProjectId(), to.getProjectId(),
                employeeId + ": " + from.getProjectId() + " -> " + to.getProjectId() + ". " + request.getReason());
        return capacity(employeeId);
    }

    /** Divide an employee's daily capacity across projects, e.g. 9h = 4.5h Project A + 4.5h Project B. */
    public CapacityDTO split(String employeeId, SplitAllocationRequest request) {
        Employee employee = loadEmployee(employeeId);
        Employee actor = accessGuard.currentEmployee();

        Set<String> seen = new HashSet<>();
        Map<String, Project> projects = new java.util.LinkedHashMap<>();
        for (SplitEntry entry : request.getAllocations()) {
            if (!seen.add(entry.getProjectId())) {
                throw new BusinessRuleException("Project " + entry.getProjectId() + " appears more than once");
            }
            Project project = loadProject(entry.getProjectId());
            accessGuard.assertOwnsProjectOrAdmin(project);
            assertProjectOpen(project);
            projects.put(entry.getProjectId(), project);
        }

        List<Allocation> active = allocationRepository.findByEmployeeIdAndStatus(employee.getId(), "ACTIVE");
        Map<Long, Allocation> activeByProject = active.stream()
                .collect(Collectors.toMap(a -> a.getProject().getId(), Function.identity()));

        BigDecimal planTotal = request.getAllocations().stream().map(SplitEntry::getHoursPerDay)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Set<Long> replaced = new HashSet<>();
        for (Project p : projects.values()) {
            Allocation existing = activeByProject.get(p.getId());
            if (existing != null) {
                replaced.add(existing.getId());
            }
        }
        allocationService.assertCapacity(employee, LocalDate.now(), null, planTotal, replaced);

        List<SplitEntry> ordered = new ArrayList<>(request.getAllocations());
        ordered.sort(Comparator.comparing(e -> {
            Allocation existing = activeByProject.get(projects.get(e.getProjectId()).getId());
            return existing == null ? e.getHoursPerDay() : e.getHoursPerDay().subtract(existing.getHoursPerDay());
        }));
        for (SplitEntry entry : ordered) {
            Project project = projects.get(entry.getProjectId());
            Allocation existing = activeByProject.get(project.getId());
            if (existing != null) {
                allocationService.changeHours(existing, entry.getHoursPerDay(), actor, "Split: " + request.getReason());
            } else {
                Allocation created = allocationService.create(employee, project, null, null, LocalDate.now(), null,
                        entry.getHoursPerDay(), actor, null);
                allocationService.event(created, "SPLIT", request.getReason(), actor);
            }
        }

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ALLOCATION_SPLIT", "ALLOCATION",
                employee.getId(), null, request.getAllocations().stream()
                        .map(e -> e.getProjectId() + "=" + e.getHoursPerDay().stripTrailingZeros().toPlainString() + "h")
                        .collect(Collectors.joining(", ")),
                employeeId + " capacity split. " + request.getReason());
        notificationService.notify(employee, "ALLOCATION_SPLIT", "Your allocation was rebalanced across projects",
                request.getReason(), "EMPLOYEE", employeeId);
        return capacity(employeeId);
    }

    @Transactional(readOnly = true)
    public CapacityDTO capacity(String employeeId) {
        Employee employee = loadEmployee(employeeId);
        List<Allocation> active = allocationService.activeFor(employee);
        BigDecimal allocated = active.stream().map(Allocation::getHoursPerDay).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal capacity = allocationService.capacityOf(employee);
        return CapacityDTO.builder()
                .employeeId(employee.getEmployeeId())
                .name(CandidateWorkflowService.name(employee))
                .workingHoursPerDay(capacity)
                .allocatedHoursPerDay(allocated)
                .availableHoursPerDay(capacity.subtract(allocated).max(BigDecimal.ZERO))
                .allocationStatus(employee.getAllocationStatus())
                .activeAllocations(active.stream().map(allocationService::toDTO).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AllocationDTO> employeeAllocations(String employeeId) {
        Employee employee = loadEmployee(employeeId);
        return allocationRepository.findByEmployeeIdOrderByStartDateDesc(employee.getId()).stream()
                .map(allocationService::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AllocationDTO> projectAllocations(String projectId) {
        Project project = loadProject(projectId);
        accessGuard.assertOwnsProjectOrAdmin(project);
        return allocationRepository.findByProjectIdOrderByStartDateDescIdDesc(project.getId()).stream()
                .map(allocationService::toDTO).toList();
    }

    /** Append-only allocation history for the project: created / hours changed / moved / ended. */
    @Transactional(readOnly = true)
    public List<AllocationEventDTO> projectHistory(String projectId) {
        Project project = loadProject(projectId);
        accessGuard.assertOwnsProjectOrAdmin(project);
        List<AllocationEventDTO> events = new ArrayList<>();
        for (Allocation a : allocationRepository.findByProjectIdOrderByStartDateDescIdDesc(project.getId())) {
            eventRepository.findByAllocationIdOrderByCreatedAtAscIdAsc(a.getId()).forEach(e -> events.add(
                    AllocationEventDTO.builder()
                            .allocationId(a.getAllocationId())
                            .employeeId(a.getEmployee().getEmployeeId())
                            .eventType(e.getEventType())
                            .details(e.getDetails())
                            .performedByName(CandidateWorkflowService.name(e.getPerformedBy()))
                            .createdAt(e.getCreatedAt())
                            .build()));
        }
        events.sort(Comparator.comparing(AllocationEventDTO::getCreatedAt));
        return events;
    }

    private void assertProjectOpen(Project project) {
        if ("CLOSED".equals(project.getStatus())) {
            throw new BusinessRuleException("Project " + project.getProjectId() + " is closed");
        }
    }

    private Project loadProject(String projectId) {
        return projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Employee loadEmployee(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
    }
}
