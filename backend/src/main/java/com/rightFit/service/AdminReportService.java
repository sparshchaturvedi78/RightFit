package com.rightFit.service;

import com.rightFit.dto.DashboardDtos.ReportDTO;
import com.rightFit.dto.DemandSupplyDtos.SkillDemandSupplyDTO;
import com.rightFit.dto.PoolBenchDtos.BenchEntryDTO;
import com.rightFit.dto.RejectionDtos.RejectionDTO;
import com.rightFit.dto.TrainingDtos.TrainingAssignmentDTO;
import com.rightFit.entity.Department;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.DepartmentRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /** Largest date span a report download may cover (screen views are not limited). */
    public static final int DOWNLOAD_MAX_DAYS = 30;

    /** Reports that are org-wide skill data with no employee or project in each row - Admin only. */
    private static final Set<String> ADMIN_ONLY_REPORTS = Set.of("demand_supply");

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AllocationRepository allocationRepository;
    private final RequirementAccessGuard accessGuard;
    private final com.rightFit.repository.UserRoleRepository userRoleRepository;
    private final WorkforceBucketService workforceBucketService;
    private final BenchTrackingService benchTrackingService;
    private final WorkforceIntelligenceService workforceIntelligenceService;
    private final ManagerDashboardService managerDashboardService;
    private final RejectionService rejectionService;
    private final TrainingService trainingService;
    private final AllocationService allocationService;

    /** Report types the caller may open: everything for an Admin, org-wide skill data hidden from the rest. */
    public List<String> availableTypes() {
        if (accessGuard.isAdmin()) {
            return AVAILABLE_TYPES;
        }
        return AVAILABLE_TYPES.stream().filter(t -> !ADMIN_ONLY_REPORTS.contains(t)).toList();
    }

    /**
     * Departments for the department filter, with how many people (active, allocatable) are in each.
     * Names and counts only, so Manager and RMG can use it without EMPLOYEE_READ.
     */
    public List<Map<String, Object>> departments() {
        Map<String, Integer> people = new java.util.HashMap<>();
        for (Employee e : workforce()) {
            if (e.getDepartment() != null) {
                people.merge(e.getDepartment().getName(), 1, Integer::sum);
            }
        }
        return departmentRepository.findAll().stream().map(Department::getName).sorted().map(name -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("name", name);
            d.put("people", people.getOrDefault(name, 0));
            return d;
        }).toList();
    }

    /** Reports about people who can be put on projects. Admins and RMGs (people report to them) are left out. */
    private static final Set<String> PEOPLE_REPORTS = Set.of("workforce", "bench_aging", "red_zone", "allocation_capacity");

    /**
     * Active employees who can be allocated: everyone except people whose only roles are Admin and/or RMG -
     * the same rule the Employees page uses for its allocation badge. Managers stay (they run projects).
     */
    private List<Employee> workforce() {
        List<Employee> active = employeeRepository.findAll().stream()
                .filter(e -> "ACTIVE".equals(e.getEmploymentStatus())).toList();
        Set<String> leadershipOnly = leadershipOnlyIds(active);
        return active.stream().filter(e -> !leadershipOnly.contains(e.getEmployeeId())).toList();
    }

    /** Employee IDs of people whose roles are only Admin and/or RMG. */
    private Set<String> leadershipOnlyIds(List<Employee> employees) {
        Map<Long, Employee> byUser = new java.util.HashMap<>();
        for (Employee e : employees) {
            if (e.getUser() != null) byUser.put(e.getUser().getId(), e);
        }
        Map<Long, Set<String>> codes = new java.util.HashMap<>();
        if (!byUser.isEmpty()) {
            for (Object[] row : userRoleRepository.findActiveRoleCodesByUserIds(byUser.keySet())) {
                codes.computeIfAbsent((Long) row[0], k -> new HashSet<>()).add((String) row[1]);
            }
        }
        Set<String> out = new HashSet<>();
        codes.forEach((userId, c) -> {
            boolean worker = c.contains(RequirementAccessGuard.MANAGER) || c.contains("ASSOCIATE");
            boolean leadership = c.contains(RequirementAccessGuard.ADMIN) || c.contains(RequirementAccessGuard.RMG);
            if (leadership && !worker) out.add(byUser.get(userId).getEmployeeId());
        });
        return out;
    }

    /** Which field holds each report's date, for the date range filter. Reports not listed have no date to filter on. */
    private static final Map<String, String> DATE_FIELD = Map.of(
            "bench_aging", "benchStartDate",
            "red_zone", "benchStartDate",
            "rejections", "rejectionDate",
            "training", "assignedAt",
            "interviews", "scheduledAt",
            "requirements", "createdAt",
            "candidate_pipeline", "createdAt",
            "allocations", "startDate");

    /** Reports whose rows carry a department name, for the department filter. */
    private static final java.util.Set<String> DEPARTMENT_REPORTS = java.util.Set.of("workforce", "bench_aging", "red_zone");

    /** Filters for one report run. Blank means no filter. */
    public record ReportFilter(LocalDate from, LocalDate to, String department) {
        public static ReportFilter none() {
            return new ReportFilter(null, null, null);
        }
    }

    public ReportDTO report(String type) {
        return report(type, ReportFilter.none());
    }

    /** Which filters apply to a report, so the page shows only those. */
    public Map<String, Boolean> filtersFor(String type) {
        return Map.of("date", DATE_FIELD.containsKey(type), "department", DEPARTMENT_REPORTS.contains(type));
    }

    /**
     * Whose rows the caller may see. Admin: everyone. Manager: rows about their projects (a row with a
     * project must be on one of them; a row without one must be about someone in them). RMG: rows about
     * their associates only. Anyone else with report access: nothing.
     */
    private record Scope(boolean all, Set<String> projectIds, Set<String> employeeIds, String label) {}

    private Scope scopeForCaller() {
        if (accessGuard.isAdmin()) {
            return new Scope(true, Set.of(), Set.of(), "you are an Admin");
        }
        Set<String> roles = accessGuard.roleCodes();
        Employee caller = accessGuard.currentEmployeeOrNull();
        if (caller == null) {
            return new Scope(false, Set.of(), Set.of(), "No employee profile is linked to your account");
        }
        if (roles.contains(RequirementAccessGuard.MANAGER)) {
            Set<String> projectIds = new HashSet<>();
            Set<String> employeeIds = new HashSet<>();
            for (Project p : projectRepository.findByManagerId(caller.getId())) {
                projectIds.add(p.getProjectId());
                projectMemberRepository.findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(p.getId())
                        .forEach(m -> employeeIds.add(m.getEmployee().getEmployeeId()));
                allocationRepository.findByProjectIdAndStatus(p.getId(), "ACTIVE")
                        .forEach(a -> employeeIds.add(a.getEmployee().getEmployeeId()));
            }
            return new Scope(false, projectIds, employeeIds, "your projects only · you are a Manager");
        }
        if (roles.contains(RequirementAccessGuard.RMG)) {
            Set<String> employeeIds = new HashSet<>();
            if (caller.getSubordinates() != null) {
                caller.getSubordinates().forEach(e -> employeeIds.add(e.getEmployeeId()));
            }
            return new Scope(false, Set.of(), employeeIds, "your associates only · you are an RMG");
        }
        return new Scope(false, Set.of(), Set.of(), "No report scope for your role");
    }

    private List<Map<String, Object>> inScope(List<Map<String, Object>> rows, Scope scope) {
        if (scope.all()) {
            return rows;
        }
        return rows.stream().filter(row -> {
            Object projectId = row.get("projectId");
            Object employeeId = row.get("employeeId");
            if (projectId != null && !scope.projectIds().isEmpty()) {
                return scope.projectIds().contains(String.valueOf(projectId));
            }
            return employeeId != null && scope.employeeIds().contains(String.valueOf(employeeId));
        }).toList();
    }

    /** Downloads of a date-based report need both dates, no more than DOWNLOAD_MAX_DAYS apart. */
    public void assertDownloadable(String type, ReportFilter filter) {
        if (!DATE_FIELD.containsKey(type)) {
            return;
        }
        String choose = " Downloads are limited to " + DOWNLOAD_MAX_DAYS
                + " days at a time; for older dates, pick a custom range within that limit.";
        if (filter.from() == null || filter.to() == null) {
            throw new BusinessRuleException("Choose a from and to date to download this report." + choose);
        }
        if (filter.to().isBefore(filter.from())) {
            throw new BusinessRuleException("The to date is before the from date.");
        }
        long days = ChronoUnit.DAYS.between(filter.from(), filter.to()) + 1;
        if (days > DOWNLOAD_MAX_DAYS) {
            throw new BusinessRuleException("This range is " + days + " days." + choose);
        }
    }

    public ReportDTO report(String type, ReportFilter filter) {
        if (ADMIN_ONLY_REPORTS.contains(type) && !accessGuard.isAdmin()) {
            throw new BusinessRuleException("The '" + type + "' report is only available to Admins.");
        }
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
        if (PEOPLE_REPORTS.contains(type) && !"workforce".equals(type)) {
            // Workforce already starts from allocatable people; the others come from services that don't.
            Set<String> skip = leadershipOnlyIds(employeeRepository.findAll());
            rows = rows.stream().filter(r -> !skip.contains(String.valueOf(r.get("employeeId")))).toList();
        }
        Scope scope = scopeForCaller();
        rows = applyFilters(type, inScope(rows, scope), filter);
        return ReportDTO.builder().report(type).generatedAt(LocalDateTime.now()).scope(scope.label())
                .rowCount(rows.size()).rows(rows).build();
    }

    private List<Map<String, Object>> applyFilters(String type, List<Map<String, Object>> rows, ReportFilter filter) {
        List<Map<String, Object>> out = rows;
        String dateField = DATE_FIELD.get(type);
        if (dateField != null && (filter.from() != null || filter.to() != null)) {
            out = out.stream().filter(row -> {
                LocalDate d = asDate(row.get(dateField));
                if (d == null) return false;
                return (filter.from() == null || !d.isBefore(filter.from()))
                        && (filter.to() == null || !d.isAfter(filter.to()));
            }).toList();
        }
        if (DEPARTMENT_REPORTS.contains(type) && filter.department() != null && !filter.department().isBlank()) {
            String wanted = filter.department().trim();
            out = out.stream().filter(row -> wanted.equalsIgnoreCase(String.valueOf(row.get("department")))).toList();
        }
        return out;
    }

    /** A date from whatever the report row holds for it (a date, a date-time, or text). */
    private static LocalDate asDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate d) return d;
        if (value instanceof LocalDateTime t) return t.toLocalDate();
        if (value instanceof java.time.Instant i) return i.atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        try {
            return LocalDate.parse(value.toString().substring(0, 10));
        } catch (RuntimeException e) {
            return null;
        }
    }

    /** The rows as CSV, with the columns in the order the report produces them. */
    public String toCsv(ReportDTO report) {
        StringBuilder csv = new StringBuilder();
        if (report.getRows().isEmpty()) {
            return "";
        }
        List<String> columns = new java.util.ArrayList<>(report.getRows().get(0).keySet());
        csv.append(String.join(",", columns)).append('\n');
        for (Map<String, Object> row : report.getRows()) {
            List<String> cells = new java.util.ArrayList<>();
            for (String c : columns) {
                Object v = row.get(c);
                String text = v == null ? "" : v.toString();
                cells.add('"' + text.replace("\"", "\"\"") + '"');
            }
            csv.append(String.join(",", cells)).append('\n');
        }
        return csv.toString();
    }

    /** The rows as an Excel workbook (.xlsx). Numbers and booleans stay numeric; everything else is text. */
    public byte[] toXlsx(ReportDTO report) {
        // Streaming workbook: only a window of rows is kept in memory, so large reports don't run the heap out.
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(200); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(report.getReport());
            List<String> columns = report.getRows().isEmpty() ? List.of() : new ArrayList<>(report.getRows().get(0).keySet());

            CellStyle headerStyle = workbook.createCellStyle();
            Font bold = workbook.createFont();
            bold.setBold(true);
            headerStyle.setFont(bold);

            Row header = sheet.createRow(0);
            for (int c = 0; c < columns.size(); c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(columns.get(c));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(c, 22 * 256);
            }
            int r = 1;
            for (Map<String, Object> rowData : report.getRows()) {
                Row row = sheet.createRow(r++);
                for (int c = 0; c < columns.size(); c++) {
                    Object v = rowData.get(columns.get(c));
                    Cell cell = row.createCell(c);
                    if (v == null) {
                        cell.setBlank();
                    } else if (v instanceof Number n) {
                        cell.setCellValue(n.doubleValue());
                    } else if (v instanceof Boolean b) {
                        cell.setCellValue(b);
                    } else {
                        cell.setCellValue(v.toString());
                    }
                }
            }
            workbook.write(out);
            workbook.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Could not build the Excel file for report '" + report.getReport() + "'", e);
        }
    }

    /**
     * Everyone who can be put on a project, by where they are right now - the same buckets the Admin
     * dashboard uses: in a project (member, allocated, or Manager of an active project), on the bench,
     * in training, or unassigned. "Since" and "days" say how long they have been there, where known.
     */
    private List<Map<String, Object>> workforceRows() {
        Map<Long, String> buckets = workforceBucketService.bucketsOfActiveEmployees();
        Map<String, BenchEntryDTO> bench = new java.util.HashMap<>();
        for (BenchEntryDTO b : benchTrackingService.list(null)) {
            bench.put(b.getEmployeeId(), b);
        }
        LocalDate today = LocalDate.now();
        List<Employee> people = workforce();
        Map<String, String> accounts = accountLabels(people);
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (Employee e : people) {
            String bucket = buckets.getOrDefault(e.getId(), WorkforceBucketService.UNASSIGNED);
            String status;
            LocalDate since = null;
            if (WorkforceBucketService.IN_PROJECT.equals(bucket)) {
                status = "In project";
                since = allocationRepository.findByEmployeeIdAndStatus(e.getId(), "ACTIVE").stream()
                        .map(com.rightFit.entity.Allocation::getStartDate).filter(java.util.Objects::nonNull)
                        .min(LocalDate::compareTo).orElse(null);
            } else if (WorkforceBucketService.ON_BENCH.equals(bucket)) {
                BenchEntryDTO b = bench.get(e.getEmployeeId());
                status = b != null && "RED".equals(b.getBenchStatus()) ? "On bench, red"
                        : b != null && "AMBER".equals(b.getBenchStatus()) ? "On bench, amber" : "On bench";
                since = b != null ? b.getBenchStartDate() : null;
            } else if (WorkforceBucketService.IN_TRAINING.equals(bucket)) {
                status = "In training";
            } else {
                status = "Unassigned";
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeId", e.getEmployeeId());
            row.put("name", CandidateWorkflowService.name(e));
            row.put("department", e.getDepartment() != null ? e.getDepartment().getName() : null);
            row.put("status", status);
            row.put("since", since);
            row.put("days", since != null ? ChronoUnit.DAYS.between(since, today) : null);
            row.put("designation", e.getDesignation());
            row.put("account", accounts.get(e.getEmployeeId()));
            row.put("rmg", e.getRmgManager() != null ? CandidateWorkflowService.name(e.getRmgManager()) : null);
            rows.add(row);
        }
        return rows;
    }

    /** Account roles of each employee as a readable label, e.g. "Manager" or "Associate, Manager". */
    private Map<String, String> accountLabels(List<Employee> employees) {
        Map<Long, String> employeeByUser = new java.util.HashMap<>();
        for (Employee e : employees) {
            if (e.getUser() != null) employeeByUser.put(e.getUser().getId(), e.getEmployeeId());
        }
        Map<String, java.util.Set<String>> codes = new java.util.HashMap<>();
        if (!employeeByUser.isEmpty()) {
            for (Object[] row : userRoleRepository.findActiveRoleCodesByUserIds(employeeByUser.keySet())) {
                codes.computeIfAbsent(employeeByUser.get((Long) row[0]), k -> new java.util.TreeSet<>()).add((String) row[1]);
            }
        }
        Map<String, String> labels = new java.util.HashMap<>();
        codes.forEach((employeeId, roles) -> labels.put(employeeId, roles.stream()
                .map(c -> c.charAt(0) + c.substring(1).toLowerCase())
                .collect(java.util.stream.Collectors.joining(", "))));
        return labels;
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
