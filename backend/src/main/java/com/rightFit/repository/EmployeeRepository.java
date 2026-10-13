package com.rightFit.repository;

import com.rightFit.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmployeeId(String employeeId);

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByUserId(Long userId);

    Page<Employee> findByEmploymentStatus(String status, Pageable pageable);

    Page<Employee> findByDepartmentId(Long departmentId, Pageable pageable);

    Page<Employee> findByRmgManagerId(Long rmgId, Pageable pageable);

    Page<Employee> findByDesignation(String designation, Pageable pageable);

    List<Employee> findByRmgManagerId(Long rmgId);

    List<Employee> findByEmploymentStatusAndRmgManagerId(String status, Long rmgId);

    @Query("SELECT e FROM Employee e WHERE " +
            "(:q IS NULL OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(e.email) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))) AND " +
            "(:employeeId IS NULL OR e.employeeId LIKE CONCAT('%', CAST(:employeeId AS string), '%')) AND " +
            "(:firstName IS NULL OR e.firstName LIKE CONCAT('%', CAST(:firstName AS string), '%')) AND " +
            "(:lastName IS NULL OR e.lastName LIKE CONCAT('%', CAST(:lastName AS string), '%')) AND " +
            "(:email IS NULL OR e.email LIKE CONCAT('%', CAST(:email AS string), '%')) AND " +
            "(:status IS NULL OR e.employmentStatus = :status) AND " +
            "(:designation IS NULL OR e.designation = :designation) AND " +
            "(:departmentId IS NULL OR e.department.id = :departmentId) AND " +
            "(:locationId IS NULL OR e.location.id = :locationId) AND " +
            "(:rmgId IS NULL OR e.rmgManager.id = :rmgId) AND " +
            "(:role IS NULL OR EXISTS (SELECT 1 FROM UserRole ur WHERE ur.user = e.user AND ur.isActive = true " +
            "   AND ur.role.code = CAST(:role AS string))) AND " +
            // Workforce bucket (AdminDashboardService): project > training > bench/pool > unassigned, active only.
            "(:workforce IS NULL OR (e.employmentStatus = 'ACTIVE' AND (" +
            "   (CAST(:workforce AS string) = 'IN_PROJECT' AND e.allocationStatus = 'ALLOCATED') OR " +
            "   (CAST(:workforce AS string) = 'IN_TRAINING' AND e.allocationStatus <> 'ALLOCATED' AND " + ACTIVE_TRAINING + ") OR " +
            "   (CAST(:workforce AS string) = 'ON_BENCH' AND e.allocationStatus <> 'ALLOCATED' AND NOT " + ACTIVE_TRAINING +
            "       AND (" + CURRENT_BENCH + " OR e.poolStatus = 'IN_RESOURCE_POOL')) OR " +
            "   (CAST(:workforce AS string) = 'UNASSIGNED' AND e.allocationStatus <> 'ALLOCATED' AND NOT " + ACTIVE_TRAINING +
            "       AND NOT " + CURRENT_BENCH + " AND (e.poolStatus IS NULL OR e.poolStatus <> 'IN_RESOURCE_POOL')))))")
    // Admin Employees list: load the associations every row shows in the same query (the database is remote,
    // so per-row lazy loads made each page take seconds).
    @EntityGraph(attributePaths = {"department", "location", "rmgManager", "user", "preferences"})
    Page<Employee> searchEmployees(
            @Param("q") String q,
            @Param("employeeId") String employeeId,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("email") String email,
            @Param("status") String status,
            @Param("designation") String designation,
            @Param("departmentId") Long departmentId,
            @Param("locationId") Long locationId,
            @Param("rmgId") Long rmgId,
            @Param("role") String role,
            @Param("workforce") String workforce,
            Pageable pageable);

    /** An assigned / running training that hasn't been passed or failed yet. */
    String ACTIVE_TRAINING = "EXISTS (SELECT 1 FROM TrainingAssignment ta WHERE ta.employee = e " +
            "AND ta.assignmentStatus IN ('ASSIGNED', 'IN_PROGRESS') " +
            "AND (ta.completionStatus IS NULL OR ta.completionStatus NOT IN ('PASSED', 'FAILED')))";
    /** An open bench spell. */
    String CURRENT_BENCH = "EXISTS (SELECT 1 FROM BenchHistory bh WHERE bh.employee = e AND bh.isCurrent = true)";

    long countByEmploymentStatusAndRmgManagerId(String status, Long rmgId);

    /** Filter dropdown on the Admin Employees page. */
    @Query("SELECT DISTINCT e.designation FROM Employee e WHERE e.designation IS NOT NULL ORDER BY e.designation")
    List<String> findDistinctDesignations();

    /** Availability restoration job (Associate phase): due for restore, and still active - an exited
     * employee's stale availableFromDate must never be acted on (EmployeeExitService clears it anyway,
     * this filter is defense in depth, not the primary fix). */
    @Query("SELECT e FROM Employee e WHERE e.employmentStatus = 'ACTIVE' AND e.availabilityStatus = 'UNAVAILABLE' " +
            "AND e.availableFromDate IS NOT NULL AND e.availableFromDate <= :today")
    List<Employee> findDueForAvailabilityRestoration(@Param("today") java.time.LocalDate today);

    /**
     * Resource Pool listing (RMG phase): unlike searchUsers' rmgId filter (exact match only, used
     * for Admin's "find this RMG's roster"), pool visibility also includes employees with no RMG
     * assigned yet - same "unassigned -> visible to any RMG" rule used for allocation review.
     */
    long countByEmploymentStatusAndPoolStatus(String employmentStatus, String poolStatus);

    long countByEmploymentStatus(String employmentStatus);

    List<Employee> findByAllocationStatus(String allocationStatus);

    /** An RMG is anyone holding the active RMG role, plus anyone still set as another employee's RMG manager. */
    @Query("SELECT COUNT(DISTINCT e.id) FROM Employee e " +
            "LEFT JOIN e.user u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r " +
            "WHERE (r.code = 'RMG' AND ur.isActive = true) " +
            "OR e.id IN (SELECT s.rmgManager.id FROM Employee s WHERE s.rmgManager IS NOT NULL)")
    long countDistinctRmgs();

    @Query("SELECT DISTINCT e FROM Employee e " +
            "LEFT JOIN e.user u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r " +
            "WHERE (r.code = 'RMG' AND ur.isActive = true) " +
            "OR e.id IN (SELECT s.rmgManager.id FROM Employee s WHERE s.rmgManager IS NOT NULL)")
    List<Employee> findAllRmgs();

    /** Admin Dashboard: an active employee still assigned to an RMG who has since gone INACTIVE. */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.employmentStatus = 'ACTIVE' AND e.rmgManager.employmentStatus = 'INACTIVE'")
    long countPendingRmgReplacements();

    @Query("SELECT e FROM Employee e WHERE e.employmentStatus = 'ACTIVE' AND e.poolStatus = 'IN_RESOURCE_POOL' AND " +
            "(:rmgId IS NULL OR e.rmgManager.id = :rmgId OR e.rmgManager IS NULL) AND " +
            "(:query IS NULL OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "   LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "   LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) AND " +
            "(:grade IS NULL OR e.grade = :grade) AND " +
            "(:departmentId IS NULL OR e.department.id = :departmentId)")
    Page<Employee> findResourcePool(
            @Param("rmgId") Long rmgId,
            @Param("query") String query,
            @Param("grade") String grade,
            @Param("departmentId") Long departmentId,
            Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE " +
            "LOWER(e.employeeId) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))")
    Page<Employee> quickSearch(@Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT e FROM Employee e " +
            "LEFT JOIN e.user u " +
            "LEFT JOIN u.userRoles ur " +
            "LEFT JOIN ur.role r " +
            "WHERE (:query IS NULL OR " +
            "   LOWER(e.employeeId) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "   LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "   LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "   LOWER(e.email) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) " +
            "AND (:role IS NULL OR (UPPER(r.name) = UPPER(CAST(:role AS string)) AND ur.isActive = true)) " +
            "AND (:minExperience IS NULL OR e.yearsOfExperience >= :minExperience) " +
            "AND (:maxExperience IS NULL OR e.yearsOfExperience <= :maxExperience) " +
            "AND (:employmentStatus IS NULL OR e.employmentStatus = :employmentStatus) " +
            "AND (:allocationStatus IS NULL OR e.allocationStatus = :allocationStatus) " +
            "AND (:availabilityStatus IS NULL OR e.availabilityStatus = :availabilityStatus) " +
            "AND (:poolStatus IS NULL OR e.poolStatus = :poolStatus) " +
            "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
            "AND (:locationId IS NULL OR e.location.id = :locationId) " +
            "AND (:designation IS NULL OR e.designation = :designation) " +
            "AND (:domain IS NULL OR e.domain = :domain) " +
            "AND (:grade IS NULL OR e.grade = :grade) " +
            "AND (:rmgId IS NULL OR e.rmgManager.id = :rmgId)")
    Page<Employee> searchUsers(
            @Param("query") String query,
            @Param("role") String role,
            @Param("minExperience") Double minExperience,
            @Param("maxExperience") Double maxExperience,
            @Param("employmentStatus") String employmentStatus,
            @Param("allocationStatus") String allocationStatus,
            @Param("availabilityStatus") String availabilityStatus,
            @Param("poolStatus") String poolStatus,
            @Param("departmentId") Long departmentId,
            @Param("locationId") Long locationId,
            @Param("designation") String designation,
            @Param("domain") String domain,
            @Param("grade") String grade,
            @Param("rmgId") Long rmgId,
            Pageable pageable);
}
