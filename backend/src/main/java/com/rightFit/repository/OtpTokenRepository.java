package com.rightFit.repository;

import com.rightFit.entity.OtpToken;
import com.rightFit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findByOtpCodeAndUserAndIsUsedFalse(String otpCode, User user);

    Optional<OtpToken> findByOtpCodeAndEmail(String otpCode, String email);

    List<OtpToken> findByUserAndPurposeAndIsUsedFalse(User user, String purpose);

    List<OtpToken> findByUserAndIsUsedFalseAndExpiresAtAfter(User user, LocalDateTime now);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    void deleteByUserAndPurpose(User user, String purpose);
}
