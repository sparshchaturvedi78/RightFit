package com.rightFit.repository;

import com.rightFit.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeId(String employeeId);

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByUserId(Long userId);

    Page<Employee> findByEmploymentStatus(String status, Pageable pageable);

    Page<Employee> findByDepartmentId(Long departmentId, Pageable pageable);

    Page<Employee> findByRmgManagerId(Long rmgId, Pageable pageable);

    Page<Employee> findByDesignation(String designation, Pageable pageable);

    List<Employee> findByRmgManagerId(Long rmgId);

    List<Employee> findByEmploymentStatusAndRmgManagerId(String status, Long rmgId);

    @Query("SELECT e FROM Employee e WHERE " +
            "(:employeeId IS NULL OR e.employeeId LIKE CONCAT('%', CAST(:employeeId AS string), '%')) AND " +
            "(:firstName IS NULL OR e.firstName LIKE CONCAT('%', CAST(:firstName AS string), '%')) AND " +
            "(:lastName IS NULL OR e.lastName LIKE CONCAT('%', CAST(:lastName AS string), '%')) AND " +
            "(:email IS NULL OR e.email LIKE CONCAT('%', CAST(:email AS string), '%')) AND " +
            "(:status IS NULL OR e.employmentStatus = :status) AND " +
            "(:designation IS NULL OR e.designation = :designation) AND " +
            "(:departmentId IS NULL OR e.department.id = :departmentId) AND " +
            "(:rmgId IS NULL OR e.rmgManager.id = :rmgId)")
    Page<Employee> searchEmployees(
            @Param("employeeId") String employeeId,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("email") String email,
            @Param("status") String status,
            @Param("designation") String designation,
            @Param("departmentId") Long departmentId,
            @Param("rmgId") Long rmgId,
            Pageable pageable);

    long countByEmploymentStatusAndRmgManagerId(String status, Long rmgId);

    @Query("SELECT e FROM Employee e WHERE " +
            "LOWER(e.employeeId) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(e.firstName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(e.lastName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
            "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))")
    Page<Employee> quickSearch(@Param("query") String query, Pageable pageable);
}
