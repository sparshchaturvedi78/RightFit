package com.rightFit.repository;

import com.rightFit.entity.Rejection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RejectionRepository extends JpaRepository<Rejection, Long> {

    Optional<Rejection> findByRejectionId(String rejectionId);

    List<Rejection> findByEmployeeIdOrderByRejectionDateDesc(Long employeeId);

    @Query("SELECT r FROM Rejection r ORDER BY r.rejectionDate DESC")
    List<Rejection> findAllOrderByRejectionDateDesc();

    /** Same "own associates + unassigned" scoping rule used throughout the RMG phase. */
    @Query("SELECT r FROM Rejection r WHERE (r.employee.rmgManager.id = :rmgId OR r.employee.rmgManager IS NULL) " +
            "ORDER BY r.rejectionDate DESC")
    List<Rejection> findForRmg(@Param("rmgId") Long rmgId);

    @Query(value = "SELECT nextval('rejection_business_id_seq')", nativeQuery = true)
    Long nextRejectionSequence();
}
