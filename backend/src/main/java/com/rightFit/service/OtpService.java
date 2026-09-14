package com.rightFit.service;

import com.rightFit.entity.OtpToken;
import com.rightFit.entity.User;
import com.rightFit.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    private String generateRandomOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}
