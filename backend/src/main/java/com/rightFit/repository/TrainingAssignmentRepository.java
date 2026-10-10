package com.rightFit.repository;

import com.rightFit.entity.TrainingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingAssignmentRepository extends JpaRepository<TrainingAssignment, Long> {

    Optional<TrainingAssignment> findByAssignmentId(String assignmentId);

    List<TrainingAssignment> findByEmployeeIdOrderByAssignedAtDesc(Long employeeId);

    List<TrainingAssignment> findByTrainingProgramIdOrderByAssignedAtDesc(Long trainingProgramId);

    @Query("SELECT a FROM TrainingAssignment a WHERE (a.employee.rmgManager.id = :rmgId OR a.employee.rmgManager IS NULL) " +
            "ORDER BY a.assignedAt DESC")
    List<TrainingAssignment> findForRmg(@Param("rmgId") Long rmgId);

    @Query("SELECT a FROM TrainingAssignment a ORDER BY a.assignedAt DESC")
    List<TrainingAssignment> findAllOrderByAssignedAtDesc();

    @Query(value = "SELECT nextval('training_assignment_business_id_seq')", nativeQuery = true)
    Long nextAssignmentSequence();
}
