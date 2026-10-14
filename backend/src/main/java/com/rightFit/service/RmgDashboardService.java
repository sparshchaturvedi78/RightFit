package com.rightFit.service;

import com.rightFit.dto.RmgDetailDTO;
import com.rightFit.dto.RmgPageDTO;
import com.rightFit.dto.RmgTeamDTO;
import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RmgDashboardService {

    private final EmployeeRepository employeeRepository;
    private final WorkforceBucketService workforceBucketService;

    public List<RmgDetailDTO> getAllRmgs() {
        log.debug("Fetching all RMGs with associate counts");

        List<Employee> rmgs = employeeRepository.findAllRmgs();

        return rmgs.stream()
                .map(this::mapToRmgDetail)
                .collect(Collectors.toList());
    }

    public RmgDetailDTO getRmgDetail(String employeeId) {
        log.debug("Fetching RMG detail: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return mapToRmgDetail(rmg);
    }

    public Page<Employee> getAssociatesForRmg(String employeeId, Pageable pageable) {
        log.debug("Fetching associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.findByRmgManagerId(rmg.getId(), pageable);
    }

    public List<Employee> getAssociatesForRmgActive(String employeeId) {
        log.debug("Fetching active associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.findByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());
    }

    public long getAssociateCountForRmg(String employeeId) {
        log.debug("Counting active associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());
    }

    /**
     * Admin RMG page: RMGs filtered by free text (ID, name, email), status and team (WITH = has associates, NONE = has
     * none), sorted by name, employeeId or associateCount. The RMG set is small, so it is filtered and sorted in
     * memory from one light row query; only the requested page is loaded in full.
     */
    public RmgPageDTO getRmgPage(String q, String status, String team, String sortBy, String sortDirection,
                                 int page, int size) {
        Map<Long, List<Long>> teams = activeTeams();
        Map<Long, String> buckets = workforceBucketService.bucketsOfActiveEmployees();

        List<Object[]> all = employeeRepository.findRmgRows();
        String needle = q == null || q.isBlank() ? null : q.trim().toLowerCase();
        String wantedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        String wantedTeam = team == null || team.isBlank() ? null : team.trim().toUpperCase();

        long active = 0;
        long needReplacement = 0;
        List<Object[]> matches = new ArrayList<>();
        for (Object[] row : all) {
            Long id = (Long) row[0];
            String rowStatus = (String) row[5];
            int teamSize = teams.getOrDefault(id, List.of()).size();
            if ("ACTIVE".equals(rowStatus)) {
                active++;
            } else if (teamSize > 0) {
                needReplacement++;
            }
            if (needle != null && !matchesText(row, needle)) continue;
            if (wantedStatus != null && !wantedStatus.equals(rowStatus)) continue;
            if ("WITH".equals(wantedTeam) && teamSize == 0) continue;
            if ("NONE".equals(wantedTeam) && teamSize > 0) continue;
            matches.add(row);
        }

        Comparator<Object[]> byName = Comparator.comparing((Object[] r) -> (r[2] + " " + r[3]).toLowerCase());
        Comparator<Object[]> order = switch (sortBy == null ? "" : sortBy) {
            case "employeeId" -> Comparator.comparing((Object[] r) -> (String) r[1]);
            case "associateCount" -> Comparator.<Object[]>comparingInt(r -> teams.getOrDefault((Long) r[0], List.of()).size())
                    .thenComparing(byName);
            default -> byName;
        };
        if ("DESC".equalsIgnoreCase(sortDirection)) order = order.reversed();
        matches.sort(order);

        int safeSize = Math.max(1, Math.min(size, 100));
        int from = Math.min(page * safeSize, matches.size());
        int to = Math.min(from + safeSize, matches.size());
        List<Long> pageIds = matches.subList(from, to).stream().map(r -> (Long) r[0]).toList();

        Map<Long, Employee> loaded = new HashMap<>();
        if (!pageIds.isEmpty()) {
            employeeRepository.findWithDetailsByIdIn(pageIds).forEach(e -> loaded.put(e.getId(), e));
        }
        List<RmgDetailDTO> content = pageIds.stream()
                .map(loaded::get)
                .filter(Objects::nonNull)
                .map(e -> toPageRow(e, teams.getOrDefault(e.getId(), List.of()), buckets))
                .toList();

        return RmgPageDTO.builder()
                .content(content)
                .totalElements(matches.size())
                .totalPages((int) Math.ceil(matches.size() / (double) safeSize))
                .number(page)
                .size(safeSize)
                .totalRmgs(all.size())
                .activeRmgs(active)
                .associatesCovered(all.stream()
                        .mapToLong(r -> teams.getOrDefault((Long) r[0], List.of()).size())
                        .sum())
                .needReplacement(needReplacement)
                .build();
    }

    /** One page of the active associates reporting to an RMG, optionally only one workforce bucket, by name. */
    public RmgTeamDTO getRmgTeam(String rmgEmployeeId, String workforce, String q, int page, int size) {
        Employee rmg = employeeRepository.findByEmployeeId(rmgEmployeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + rmgEmployeeId));
        Map<Long, String> buckets = workforceBucketService.bucketsOfActiveEmployees();
        List<Long> teamIds = activeTeams().getOrDefault(rmg.getId(), List.of());

        Map<String, Long> split = split(teamIds, buckets);
        String bucket = workforce == null || workforce.isBlank() ? null : workforce.trim().toUpperCase();
        List<Long> ids = bucket == null ? teamIds
                : teamIds.stream().filter(id -> bucket.equals(buckets.get(id))).toList();

        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(0, page), safeSize, Sort.by("firstName", "lastName"));
        Page<Employee> members = ids.isEmpty() ? Page.empty(pageable)
                : employeeRepository.searchEmployees(q == null || q.isBlank() ? null : q.trim(),
                        null, null, null, null, "ACTIVE", null, null, null, rmg.getId(), null, 1, ids, pageable);

        return RmgTeamDTO.builder()
                .content(members.getContent().stream()
                        .map(e -> RmgTeamDTO.MemberDTO.builder()
                                .id(e.getId())
                                .employeeId(e.getEmployeeId())
                                .firstName(e.getFirstName())
                                .lastName(e.getLastName())
                                .email(e.getEmail())
                                .designation(e.getDesignation())
                                .grade(e.getGrade())
                                .workforce(buckets.getOrDefault(e.getId(), WorkforceBucketService.UNASSIGNED))
                                .build())
                        .toList())
                .totalElements(members.getTotalElements())
                .totalPages(members.getTotalPages())
                .number(members.getNumber())
                .size(safeSize)
                .teamSize(teamIds.size())
                .workforce(split)
                .build();
    }

    /** RMG id -> ids of the ACTIVE employees reporting to them. */
    private Map<Long, List<Long>> activeTeams() {
        Map<Long, List<Long>> teams = new HashMap<>();
        for (Object[] pair : employeeRepository.findActiveReportingPairs()) {
            teams.computeIfAbsent((Long) pair[0], k -> new ArrayList<>()).add((Long) pair[1]);
        }
        return teams;
    }

    private static Map<String, Long> split(List<Long> ids, Map<Long, String> buckets) {
        Map<String, Long> split = new LinkedHashMap<>();
        for (String b : List.of(WorkforceBucketService.IN_PROJECT, WorkforceBucketService.ON_BENCH,
                WorkforceBucketService.IN_TRAINING, WorkforceBucketService.UNASSIGNED)) {
            split.put(b, 0L);
        }
        for (Long id : ids) {
            split.merge(buckets.getOrDefault(id, WorkforceBucketService.UNASSIGNED), 1L, Long::sum);
        }
        return split;
    }

    private static boolean matchesText(Object[] row, String needle) {
        String name = (row[2] + " " + row[3]).toLowerCase();
        return name.contains(needle)
                || ((String) row[1]).toLowerCase().contains(needle)
                || (row[4] != null && ((String) row[4]).toLowerCase().contains(needle));
    }

    private RmgDetailDTO toPageRow(Employee rmg, List<Long> teamIds, Map<Long, String> buckets) {
        Employee lead = rmg.getRmgManager();
        return RmgDetailDTO.builder()
                .rmgId(rmg.getId())
                .employeeId(rmg.getEmployeeId())
                .rmgName(rmg.getFirstName() + " " + rmg.getLastName())
                .email(rmg.getEmail())
                .department(rmg.getDepartment() != null ? rmg.getDepartment().getName() : null)
                .designation(rmg.getDesignation())
                .grade(rmg.getGrade())
                .location(rmg.getLocation() != null ? rmg.getLocation().getName() : null)
                .reportsToName(lead != null ? lead.getFirstName() + " " + lead.getLastName() : null)
                .reportsToEmployeeId(lead != null ? lead.getEmployeeId() : null)
                .associateCount((long) teamIds.size())
                .workforce(split(teamIds, buckets))
                .status(rmg.getEmploymentStatus())
                .build();
    }

    private RmgDetailDTO mapToRmgDetail(Employee rmg) {
        long associateCount = employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());

        return RmgDetailDTO.builder()
                .rmgId(rmg.getId())
                .employeeId(rmg.getEmployeeId())
                .rmgName(rmg.getFirstName() + " " + rmg.getLastName())
                .email(rmg.getEmail())
                .department(rmg.getDepartment() != null ? rmg.getDepartment().getName() : null)
                .designation(rmg.getDesignation())
                .associateCount(associateCount)
                .status(rmg.getEmploymentStatus())
                .build();
    }
}
