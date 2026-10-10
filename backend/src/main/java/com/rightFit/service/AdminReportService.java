package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.dto.DemandSupplyDtos.SkillDemandSupplyDTO;
import com.rightFit.dto.PoolBenchDtos.BenchEntryDTO;
import com.rightFit.dto.RejectionDtos.RejectionDTO;
import com.rightFit.dto.TrainingDtos.TrainingAssignmentDTO;
import com.rightFit.entity.Employee;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Reports (BRD 43). Replaces the old stub (hardcoded type list, fake "processing" response,
 * fake download URL - nothing behind any of the three endpoints actually worked) with the same real,
 * synchronous row-based pattern ManagerDashboardService's reports already use. Most types here
 * delegate straight to the service that already owns that data org-wide for an Admin caller, rather
 * than recomputing it - this file adds new logic only where nothing existed yet (workforce,
 * allocation capacity). Employee/Project Audit History, the Manager/RMG Assignment Report and the
 * complete audit-history download are intentionally not here - they already exist as their own
 * endpoints (AdminAuditController, AdminAssignmentController) and don't need a parallel path.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportService {

    private static final List<String> AVAILABLE_TYPES = List.of(
            "workforce", "bench_aging", "red_zone", "demand_supply", "requirements",
            "candidate_pipeline", "interviews", "allocations", "allocation_capacity",
            "rejections", "training");

    private final EmployeeRepository employeeRepository;
    private final BenchTrackingService benchTrackingService;
    private final WorkforceIntelligenceService workforceIntelligenceService;
    private final ManagerDashboardService managerDashboardService;
    private final RejectionService rejectionService;
    private final TrainingService trainingService;
    private final AllocationService allocationService;

    public List<String> availableTypes() {
        return AVAILABLE_TYPES;
    }

    public ReportDTO report(String type) {
        List<Map<String, Object>> rows = switch (type) {
            case "workforce" -> workforceRows();
            case "bench_aging" -> benchRows(null);
            case "red_zone" -> benchRows("RED");
            case "demand_supply" -> demandSupplyRows();
            case "requirements" -> managerDashboardService.report("requirements").getRows();
            case "candidate_pipeline" -> managerDashboardService.report("pipeline").getRows();
            case "interviews" -> managerDashboardService.report("interviews").getRows();
            case "allocations" -> managerDashboardService.report("allocations").getRows();
            case "allocation_capacity" -> allocationCapacityRows();
            case "rejections" -> rejectionRows();
            case "training" -> trainingRows();
            default -> throw new BusinessRuleException("Unknown report '" + type
                    + "'. Available: " + String.join(", ", AVAILABLE_TYPES));
        };
        return ReportDTO.builder().report(type).generatedAt(LocalDateTime.now()).rowCount(rows.size()).rows(rows).build();
    }

    private List<Map<String, Object>> workforceRows() {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (Employee e : employeeRepository.findAll()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeId", e.getEmployeeId());
            row.put("name", CandidateWorkflowService.name(e));
            row.put("designation", e.getDesignation());
            row.put("grade", e.getGrade());
            row.put("department", e.getDepartment() != null ? e.getDepartment().getName() : null);
            row.put("employmentStatus", e.getEmploymentStatus());
            row.put("allocationStatus", e.getAllocationStatus());
            row.put("availabilityStatus", e.getAvailabilityStatus());
            row.put("poolStatus", e.getPoolStatus());
            row.put("rmg", e.getRmgManager() != null ? CandidateWorkflowService.name(e.getRmgManager()) : null);
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> benchRows(String statusFilter) {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (BenchEntryDTO b : benchTrackingService.list(statusFilter)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeId", b.getEmployeeId());
            row.put("name", b.getName());
            row.put("designation", b.getDesignation());
            row.put("grade", b.getGrade());
            row.put("department", b.getDepartmentName());
            row.put("benchStartDate", b.getBenchStartDate());
            row.put("daysOnBench", b.getDaysOnBench());
            row.put("benchStatus", b.getBenchStatus());
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> demandSupplyRows() {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (SkillDemandSupplyDTO s : workforceIntelligenceService.demandSupply().getBySkill()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("skillName", s.getSkillName());
            row.put("category", s.getCategory());
            row.put("demand", s.getDemand());
            row.put("supply", s.getSupply());
            row.put("gap", s.getGap());
            row.put("shortage", s.isShortage());
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> allocationCapacityRows() {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        LocalDate today = LocalDate.now();
        for (Employee e : employeeRepository.findByAllocationStatus("ALLOCATED")) {
            BigDecimal capacity = allocationService.capacityOf(e);
            BigDecimal allocated = allocationService.allocatedHours(e, today, today, null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeId", e.getEmployeeId());
            row.put("name", CandidateWorkflowService.name(e));
            row.put("workingHoursPerDay", capacity);
            row.put("allocatedHoursPerDay", allocated);
            row.put("availableHoursPerDay", capacity.subtract(allocated).max(BigDecimal.ZERO));
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> rejectionRows() {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (RejectionDTO r : rejectionService.listForRmg()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rejectionId", r.getRejectionId());
            row.put("employeeId", r.getEmployeeId());
            row.put("employee", r.getEmployeeName());
            row.put("projectId", r.getProjectId());
            row.put("requirementId", r.getRequirementId());
            row.put("reason", r.getReasonName());
            row.put("category", r.getReasonCategory());
            row.put("rejectedBy", r.getRejectedByName());
            row.put("rejectionDate", r.getRejectionDate());
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> trainingRows() {
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (TrainingAssignmentDTO a : trainingService.listAssignments()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("assignmentId", a.getAssignmentId());
            row.put("employeeId", a.getEmployeeId());
            row.put("employee", a.getEmployeeName());
            row.put("program", a.getProgramName());
            row.put("status", a.getAssignmentStatus());
            row.put("completionStatus", a.getCompletionStatus());
            row.put("score", a.getScore());
            row.put("assignedAt", a.getAssignedAt());
            rows.add(row);
        }
        return rows;
    }
}
