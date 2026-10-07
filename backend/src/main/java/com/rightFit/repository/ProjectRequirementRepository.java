package com.rightFit.repository;

import com.rightFit.entity.ProjectRequirement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRequirementRepository extends JpaRepository<ProjectRequirement, Long> {

    Optional<ProjectRequirement> findByRequirementId(String requirementId);

    List<ProjectRequirement> findByProjectId(Long projectId);

    @Query("SELECT r.status, COUNT(r) FROM ProjectRequirement r WHERE r.project.manager.id = :managerId GROUP BY r.status")
    List<Object[]> countByStatusForManager(@Param("managerId") Long managerId);

    @Query("SELECT r FROM ProjectRequirement r WHERE r.project.manager.id = :managerId")
    List<ProjectRequirement> findByProjectManagerId(@Param("managerId") Long managerId);

    /**
     * scopeEmployeeId, when non-null, restricts results to requirements of projects that the employee
     * manages AND has claimed, plus requirements on which the employee holds an active responsibility.
     * Admin callers pass null to see everything.
     */
    @Query("SELECT r FROM ProjectRequirement r WHERE " +
            "(:projectId IS NULL OR r.project.projectId = :projectId) AND " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:priority IS NULL OR r.priority = :priority) AND " +
            "(:positionTitle IS NULL OR LOWER(r.positionTitle) LIKE LOWER(CONCAT('%', CAST(:positionTitle AS string), '%'))) AND " +
            "(:scopeEmployeeId IS NULL OR (r.project.manager.id = :scopeEmployeeId AND r.project.managerClaimed = true) " +
            "OR EXISTS (SELECT 1 FROM RequirementAssignment ra WHERE ra.requirement = r " +
            "AND ra.employee.id = :scopeEmployeeId AND ra.isActive = true))")
    Page<ProjectRequirement> searchRequirements(
            @Param("projectId") String projectId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("positionTitle") String positionTitle,
            @Param("scopeEmployeeId") Long scopeEmployeeId,
            Pageable pageable);

    @Query(value = "SELECT nextval('requirement_business_id_seq')", nativeQuery = true)
    Long nextRequirementSequence();
}
