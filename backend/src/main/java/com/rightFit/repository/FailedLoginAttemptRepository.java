package com.rightFit.repository;

import com.rightFit.entity.FailedLoginAttempt;
import com.rightFit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FailedLoginAttemptRepository extends JpaRepository<FailedLoginAttempt, Long> {

    Optional<FailedLoginAttempt> findByEmail(String email);

    Optional<FailedLoginAttempt> findByUser(User user);

    /** Accounts currently locked after failed sign-ins (lock still in the future). */
    long countByLockedUntilAfter(java.time.LocalDateTime now);

    /** Failed-sign-in records for a page of accounts, in one query. */
    java.util.List<FailedLoginAttempt> findByEmailIn(java.util.Collection<String> emails);

    void deleteByEmail(String email);

    void deleteByUser(User user);
}
