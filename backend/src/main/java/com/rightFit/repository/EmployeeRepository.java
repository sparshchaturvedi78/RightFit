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
            // Workforce bucket: resolved to a list of ids by WorkforceBucketService (a predicate here was far too heavy).
            "(:wfFilter = 0 OR e.id IN :wfIds)")
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
            @Param("wfFilter") int wfFilter,
            @Param("wfIds") java.util.Collection<Long> wfIds,
            Pageable pageable);

    /** [id, allocationStatus, poolStatus] of every ACTIVE employee — the inputs of the workforce buckets. */
    @Query("SELECT e.id, e.allocationStatus, e.poolStatus FROM Employee e WHERE e.employmentStatus = 'ACTIVE'")
    List<Object[]> findActiveEmployeeWorkflags();

    long countByEmploymentStatusAndRmgManagerId(String status, Long rmgId);

    /**
     * Admin RMG page: [id, employeeId, firstName, lastName, email, employmentStatus] of every RMG — anyone holding the
     * RMG role (deactivating an RMG deactivates the role but keeps it), plus any non-Admin someone still reports to.
     */
    @Query("SELECT e.id, e.employeeId, e.firstName, e.lastName, e.email, e.employmentStatus FROM Employee e WHERE " +
            "EXISTS (SELECT 1 FROM UserRole ur WHERE ur.user = e.user AND ur.role.code = 'RMG') OR " +
            "(EXISTS (SELECT 1 FROM Employee s WHERE s.rmgManager = e) AND NOT EXISTS " +
            "   (SELECT 1 FROM UserRole ua WHERE ua.user = e.user AND ua.isActive = true AND ua.role.code = 'ADMIN'))")
    List<Object[]> findRmgRows();

    /** [rmgId, employeeId] of every ACTIVE employee who reports to someone — team sizes for the RMG page. */
    @Query("SELECT e.rmgManager.id, e.id FROM Employee e WHERE e.employmentStatus = 'ACTIVE' AND e.rmgManager IS NOT NULL")
    List<Object[]> findActiveReportingPairs();

    /** [rmgId, active report count] for RMGs who have left but whom ACTIVE employees still report to. */
    @Query("SELECT e.rmgManager.id, COUNT(e) FROM Employee e WHERE e.employmentStatus = 'ACTIVE' " +
            "AND e.rmgManager.employmentStatus <> 'ACTIVE' GROUP BY e.rmgManager.id")
    List<Object[]> countActiveReportsOfInactiveRmgs();

    /** One page of RMGs with what their rows show, in a single query. */
    @EntityGraph(attributePaths = {"department", "location", "rmgManager"})
    @Query("SELECT e FROM Employee e WHERE e.id IN :ids")
    List<Employee> findWithDetailsByIdIn(@Param("ids") java.util.Collection<Long> ids);

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
