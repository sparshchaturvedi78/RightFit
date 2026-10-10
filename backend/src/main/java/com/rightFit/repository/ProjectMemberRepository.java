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
}
