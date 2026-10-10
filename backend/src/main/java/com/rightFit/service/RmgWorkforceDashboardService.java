package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.RmgDashboardDTO;
import com.rightFit.dto.DemandSupplyDtos.SkillDemandSupplyDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Rejection;
import com.rightFit.entity.TrainingAssignment;
import com.rightFit.repository.AllocationRequestRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RejectionRepository;
import com.rightFit.repository.TrainingAssignmentRepository;
import com.rightFit.repository.TrainingProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * RMG Dashboard (BRD 42): bench/demand/supply/rejection/training/allocation, each already backed by
 * its own dedicated endpoint - this bundles the summary numbers from all of them into one call,
 * named RmgWorkforceDashboardService (not RmgDashboardService) to avoid colliding with the
 * existing Admin-facing RMG roster viewer of that name.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RmgWorkforceDashboardService {

    private final BenchTrackingService benchTrackingService;
    private final WorkforceIntelligenceService workforceIntelligenceService;
    private final RejectionRepository rejectionRepository;
    private final TrainingProgramRepository trainingProgramRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;
    private final AllocationRequestRepository allocationRequestRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final RequirementAccessGuard accessGuard;

    public RmgDashboardDTO dashboard() {
        boolean admin = accessGuard.isAdmin();
        Employee me = admin ? null : accessGuard.currentEmployee();

        var benchSummary = benchTrackingService.summary();
        var demandSupply = workforceIntelligenceService.demandSupply();
        List<SkillDemandSupplyDTO> topShortages = demandSupply.getBySkill().stream()
                .filter(SkillDemandSupplyDTO::isShortage)
                .limit(5)
                .toList();

        List<Rejection> rejections = admin
                ? rejectionRepository.findAllOrderByRejectionDateDesc()
                : rejectionRepository.findForRmg(me.getId());
        Map<String, Long> rejectionsByReason = new LinkedHashMap<>();
        for (Rejection r : rejections) {
            rejectionsByReason.merge(r.getRejectionReason().getReasonName(), 1L, Long::sum);
        }

        List<TrainingAssignment> assignments = admin
                ? trainingAssignmentRepository.findAllOrderByAssignedAtDesc()
                : trainingAssignmentRepository.findForRmg(me.getId());
        Map<String, Long> assignmentsByStatus = new LinkedHashMap<>();
        for (TrainingAssignment a : assignments) {
            assignmentsByStatus.merge(a.getAssignmentStatus(), 1L, Long::sum);
        }

        Map<String, Long> allocationRequestsByStatus = toMap(admin
                ? allocationRequestRepository.countByStatusAll()
                : allocationRequestRepository.countByStatusForRmg(me.getId()));

        return RmgDashboardDTO.builder()
                .greenBench(benchSummary.getGreen())
                .amberBench(benchSummary.getAmber())
                .redBench(benchSummary.getRed())
                .poolSize(employeeRepository.countByEmploymentStatusAndPoolStatus("ACTIVE", "IN_RESOURCE_POOL"))
                .openRequirements(requirementRepository.countByStatus("PUBLISHED"))
                .topSkillShortages(topShortages)
                .totalRejections(rejections.size())
                .rejectionsByReason(rejectionsByReason)
                .activeTrainingPrograms(trainingProgramRepository.findByIsActiveTrueOrderByProgramNameAsc().size())
                .trainingAssignmentsByStatus(assignmentsByStatus)
                .allocationRequestsByStatus(allocationRequestsByStatus)
                .unreadNotifications(me == null ? 0 : notificationRepository.countByRecipientIdAndIsReadFalse(me.getId()))
                .build();
    }

    private Map<String, Long> toMap(List<Object[]> grouped) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : grouped) {
            map.put((String) row[0], (Long) row[1]);
        }
        return map;
    }
}
