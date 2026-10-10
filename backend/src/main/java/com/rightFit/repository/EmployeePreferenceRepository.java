package com.rightFit.repository;

import com.rightFit.entity.EmployeePreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeePreferenceRepository extends JpaRepository<EmployeePreference, Long> {

    Optional<EmployeePreference> findByEmployeeId(Long employeeId);
}
