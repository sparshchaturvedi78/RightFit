package com.rightFit.repository;

import com.rightFit.entity.ResourcePoolEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourcePoolEntryRepository extends JpaRepository<ResourcePoolEntry, Long> {

    Optional<ResourcePoolEntry> findByEmployeeIdAndIsCurrentTrue(Long employeeId);

    List<ResourcePoolEntry> findByEmployeeIdOrderByEntryDateDesc(Long employeeId);

    @Query("SELECT e FROM ResourcePoolEntry e WHERE e.isCurrent = true ORDER BY e.entryDate ASC")
    List<ResourcePoolEntry> findAllCurrent();

    @Query("SELECT e FROM ResourcePoolEntry e WHERE e.isCurrent = true AND " +
            "(e.employee.rmgManager.id = :rmgId OR e.employee.rmgManager IS NULL) ORDER BY e.entryDate ASC")
    List<ResourcePoolEntry> findCurrentForRmg(@Param("rmgId") Long rmgId);
}
