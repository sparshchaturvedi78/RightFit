package com.rightFit.repository;

import com.rightFit.entity.BenchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BenchHistoryRepository extends JpaRepository<BenchHistory, Long> {

    Optional<BenchHistory> findByEmployeeIdAndIsCurrentTrue(Long employeeId);

    List<BenchHistory> findByEmployeeIdOrderByBenchStartDateDesc(Long employeeId);

    @Query("SELECT b FROM BenchHistory b WHERE b.isCurrent = true ORDER BY b.benchStartDate ASC")
    List<BenchHistory> findAllCurrent();

    @Query("SELECT b FROM BenchHistory b WHERE b.isCurrent = true AND " +
            "(b.employee.rmgManager.id = :rmgId OR b.employee.rmgManager IS NULL) ORDER BY b.benchStartDate ASC")
    List<BenchHistory> findCurrentForRmg(@Param("rmgId") Long rmgId);
}
