package com.rightFit.repository;

import com.rightFit.entity.AllocationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationEventRepository extends JpaRepository<AllocationEvent, Long> {

    List<AllocationEvent> findByAllocationIdOrderByCreatedAtAscIdAsc(Long allocationId);
}
