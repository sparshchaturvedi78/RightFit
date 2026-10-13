package com.rightFit.repository;

import com.rightFit.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(Long projectId);

    List<ProjectMember> findByProjectId(Long projectId);

    List<ProjectMember> findByEmployeeIdAndIsActiveTrue(Long employeeId);

    Optional<ProjectMember> findByProjectIdAndEmployeeId(Long projectId, Long employeeId);

    long countByProjectManagerIdAndIsActiveTrue(Long managerId);

    /** Employees who are currently a member of an ACTIVE project (all, or just the given ones). */
    @org.springframework.data.jpa.repository.Query(
            "SELECT DISTINCT pm.employee.id FROM ProjectMember pm WHERE pm.isActive = true AND pm.project.status = 'ACTIVE'")
    List<Long> findEmployeeIdsInActiveProjects();

    @org.springframework.data.jpa.repository.Query(
            "SELECT DISTINCT pm.employee.id FROM ProjectMember pm WHERE pm.isActive = true AND pm.project.status = 'ACTIVE' " +
            "AND pm.employee.id IN :ids")
    List<Long> findEmployeeIdsInActiveProjects(@org.springframework.data.repository.query.Param("ids") java.util.Collection<Long> ids);

    @org.springframework.data.jpa.repository.Query(
            "SELECT pm FROM ProjectMember pm JOIN FETCH pm.project WHERE pm.employee.id = :employeeId AND pm.isActive = true")
    List<ProjectMember> findActiveWithProjectByEmployeeId(@org.springframework.data.repository.query.Param("employeeId") Long employeeId);
}
