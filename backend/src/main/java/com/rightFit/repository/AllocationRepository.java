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

    List<Allocation> findByEmployeeIdOrderByStartDateDesc(Long employeeId);

    List<Allocation> findByProjectIdAndStatus(Long projectId, String status);

    List<Allocation> findByProjectIdOrderByStartDateDescIdDesc(Long projectId);

    Optional<Allocation> findByEmployeeIdAndProjectIdAndStatus(Long employeeId, Long projectId, String status);

    List<Allocation> findByRequirementIdAndStatus(Long requirementId, String status);

    @Query(value = "SELECT nextval('allocation_business_id_seq')", nativeQuery = true)
    Long nextAllocationSequence();
}
