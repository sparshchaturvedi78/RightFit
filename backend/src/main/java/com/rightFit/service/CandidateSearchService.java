package com.rightFit.service;

import com.rightFit.dto.CandidateDtos.EmployeeCandidateDTO;
import com.rightFit.dto.CandidateDtos.PreferenceDTO;
import com.rightFit.dto.CandidateDtos.ProjectLookupDTO;
import com.rightFit.dto.CandidateDtos.SkillLevelDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.Employee;
import com.rightFit.entity.EmployeeCertification;
import com.rightFit.entity.EmployeePreference;
import com.rightFit.entity.EmployeeSkill;
import com.rightFit.entity.Location;
import com.rightFit.entity.UserRole;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.ProjectRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Manager Phase 4: employee search and candidate discovery (BRD 10, 26). Never exposes salary. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateSearchService {

    public record Criteria(String q, String employeeId, String name, List<String> skills, Integer minProficiency,
                           Double minExperience, Double maxExperience, String location, String certification,
                           String grade, String domain, String technology, String availabilityStatus,
                           String poolStatus, String allocationStatus, boolean availableOnly,
                           String preferredTechnology, String preferredDomain, String preferredWorkMode,
                           String preferredLocation) {
    }

    private final EmployeeRepository employeeRepository;
    private final AllocationRepository allocationRepository;
    private final ProjectRepository projectRepository;
    private final RequirementAssignmentRepository assignmentRepository;
    private final RequirementAccessGuard accessGuard;
    private final JdbcTemplate jdbcTemplate;

    public Page<EmployeeCandidateDTO> search(Criteria criteria, Pageable pageable) {
        assertMaySearch();
        return employeeRepository.findAll(toSpecification(criteria), pageable).map(this::toDTO);
    }

    public EmployeeCandidateDTO getProfile(String employeeId) {
        assertMaySearch();
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        if (accessGuard.isAdminAccount(employee)) {
            throw new ResourceNotFoundException("Employee", employeeId);
        }
        return toDTO(employee);
    }

    public List<ProjectLookupDTO> lookupProjects(String projectId) {
        List<ProjectLookupDTO> found = projectRepository.searchProjects(projectId, null, null, null, null, PageRequest.of(0, 20)).stream()
                .map(p -> ProjectLookupDTO.builder()
                        .projectId(p.getProjectId())
                        .projectName(p.getProjectName())
                        .status(p.getStatus())
                        .clientName(p.getClientName())
                        .managerName(CandidateWorkflowService.name(p.getManager()))
                        .build())
                .toList();
        if (found.isEmpty() && projectId != null && !projectId.isBlank()) {
            throw new ResourceNotFoundException("Project", projectId);
        }
        return found;
    }

    /** Admin, RMG and Managers may search; anyone else needs an assigned SOURCER responsibility (BRD 39). */
    private void assertMaySearch() {
        Set<String> codes = accessGuard.roleCodes();
        if (codes.contains(RequirementAccessGuard.ADMIN) || codes.contains(RequirementAccessGuard.RMG)
                || codes.contains(RequirementAccessGuard.MANAGER)) {
            return;
        }
        Employee caller = accessGuard.currentEmployee();
        if (!assignmentRepository.existsByEmployeeIdAndResponsibilityTypeAndIsActiveTrue(caller.getId(), "SOURCER")) {
            throw ProjectAccessDeniedException.responsibilityRequired("any requirement", "SOURCER");
        }
    }

    private Specification<Employee> toSpecification(Criteria c) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("employmentStatus"), "ACTIVE"));

            // Admin accounts are platform administrators, never candidates.
            Subquery<Long> adminSq = query.subquery(Long.class);
            Root<UserRole> adminRole = adminSq.from(UserRole.class);
            adminSq.select(adminRole.<Long>get("id")).where(
                    cb.equal(adminRole.get("user"), root.get("user")),
                    cb.isTrue(adminRole.<Boolean>get("isActive")),
                    cb.equal(adminRole.get("role").get("code"), RequirementAccessGuard.ADMIN));
            predicates.add(cb.not(cb.exists(adminSq)));

            if (has(c.q())) {
                String term = like(c.q());
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("employeeId")), term),
                        cb.like(cb.lower(root.get("firstName")), term),
                        cb.like(cb.lower(root.get("lastName")), term),
                        cb.like(cb.lower(root.get("email")), term),
                        cb.like(cb.lower(cb.concat(cb.concat(root.<String>get("firstName"), " "),
                                root.<String>get("lastName"))), term)));
            }

            if (has(c.employeeId())) {
                predicates.add(cb.like(cb.lower(root.get("employeeId")), like(c.employeeId())));
            }
            if (has(c.name())) {
                predicates.add(cb.like(cb.lower(cb.concat(cb.concat(root.<String>get("firstName"), " "),
                        root.<String>get("lastName"))), like(c.name())));
            }
            if (has(c.grade())) {
                predicates.add(cb.equal(cb.lower(root.get("grade")), c.grade().toLowerCase()));
            }
            if (has(c.domain())) {
                predicates.add(cb.like(cb.lower(root.get("domain")), like(c.domain())));
            }
            if (c.minExperience() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<Double>get("yearsOfExperience"), c.minExperience()));
            }
            if (c.maxExperience() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<Double>get("yearsOfExperience"), c.maxExperience()));
            }
            if (has(c.location())) {
                Join<Employee, Location> location = root.join("location", JoinType.LEFT);
                predicates.add(cb.or(cb.like(cb.lower(location.get("name")), like(c.location())),
                        cb.like(cb.lower(location.get("city")), like(c.location()))));
            }
            if (c.availableOnly()) {
                predicates.add(cb.equal(root.get("availabilityStatus"), "AVAILABLE"));
            }
            if (has(c.availabilityStatus())) {
                predicates.add(cb.equal(root.get("availabilityStatus"), c.availabilityStatus().toUpperCase()));
            }
            if (has(c.poolStatus())) {
                predicates.add(cb.equal(root.get("poolStatus"), c.poolStatus().toUpperCase()));
            }
            if (has(c.allocationStatus())) {
                predicates.add(cb.equal(root.get("allocationStatus"), c.allocationStatus().toUpperCase()));
            }

            if (c.skills() != null) {
                for (String skill : c.skills()) {
                    if (!has(skill)) {
                        continue;
                    }
                    Subquery<Long> sq = query.subquery(Long.class);
                    Root<EmployeeSkill> es = sq.from(EmployeeSkill.class);
                    List<Predicate> sub = new ArrayList<>();
                    sub.add(cb.equal(es.get("employee"), root));
                    sub.add(cb.equal(cb.lower(es.get("skill").get("skillName")), skill.trim().toLowerCase()));
                    if (c.minProficiency() != null) {
                        sub.add(cb.greaterThanOrEqualTo(es.<Integer>get("proficiencyLevel"), c.minProficiency()));
                    }
                    sq.select(es.<Long>get("id")).where(sub.toArray(new Predicate[0]));
                    predicates.add(cb.exists(sq));
                }
            }
            if (has(c.technology())) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<EmployeeSkill> es = sq.from(EmployeeSkill.class);
                sq.select(es.<Long>get("id")).where(cb.equal(es.get("employee"), root),
                        cb.like(cb.lower(es.get("skill").get("skillName")), like(c.technology())));
                predicates.add(cb.exists(sq));
            }
            if (has(c.certification())) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<EmployeeCertification> ec = sq.from(EmployeeCertification.class);
                sq.select(ec.<Long>get("id")).where(cb.equal(ec.get("employee"), root),
                        cb.like(cb.lower(ec.get("certification").get("certificationName")), like(c.certification())));
                predicates.add(cb.exists(sq));
            }

            if (has(c.preferredTechnology()) || has(c.preferredDomain()) || has(c.preferredWorkMode())
                    || has(c.preferredLocation())) {
                Join<Employee, EmployeePreference> pref = root.join("preferences", JoinType.LEFT);
                if (has(c.preferredTechnology())) {
                    predicates.add(cb.like(cb.lower(pref.get("preferredTechnology")), like(c.preferredTechnology())));
                }
                if (has(c.preferredDomain())) {
                    predicates.add(cb.like(cb.lower(pref.get("preferredDomain")), like(c.preferredDomain())));
                }
                if (has(c.preferredWorkMode())) {
                    predicates.add(cb.like(cb.lower(pref.get("preferredWorkMode")), like(c.preferredWorkMode())));
                }
                if (has(c.preferredLocation())) {
                    predicates.add(cb.like(cb.lower(pref.get("preferredLocation")), like(c.preferredLocation())));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EmployeeCandidateDTO toDTO(Employee e) {
        List<Allocation> active = allocationRepository.findByEmployeeIdAndStatus(e.getId(), "ACTIVE");
        List<String> current = active.stream().map(a -> a.getProject().getProjectId()).distinct().toList();
        List<String> previous = allocationRepository.findByEmployeeIdOrderByStartDateDesc(e.getId()).stream()
                .filter(a -> "ENDED".equals(a.getStatus()))
                .map(a -> a.getProject().getProjectId())
                .distinct().toList();
        BigDecimal allocated = active.stream().map(Allocation::getHoursPerDay)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        EmployeePreference pref = e.getPreferences();
        return EmployeeCandidateDTO.builder()
                .employeeId(e.getEmployeeId())
                .name(CandidateWorkflowService.name(e))
                .email(e.getEmail())
                .phone(e.getPhone())
                .grade(e.getGrade())
                .designation(e.getDesignation())
                .domain(e.getDomain())
                .yearsOfExperience(e.getYearsOfExperience())
                .location(e.getLocation() != null ? e.getLocation().getName() : null)
                .employmentStatus(e.getEmploymentStatus())
                .allocationStatus(e.getAllocationStatus())
                .availabilityStatus(e.getAvailabilityStatus())
                .availableFromDate(e.getAvailableFromDate())
                .poolStatus(e.getPoolStatus())
                .benchDays(benchDays(e.getId()))
                .workingHoursPerDay(capacity(e))
                .allocatedHoursPerDay(allocated)
                .skills(e.getSkills() == null ? List.of() : e.getSkills().stream()
                        .map(s -> SkillLevelDTO.builder().skill(s.getSkill().getSkillName())
                                .proficiency(s.getProficiencyLevel()).yearsOfExperience(s.getYearsOfExperience()).build())
                        .sorted((a, b) -> b.getProficiency().compareTo(a.getProficiency()))
                        .toList())
                .certifications(e.getCertifications() == null ? List.of() : e.getCertifications().stream()
                        .filter(c -> !Boolean.FALSE.equals(c.getIsValid()))
                        .map(c -> c.getCertification().getCertificationName()).toList())
                .preferences(pref == null ? null : PreferenceDTO.builder()
                        .preferredTechnology(pref.getPreferredTechnology())
                        .preferredDomain(pref.getPreferredDomain())
                        .preferredLocation(pref.getPreferredLocation())
                        .preferredWorkMode(pref.getPreferredWorkMode())
                        .preferredProjectType(pref.getPreferredProjectType())
                        .build())
                .currentProjects(current)
                .previousProjects(previous)
                .build();
    }

    static BigDecimal capacity(Employee e) {
        return e.getWorkingHoursPerDay() == null ? BigDecimal.valueOf(9) : BigDecimal.valueOf(e.getWorkingHoursPerDay());
    }

    private Long benchDays(Long employeeId) {
        List<Long> days = jdbcTemplate.query(
                "SELECT GREATEST(0, (CURRENT_DATE - bench_start_date) - COALESCE(paused_days, 0)) " +
                        "FROM bench_history WHERE employee_id = ? AND is_current = TRUE LIMIT 1",
                (rs, i) -> rs.getLong(1), employeeId);
        return days.isEmpty() ? null : days.get(0);
    }

    private static boolean has(String value) {
        return value != null && !value.isBlank();
    }

    private static String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
