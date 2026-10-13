package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.AdminDashboardDTO;
import com.rightFit.dto.DashboardDtos.UpcomingInterviewDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.repository.AuditLogRepository;
import com.rightFit.repository.BenchHistoryRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.TrainingAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Admin Dashboard (BRD 42): the org-level counts already shown individually elsewhere in the Admin
 * API, bundled into one call. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final int UPCOMING_INTERVIEW_LIMIT = 5;
    /** Training assignments in these states no longer occupy the employee. */
    private static final Set<String> FINISHED_TRAINING = Set.of("COMPLETED", "CANCELLED", "WITHDRAWN");

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final BenchHistoryRepository benchHistoryRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;
    private final InterviewRepository interviewRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final BenchTrackingService benchTrackingService;
    private final RequirementAccessGuard accessGuard;

    public AdminDashboardDTO dashboard() {
        var me = accessGuard.currentEmployeeOrNull();
        Long myId = me != null ? me.getId() : null;

        AdminDashboardDTO.AdminDashboardDTOBuilder builder = AdminDashboardDTO.builder()
                .totalEmployees(employeeRepository.count())
                .activeEmployees(employeeRepository.countByEmploymentStatus("ACTIVE"))
                .inactiveEmployees(employeeRepository.countByEmploymentStatus("INACTIVE"))
                .totalProjects(projectRepository.count())
                .activeProjects(projectRepository.countByStatus("ACTIVE"))
                .totalManagers(projectRepository.countDistinctManagers())
                .totalRmgs(employeeRepository.countDistinctRmgs())
                .pendingManagerReplacements(projectRepository.countPendingManagerReplacements())
                .pendingRmgReplacements(employeeRepository.countPendingRmgReplacements())
                .totalAuditEntries(auditLogRepository.count())
                .auditEntriesLast24h(auditLogRepository.countByTimestampAfter(LocalDateTime.now().minusHours(24)))
                .unreadNotifications(myId == null ? 0 : notificationRepository.countByRecipientIdAndIsReadFalse(myId))
                .openRequirements(requirementRepository.countByStatus("PUBLISHED"));

        addWorkforceDistribution(builder);

        var bench = benchTrackingService.summary();
        builder.benchGreen(bench.getGreen()).benchAmber(bench.getAmber()).benchRed(bench.getRed());

        builder.upcomingInterviews(interviewRepository
                .findUpcoming(LocalDateTime.now(), PageRequest.of(0, UPCOMING_INTERVIEW_LIMIT))
                .stream()
                .map(this::toUpcoming)
                .toList());

        return builder.build();
    }

    /** Each active employee lands in exactly one bucket: project > training > bench/pool > unassigned. */
    private void addWorkforceDistribution(AdminDashboardDTO.AdminDashboardDTOBuilder builder) {
        Set<Long> inTraining = trainingAssignmentRepository.findAllOrderByAssignedAtDesc().stream()
                .filter(a -> a.getAssignmentStatus() == null || !FINISHED_TRAINING.contains(a.getAssignmentStatus().toUpperCase()))
                .filter(a -> !"COMPLETED".equalsIgnoreCase(a.getCompletionStatus()))
                .map(a -> a.getEmployee().getId())
                .collect(Collectors.toSet());
        Set<Long> onBench = benchHistoryRepository.findAllCurrent().stream()
                .map(b -> b.getEmployee().getId())
                .collect(Collectors.toSet());

        long project = 0;
        long training = 0;
        long bench = 0;
        long unassigned = 0;
        List<Employee> active = employeeRepository.findAll().stream()
                .filter(e -> "ACTIVE".equals(e.getEmploymentStatus()))
                .toList();
        for (Employee e : active) {
            if ("ALLOCATED".equals(e.getAllocationStatus())) {
                project++;
            } else if (inTraining.contains(e.getId())) {
                training++;
            } else if (onBench.contains(e.getId()) || "IN_RESOURCE_POOL".equals(e.getPoolStatus())) {
                bench++;
            } else {
                unassigned++;
            }
        }
        builder.inProjectEmployees(project)
                .inTrainingEmployees(training)
                .onBenchEmployees(bench)
                .unassignedEmployees(unassigned);
    }

    private UpcomingInterviewDTO toUpcoming(Interview i) {
        var requirement = i.getRequirement();
        return UpcomingInterviewDTO.builder()
                .interviewId(i.getInterviewId())
                .candidateName(i.getEmployee() != null ? CandidateWorkflowService.name(i.getEmployee()) : null)
                .candidateEmployeeId(i.getEmployee() != null ? i.getEmployee().getEmployeeId() : null)
                .positionTitle(requirement != null ? requirement.getPositionTitle() : null)
                .projectName(requirement != null && requirement.getProject() != null
                        ? requirement.getProject().getProjectName() : null)
                .interviewerName(i.getInterviewer() != null ? CandidateWorkflowService.name(i.getInterviewer()) : null)
                .scheduledAt(i.getScheduledAt())
                .roundNumber(i.getRoundNumber())
                .mode(i.getMode())
                .status(i.getStatus())
                .build();
    }
}
