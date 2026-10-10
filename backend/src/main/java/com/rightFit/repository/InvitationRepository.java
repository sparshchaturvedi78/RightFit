package com.rightFit.repository;

import com.rightFit.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByInvitationId(String invitationId);

    List<Invitation> findByEmployeeIdOrderByInvitedAtDesc(Long employeeId);

    List<Invitation> findByCandidateApplicationIdOrderByInvitedAtDesc(Long candidateApplicationId);

    List<Invitation> findByRequirementIdOrderByInvitedAtDesc(Long requirementId);

    List<Invitation> findByCandidateApplicationIdAndStatusIn(Long candidateApplicationId, Collection<String> statuses);

    @Query(value = "SELECT nextval('invitation_business_id_seq')", nativeQuery = true)
    Long nextInvitationSequence();

    @Query("SELECT COUNT(i) FROM Invitation i WHERE i.requirement.project.manager.id = :managerId " +
            "AND i.status IN ('SENT', 'VIEWED')")
    long countPendingForManager(@Param("managerId") Long managerId);
}
