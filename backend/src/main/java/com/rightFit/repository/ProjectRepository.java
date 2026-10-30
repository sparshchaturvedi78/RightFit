package com.rightFit.repository;

import com.rightFit.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByProjectId(String projectId);

    Page<Project> findByStatus(String status, Pageable pageable);

    Page<Project> findByManagerId(Long managerId, Pageable pageable);

    List<Project> findByManagerIsNullAndStatus(String status);

    List<Project> findByManagerId(Long managerId);

    List<Project> findByStatusAndManagerId(String status, Long managerId);

    @Query("SELECT p FROM Project p LEFT JOIN p.manager m WHERE " +
            // Free text: project ID, name, client, or the manager's name / employee ID (case-insensitive).
            "(:q IS NULL OR LOWER(p.projectId) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(p.projectName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(COALESCE(p.clientName, '')) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(COALESCE(m.employeeId, '')) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(CONCAT(COALESCE(m.firstName, ''), ' ', COALESCE(m.lastName, ''))) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))) AND " +
            "(:projectId IS NULL OR p.projectId LIKE CONCAT('%', CAST(:projectId AS string), '%')) AND " +
            "(:projectName IS NULL OR p.projectName LIKE CONCAT('%', CAST(:projectName AS string), '%')) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:managerId IS NULL OR m.id = :managerId) AND " +
            "(:clientName IS NULL OR p.clientName LIKE CONCAT('%', CAST(:clientName AS string), '%')) AND " +
            "(:claimed IS NULL OR p.managerClaimed = :claimed) AND " +
            "(:managerStatus IS NULL OR " +
            // UNASSIGNED: no manager. VACANT: no manager or one who is not active (a project that can take a new manager).
            "   (:managerStatus = 'UNASSIGNED' AND m IS NULL) OR " +
            "   (:managerStatus = 'VACANT' AND (m IS NULL OR m.employmentStatus <> 'ACTIVE')) OR " +
            "   (:managerStatus NOT IN ('UNASSIGNED', 'VACANT') AND m.employmentStatus = CAST(:managerStatus AS string)))")
    // The manager is shown on every row: load it in the same query (the database is remote and slow).
    @EntityGraph(attributePaths = {"manager"})
    Page<Project> searchProjects(
            @Param("q") String q,
            @Param("projectId") String projectId,
            @Param("projectName") String projectName,
            @Param("status") String status,
            @Param("managerId") Long managerId,
            @Param("clientName") String clientName,
            @Param("claimed") Boolean claimed,
            @Param("managerStatus") String managerStatus,
            Pageable pageable);

    @Query("SELECT p FROM Project p WHERE " +
            "LOWER(p.projectId) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(p.projectName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))")
    Page<Project> quickSearch(@Param("query") String query, Pageable pageable);

    long countByStatus(String status);

    /** Managers of ACTIVE projects (all, or just the given ones): a manager with a live project is "in a project". */
    @Query("SELECT DISTINCT p.manager.id FROM Project p WHERE p.status = 'ACTIVE'")
    List<Long> findManagerIdsOfActiveProjects();

    /** [managerId, active project count] for managers who have left but still manage ACTIVE projects. */
    @Query("SELECT p.manager.id, COUNT(p) FROM Project p WHERE p.status = 'ACTIVE' " +
            "AND p.manager.employmentStatus <> 'ACTIVE' GROUP BY p.manager.id")
    List<Object[]> countActiveProjectsOfInactiveManagers();

    @Query("SELECT DISTINCT p.manager.id FROM Project p WHERE p.status = 'ACTIVE' AND p.manager.id IN :ids")
    List<Long> findManagerIdsOfActiveProjects(@Param("ids") java.util.Collection<Long> ids);

    @Query("SELECT COUNT(DISTINCT p.manager.id) FROM Project p WHERE p.manager IS NOT NULL")
    long countDistinctManagers();

    /** Admin Dashboard: a project whose assigned Manager has since gone INACTIVE needs a replacement. */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.manager.employmentStatus = 'INACTIVE'")
    long countPendingManagerReplacements();
}
