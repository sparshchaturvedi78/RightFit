package com.rightFit.repository;

import com.rightFit.entity.Interview;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    Optional<Interview> findByInterviewId(String interviewId);

    List<Interview> findByCandidateApplicationIdOrderByScheduledAtAscIdAsc(Long candidateApplicationId);

    List<Interview> findByEmployeeIdOrderByScheduledAtDesc(Long employeeId);

    List<Interview> findByInterviewerIdOrderByScheduledAtDesc(Long interviewerId);

    List<Interview> findByCandidateApplicationIdAndStatusIn(Long candidateApplicationId, Collection<String> statuses);

    /** Every interview on the given requirements, newest first (for the coordinators and interviewers on them). */
    @Query("SELECT i FROM Interview i WHERE i.requirement.id IN :requirementIds ORDER BY i.scheduledAt DESC")
    List<Interview> findByRequirementIds(@Param("requirementIds") Collection<Long> requirementIds);

    long countByCandidateApplicationId(Long candidateApplicationId);

    @Query(value = "SELECT nextval('interview_business_id_seq')", nativeQuery = true)
    Long nextInterviewSequence();

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.requirement.project.manager.id = :managerId " +
            "AND i.status IN ('SCHEDULED', 'ACCEPTED') AND i.scheduledAt >= :from")
    long countUpcomingForManager(@Param("managerId") Long managerId, @Param("from") LocalDateTime from);

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.employee.id = :employeeId " +
            "AND i.status IN ('SCHEDULED', 'ACCEPTED') AND i.scheduledAt >= :from")
    long countUpcomingForEmployee(@Param("employeeId") Long employeeId, @Param("from") LocalDateTime from);

    /** Every interview on a requirement the manager runs, newest first. */
    @Query("SELECT i FROM Interview i WHERE i.requirement.project.manager.id = :managerId ORDER BY i.scheduledAt DESC")
    List<Interview> findByProjectManagerId(@Param("managerId") Long managerId);

    /** Admin Dashboard: upcoming interviews organization-wide, soonest first. */
    @Query("SELECT i FROM Interview i WHERE i.status IN ('SCHEDULED', 'ACCEPTED') AND i.scheduledAt >= :from " +
            "ORDER BY i.scheduledAt ASC")
    List<Interview> findUpcoming(@Param("from") LocalDateTime from, Pageable pageable);
}
