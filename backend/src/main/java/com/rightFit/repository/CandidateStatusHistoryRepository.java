package com.rightFit.repository;

import com.rightFit.entity.CandidateStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateStatusHistoryRepository extends JpaRepository<CandidateStatusHistory, Long> {

    List<CandidateStatusHistory> findByCandidateApplicationIdOrderByChangedAtAscIdAsc(Long candidateApplicationId);
}
