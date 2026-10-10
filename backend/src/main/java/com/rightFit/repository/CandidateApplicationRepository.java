package com.rightFit.repository;

import com.rightFit.entity.CandidateApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateApplicationRepository extends JpaRepository<CandidateApplication, Long> {

    Optional<CandidateApplication> findByApplicationId(String applicationId);

    Optional<CandidateApplication> findByRequirementIdAndEmployeeId(Long requirementId, Long employeeId);

    List<CandidateApplication> findByRequirementIdOrderByCreatedAtDesc(Long requirementId);

    List<CandidateApplication> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    boolean existsByEmployeeIdAndStatusInAndIdNot(Long employeeId, Collection<String> statuses, Long excludedId);

    @Query(value = "SELECT nextval('candidate_business_id_seq')", nativeQuery = true)
    Long nextCandidateSequence();

    @Query("SELECT c.status, COUNT(c) FROM CandidateApplication c " +
            "WHERE c.requirement.project.manager.id = :managerId AND c.archived = false GROUP BY c.status")
    List<Object[]> countByStatusForManager(@Param("managerId") Long managerId);

    @Query("SELECT c.status, COUNT(c) FROM CandidateApplication c WHERE c.archived = false GROUP BY c.status")
    List<Object[]> countByStatusAll();

    @Query("SELECT c FROM CandidateApplication c WHERE c.requirement.project.id = :projectId")
    List<CandidateApplication> findByProjectId(@Param("projectId") Long projectId);
}
