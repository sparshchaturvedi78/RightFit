package com.rightFit.repository;

import com.rightFit.entity.EmployeeAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeAvailabilityRepository extends JpaRepository<EmployeeAvailability, Long> {

    List<EmployeeAvailability> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    Optional<EmployeeAvailability> findByIdAndEmployeeId(Long id, Long employeeId);

    boolean existsByEmployeeIdAndVerificationStatus(Long employeeId, String verificationStatus);

    @Query("SELECT a FROM EmployeeAvailability a WHERE a.verificationStatus = 'PENDING' ORDER BY a.createdAt ASC")
    List<EmployeeAvailability> findAllPending();

    @Query("SELECT a FROM EmployeeAvailability a WHERE a.verificationStatus = 'PENDING' AND " +
            "(a.employee.rmgManager.id = :rmgId OR a.employee.rmgManager IS NULL) ORDER BY a.createdAt ASC")
    List<EmployeeAvailability> findPendingForRmg(@Param("rmgId") Long rmgId);
}
