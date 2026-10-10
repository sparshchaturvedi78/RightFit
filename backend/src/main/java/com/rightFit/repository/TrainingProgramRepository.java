package com.rightFit.repository;

import com.rightFit.entity.TrainingProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Long> {

    Optional<TrainingProgram> findByProgramId(String programId);

    List<TrainingProgram> findByIsActiveTrueOrderByProgramNameAsc();

    List<TrainingProgram> findAllByOrderByProgramNameAsc();

    @Query(value = "SELECT nextval('training_program_business_id_seq')", nativeQuery = true)
    Long nextProgramSequence();
}
