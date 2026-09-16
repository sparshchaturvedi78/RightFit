package com.rightFit.repository;

import com.rightFit.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {

    @Query(value = "SELECT * FROM password_history WHERE user_id = :userId ORDER BY changed_at DESC LIMIT :limit",
           nativeQuery = true)
    List<PasswordHistory> findRecentPasswordsByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    List<PasswordHistory> findByUserIdOrderByChangedAtDesc(Long userId);
}
