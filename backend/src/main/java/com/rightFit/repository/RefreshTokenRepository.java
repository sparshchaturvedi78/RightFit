package com.rightFit.repository;

import com.rightFit.entity.RefreshToken;
import com.rightFit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenValueAndIsRevokedFalse(String tokenValue);

    Optional<RefreshToken> findByTokenValue(String tokenValue);

    void deleteByUser(User user);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    void deleteByUserAndIsRevokedTrue(User user);
}
