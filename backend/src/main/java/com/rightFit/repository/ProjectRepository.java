package com.rightFit.repository;

import com.rightFit.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByProjectId(String projectId);

    Page<Project> findByStatus(String status, Pageable pageable);

    Page<Project> findByManagerId(Long managerId, Pageable pageable);

    List<Project> findByManagerId(Long managerId);

    List<Project> findByStatusAndManagerId(String status, Long managerId);

    @Query("SELECT p FROM Project p WHERE " +
            "(:projectId IS NULL OR p.projectId LIKE CONCAT('%', CAST(:projectId AS string), '%')) AND " +
            "(:projectName IS NULL OR p.projectName LIKE CONCAT('%', CAST(:projectName AS string), '%')) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:managerId IS NULL OR p.manager.id = :managerId) AND " +
            "(:clientName IS NULL OR p.clientName LIKE CONCAT('%', CAST(:clientName AS string), '%'))")
    Page<Project> searchProjects(
            @Param("projectId") String projectId,
            @Param("projectName") String projectName,
            @Param("status") String status,
            @Param("managerId") Long managerId,
            @Param("clientName") String clientName,
            Pageable pageable);
}
