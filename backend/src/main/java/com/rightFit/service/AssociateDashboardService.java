package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.AssociateDashboardDTO;
import com.rightFit.dto.DashboardDtos.CurrentAllocationDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.Employee;
import com.rightFit.entity.TrainingAssignment;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.repository.InvitationRepository;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.TrainingAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Associate Dashboard (BRD 42): invitations, opportunities, interviews, current allocation,
 * opportunity history and notifications, all scoped to the caller's own record. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssociateDashboardService {

    private static final Set<String> ACTIVE_TRAINING_STATUSES = Set.of("ASSIGNED", "IN_PROGRESS");

    private final InvitationRepository invitationRepository;
    private final InterviewRepository interviewRepository;
    private final CandidateApplicationRepository candidateApplicationRepository;
    private final AllocationRepository allocationRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;
    private final NotificationRepository notificationRepository;
    private final RequirementAccessGuard accessGuard;

    public AssociateDashboardDTO dashboard() {
        Employee me = accessGuard.currentEmployee();

        List<Allocation> active = allocationRepository.findByEmployeeIdAndStatus(me.getId(), "ACTIVE");
        List<CurrentAllocationDTO> currentAllocations = active.stream()
                .map(a -> CurrentAllocationDTO.builder()
                        .allocationId(a.getAllocationId())
                        .projectId(a.getProject().getProjectId())
                        .projectName(a.getProject().getProjectName())
                        .hoursPerDay(a.getHoursPerDay())
                        .startDate(a.getStartDate())
                        .build())
                .toList();

        long activeTraining = trainingAssignmentRepository.findByEmployeeIdOrderByAssignedAtDesc(me.getId()).stream()
                .map(TrainingAssignment::getAssignmentStatus)
                .filter(ACTIVE_TRAINING_STATUSES::contains)
                .count();

        return AssociateDashboardDTO.builder()
                .employmentStatus(me.getEmploymentStatus())
                .allocationStatus(me.getAllocationStatus())
                .availabilityStatus(me.getAvailabilityStatus())
                .poolStatus(me.getPoolStatus())
                .pendingInvitations(invitationRepository.countPendingForEmployee(me.getId()))
                .openOpportunities(candidateApplicationRepository.countOpenForEmployee(me.getId()))
                .upcomingInterviews(interviewRepository.countUpcomingForEmployee(me.getId(), LocalDateTime.now()))
                .currentAllocations(currentAllocations)
                .totalOpportunityHistory(candidateApplicationRepository.countByEmployeeId(me.getId()))
                .activeTrainingAssignments(activeTraining)
                .unreadNotifications(notificationRepository.countByRecipientIdAndIsReadFalse(me.getId()))
                .build();
    }
}
