package com.rightFit.repository;

import com.rightFit.entity.AllocationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllocationRequestRepository extends JpaRepository<AllocationRequest, Long> {

    Optional<AllocationRequest> findByRequestId(String requestId);

    List<AllocationRequest> findByStatusOrderBySubmittedAtAsc(String status);

    List<AllocationRequest> findByCandidateApplicationIdOrderBySubmittedAtDesc(Long candidateApplicationId);

    List<AllocationRequest> findByEmployeeIdAndStatus(Long employeeId, String status);

    @Query("SELECT r FROM AllocationRequest r WHERE r.project.manager.id = :managerId ORDER BY r.submittedAt DESC")
    List<AllocationRequest> findByProjectManager(@Param("managerId") Long managerId);

    @Query(value = "SELECT nextval('allocation_request_business_id_seq')", nativeQuery = true)
    Long nextRequestSequence();

    @Query("SELECT r.status, COUNT(r) FROM AllocationRequest r WHERE r.project.manager.id = :managerId GROUP BY r.status")
    List<Object[]> countByStatusForManager(@Param("managerId") Long managerId);

    @Query("SELECT r.status, COUNT(r) FROM AllocationRequest r WHERE " +
            "(r.employee.rmgManager.id = :rmgId OR r.employee.rmgManager IS NULL) GROUP BY r.status")
    List<Object[]> countByStatusForRmg(@Param("rmgId") Long rmgId);

    @Query("SELECT r.status, COUNT(r) FROM AllocationRequest r GROUP BY r.status")
    List<Object[]> countByStatusAll();
}
