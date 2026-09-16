package com.rightFit.service;

import com.rightFit.entity.OtpToken;
import com.rightFit.entity.User;
import com.rightFit.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.otp.reset-token-expiry-minutes:15}")
    private int resetTokenExpiryMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp(User user, String email, String purpose) {
        String otpCode = generateRandomOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

        OtpToken otpToken = OtpToken.builder()
                .user(user)
                .otpCode(otpCode)
                .email(email)
                .purpose(purpose)
                .isUsed(false)
                .expiresAt(expiryTime)
                .build();

        otpTokenRepository.save(otpToken);

        log.info("OTP generated for user: {}, purpose: {}, OTP: {}", email, purpose, otpCode);
        return otpCode;
    }

    public boolean validateOtp(String email, String otpCode, String purpose) {
        OtpToken otpToken = otpTokenRepository.findByEmailAndOtpCodeAndPurpose(email, otpCode, purpose)
                .orElse(null);

        if (otpToken == null) {
            log.warn("Invalid OTP attempt for email: {}, purpose: {}", email, purpose);
            return false;
        }

        if (otpToken.getIsUsed() != null && otpToken.getIsUsed()) {
            log.warn("OTP already used for email: {}, purpose: {}", email, purpose);
            return false;
        }

        if (LocalDateTime.now().isAfter(otpToken.getExpiresAt())) {
            log.warn("OTP expired for email: {}, purpose: {}", email, purpose);
            return false;
        }

        otpToken.setIsUsed(true);
        otpTokenRepository.save(otpToken);

        log.info("OTP validated successfully for email: {}, purpose: {}", email, purpose);
        return true;
    }

    public void invalidateOtpForEmail(String email, String purpose) {
        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);
        log.debug("OTP invalidated for email: {}, purpose: {}", email, purpose);
    }

    /**
     * Validates the OTP and, on success, issues a single-use reset token tied to the
     * same OTP record. Callers must present this token to complete the flow (e.g. step 3
     * of forgot-password), so a step cannot be skipped or called out of order.
     */
    public String validateOtpAndIssueResetToken(String email, String otpCode, String purpose) {
        OtpToken otpToken = otpTokenRepository.findByEmailAndOtpCodeAndPurpose(email, otpCode, purpose)
                .orElseThrow(() -> new RuntimeException("Invalid or expired OTP"));

        if (Boolean.TRUE.equals(otpToken.getIsUsed())) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        if (LocalDateTime.now().isAfter(otpToken.getExpiresAt())) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        String resetToken = generateSecureToken();
        otpToken.setIsUsed(true);
        otpToken.setResetToken(resetToken);
        otpToken.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes));
        otpToken.setResetTokenUsed(false);
        otpTokenRepository.save(otpToken);

        log.info("OTP validated and reset token issued for email: {}, purpose: {}", email, purpose);
        return resetToken;
    }

    /**
     * Validates a reset token issued by {@link #validateOtpAndIssueResetToken} and marks it
     * consumed. Throws if the token is missing, expired, or already used.
     */
    public void validateAndConsumeResetToken(String email, String resetToken, String purpose) {
        OtpToken otpToken = otpTokenRepository.findByEmailAndResetTokenAndPurpose(email, resetToken, purpose)
                .orElseThrow(() -> new RuntimeException(
                        "Invalid or expired reset session. Please restart the forgot password process."));

        if (Boolean.TRUE.equals(otpToken.getResetTokenUsed())) {
            throw new RuntimeException(
                    "This reset session has already been used. Please restart the forgot password process.");
        }

        if (otpToken.getResetTokenExpiresAt() == null || LocalDateTime.now().isAfter(otpToken.getResetTokenExpiresAt())) {
            throw new RuntimeException(
                    "Reset session expired. Please restart the forgot password process.");
        }

        otpToken.setResetTokenUsed(true);
        otpTokenRepository.save(otpToken);

        log.info("Reset token consumed for email: {}, purpose: {}", email, purpose);
    }

    private String generateRandomOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
