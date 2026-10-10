package com.rightFit.repository;

import com.rightFit.entity.RequirementAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequirementAssignmentRepository extends JpaRepository<RequirementAssignment, Long> {

    List<RequirementAssignment> findByRequirementIdAndIsActiveTrue(Long requirementId);

    List<RequirementAssignment> findByRequirementIdAndResponsibilityTypeAndIsActiveTrue(
            Long requirementId, String responsibilityType);

    Optional<RequirementAssignment> findByIdAndRequirementIdAndIsActiveTrue(Long id, Long requirementId);

    boolean existsByRequirementIdAndEmployeeIdAndResponsibilityTypeAndIsActiveTrue(
            Long requirementId, Long employeeId, String responsibilityType);

    boolean existsByRequirementIdAndEmployeeIdAndIsActiveTrue(Long requirementId, Long employeeId);

    boolean existsByEmployeeIdAndResponsibilityTypeAndIsActiveTrue(Long employeeId, String responsibilityType);

    List<RequirementAssignment> findByEmployeeIdAndIsActiveTrue(Long employeeId);

    boolean existsByRequirementProjectIdAndEmployeeIdAndIsActiveTrue(Long projectId, Long employeeId);

    /** Live workload: only DRAFT/PUBLISHED requirements count, so closing, cancelling or holding one reduces it. */
    @Query("SELECT ra.employee.id, ra.responsibilityType, COUNT(ra) FROM RequirementAssignment ra " +
            "WHERE ra.isActive = true AND ra.employee.id IN :employeeIds " +
            "AND ra.requirement.status IN ('DRAFT', 'PUBLISHED') GROUP BY ra.employee.id, ra.responsibilityType")
    List<Object[]> countWorkload(@Param("employeeIds") Collection<Long> employeeIds);

    @Query("SELECT ra.employee.id, ra.responsibilityType, COUNT(ra) FROM RequirementAssignment ra " +
            "WHERE ra.isActive = true AND ra.employee.id IN :employeeIds AND ra.requirement.project.id = :projectId " +
            "AND ra.requirement.status IN ('DRAFT', 'PUBLISHED') GROUP BY ra.employee.id, ra.responsibilityType")
    List<Object[]> countWorkloadInProject(@Param("employeeIds") Collection<Long> employeeIds,
                                          @Param("projectId") Long projectId);

    List<RequirementAssignment> findByRequirementIdAndEmployeeIdAndIsActiveTrue(Long requirementId, Long employeeId);
}
