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

    void deleteByEmail(String email);

    void deleteByUser(User user);
}
