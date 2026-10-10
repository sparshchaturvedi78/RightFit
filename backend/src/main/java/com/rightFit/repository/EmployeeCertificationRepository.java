package com.rightFit.repository;

import com.rightFit.entity.EmployeeCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeCertificationRepository extends JpaRepository<EmployeeCertification, Long> {

    List<EmployeeCertification> findByEmployeeIdOrderByObtainedDateDesc(Long employeeId);

    Optional<EmployeeCertification> findByIdAndEmployeeId(Long id, Long employeeId);
}
