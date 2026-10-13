package com.rightFit.repository;

import com.rightFit.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {

    Optional<Allocation> findByAllocationId(String allocationId);

    List<Allocation> findByEmployeeIdAndStatus(Long employeeId, String status);

    /** Employees with an ACTIVE allocation on an ACTIVE project (all, or just the given ones). */
    @Query("SELECT DISTINCT a.employee.id FROM Allocation a WHERE a.status = 'ACTIVE' AND a.project.status = 'ACTIVE'")
    List<Long> findEmployeeIdsInActiveProjects();

    @Query("SELECT DISTINCT a.employee.id FROM Allocation a WHERE a.status = 'ACTIVE' AND a.project.status = 'ACTIVE' " +
            "AND a.employee.id IN :ids")
    List<Long> findEmployeeIdsInActiveProjects(@org.springframework.data.repository.query.Param("ids") java.util.Collection<Long> ids);

    /** Active allocations of one project, with the employee loaded (Admin project team view). */
    @Query("SELECT a FROM Allocation a JOIN FETCH a.employee WHERE a.project.id = :projectId AND a.status = 'ACTIVE'")
    List<Allocation> findActiveWithEmployeeByProjectId(@org.springframework.data.repository.query.Param("projectId") Long projectId);

    List<Allocation> findByEmployeeIdOrderByStartDateDesc(Long employeeId);

    List<Allocation> findByProjectIdAndStatus(Long projectId, String status);

    List<Allocation> findByProjectIdOrderByStartDateDescIdDesc(Long projectId);

    Optional<Allocation> findByEmployeeIdAndProjectIdAndStatus(Long employeeId, Long projectId, String status);

    List<Allocation> findByRequirementIdAndStatus(Long requirementId, String status);

    @Query(value = "SELECT nextval('allocation_business_id_seq')", nativeQuery = true)
    Long nextAllocationSequence();
}
