package com.rightFit.service;

import com.rightFit.dto.*;
import com.rightFit.entity.*;
import com.rightFit.repository.*;
import com.rightFit.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final UserRoleRepository userRoleRepository;
    private final FailedLoginAttemptRepository failedLoginAttemptRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;
    private static final int PASSWORD_HISTORY_LIMIT = 5;

    public LoginOtpSentResponse login(LoginRequest loginRequest, String ipAddress, String userAgent) {
        String employeeId = loginRequest.getEmployeeId();
        String password = loginRequest.getPassword();

        log.info("Login attempt for employee ID: {}", employeeId);

        Long empId = Long.parseLong(employeeId);

        User user = userRepository.findByEmployeeId(empId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.debug("User found: {}", user.getEmail());

        checkAccountLock(user);

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Account is inactive");
        }

        boolean passwordMatches = passwordEncoder.matches(password, user.getPasswordHash());
        if (!passwordMatches) {
            recordFailedLoginAttempt(user, ipAddress, userAgent);
            checkAccountLock(user);
            throw new RuntimeException("Invalid password");
        }
        log.info("Password validated successfully");

        // Generate OTP for login verification
        String otp = otpService.generateOtp(user, user.getEmail(), "LOGIN_VERIFICATION");
        emailService.sendOtpEmail(user.getEmail(), otp, "LOGIN_VERIFICATION");

        log.info("Login OTP sent to: {}", user.getEmail());

        return LoginOtpSentResponse.builder()
                .message("OTP sent to registered email. Please provide OTP to complete login.")
                .email(user.getEmail())
                .sessionId(user.getId().toString())
                .expiryMinutes(10L)
                .build();
    }

    public TokenResponse refreshToken(String refreshToken, Long requestingUserId) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        RefreshToken rt = refreshTokenRepository.findByTokenValueAndIsRevokedFalse(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (rt.isExpired()) {
            throw new RuntimeException("Refresh token expired");
        }

        User user = rt.getUser();

        // Validate that the requesting user owns this refresh token
        if (!user.getId().equals(requestingUserId)) {
            log.warn("Token refresh attempted by user {} for another user's token", requestingUserId);
            throw new RuntimeException("Unauthorized: Cannot refresh another user's token");
        }
        Set<String> roles = userRoleRepository.findByUserId(user.getId())
                .stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmployeeId().toString(),
                user.getEmail(),
                roles
        );

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTimeSecs())
                .build();
    }

    public void logout(String refreshToken, Long requestingUserId, String accessToken) {
        RefreshToken rt = refreshTokenRepository.findByTokenValue(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (!rt.getUser().getId().equals(requestingUserId)) {
            log.warn("Logout attempted by user {} for another user's token", requestingUserId);
            throw new RuntimeException("Unauthorized: Cannot logout another user's session");
        }

        rt.setIsRevoked(true);
        refreshTokenRepository.save(rt);

        if (accessToken != null && !accessToken.isEmpty()) {
            revokeAccessToken(accessToken, requestingUserId);
        }
    }

    private void revokeAccessToken(String accessToken, Long userId) {
        try {
            String tokenHash = hashToken(accessToken);
            Long expirationMs = jwtTokenProvider.getExpirationTimeMs();
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expirationMs / 1000);

            if (!revokedTokenRepository.existsByTokenHash(tokenHash)) {
                RevokedToken revokedToken = RevokedToken.builder()
                        .user(userRepository.findById(userId).orElseThrow())
                        .tokenHash(tokenHash)
                        .revokedAt(LocalDateTime.now())
                        .expiresAt(expiresAt)
                        .reason("USER_LOGOUT")
                        .build();
                revokedTokenRepository.save(revokedToken);
                log.info("Access token revoked for user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Failed to revoke access token: {}", e.getMessage());
        }
    }

    private String hashToken(String token) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(token.getBytes());
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    public boolean isTokenRevoked(String token) {
        try {
            String tokenHash = hashToken(token);
            return revokedTokenRepository.existsByTokenHash(tokenHash);
        } catch (Exception e) {
            log.error("Error checking token revocation: {}", e.getMessage());
            return false;
        }
    }

    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<String> roles = userRoleRepository.findByUserId(userId)
                .stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        Employee employee = user.getEmployee();
        String designation = employee != null ? employee.getDesignation() : "N/A";
        String department = employee != null && employee.getDepartment() != null
                ? employee.getDepartment().getName() : "N/A";
        String grade = employee != null ? employee.getGrade() : "N/A";
        String employmentStatus = employee != null ? employee.getEmploymentStatus() : "N/A";
        String allocationStatus = employee != null ? employee.getAllocationStatus() : "N/A";

        return UserProfileDto.builder()
                .userId(user.getId())
                .employeeId(user.getEmployeeId().toString())
                .email(user.getEmail())
                .firstName(employee != null ? employee.getFirstName() : "User")
                .lastName(employee != null ? employee.getLastName() : user.getEmployeeId().toString())
                .designation(designation)
                .department(department)
                .grade(grade)
                .roles(roles)
                .status(user.getStatus())
                .employmentStatus(employmentStatus)
                .allocationStatus(allocationStatus)
                .build();
    }

    private void checkAccountLock(User user) {
        FailedLoginAttempt failedAttempt = failedLoginAttemptRepository.findByEmail(user.getEmail()).orElse(null);
        if (failedAttempt != null && failedAttempt.isLocked()) {
            log.warn("Login attempt for locked account: {}", user.getEmail());
            throw new RuntimeException("Account is locked. Please try again later or contact support.");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedLoginAttempt(User user, String ipAddress, String userAgent) {
        FailedLoginAttempt failedAttempt = failedLoginAttemptRepository.findByEmail(user.getEmail())
                .orElse(FailedLoginAttempt.builder()
                        .user(user)
                        .email(user.getEmail())
                        .attemptCount(0)
                        .ipAddress(ipAddress)
                        .userAgent(userAgent)
                        .build());

        failedAttempt.incrementAttempt();
        failedAttempt.setIpAddress(ipAddress);
        failedAttempt.setUserAgent(userAgent);

        log.debug("Failed login attempt #{} for user: {}", failedAttempt.getAttemptCount(), user.getEmail());

        if (failedAttempt.getAttemptCount() >= MAX_FAILED_ATTEMPTS) {
            failedAttempt.lock(LOCK_DURATION_MINUTES);
            log.warn("Account locked due to {} failed login attempts: {}", MAX_FAILED_ATTEMPTS, user.getEmail());
        }

        failedLoginAttemptRepository.save(failedAttempt);
    }

    public void requestEmailVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if ("ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Email already verified");
        }

        String otp = otpService.generateOtp(user, email, "EMAIL_VERIFICATION");
        emailService.sendOtpEmail(email, otp, "EMAIL_VERIFICATION");

        log.info("Email verification OTP sent to: {}", email);
    }

    public void verifyEmail(String email, String otp) {
        if (!otpService.validateOtp(email, otp, "EMAIL_VERIFICATION")) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("ACTIVE");
        userRepository.save(user);

        log.info("Email verified for user: {}", email);
    }

    // ============================================================
    // FORGOT PASSWORD - 3 STEP PROCESS (For Everyone)
    // ============================================================

    public void forgotPasswordStep1(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        String otp = otpService.generateOtp(user, email, "FORGOT_PASSWORD");
        emailService.sendOtpEmail(email, otp, "FORGOT_PASSWORD");

        log.info("Forgot password OTP sent to: {}", email);
    }

    public void forgotPasswordStep2(String email, String otp) {
        if (!otpService.validateOtp(email, otp, "FORGOT_PASSWORD")) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        log.info("Forgot password OTP verified for email: {}", email);
    }

    public void forgotPasswordStep3(String email, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new RuntimeException("New password cannot be the same as current password");
        }

        checkPasswordHistory(user, newPassword);

        String oldPasswordHash = user.getPasswordHash();
        String encodedNewPassword = passwordEncoder.encode(newPassword);

        savePasswordToHistory(user, oldPasswordHash);

        user.setPasswordHash(encodedNewPassword);
        userRepository.save(user);

        log.info("Password reset successfully via forgot password for user: {}", email);
    }

    // ============================================================
    // RESET PASSWORD - For Logged-In Users Only
    // ============================================================

    public void resetPasswordWithOldPassword(Long userId, String oldPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Old password is incorrect");
        }

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new RuntimeException("New password cannot be the same as current password");
        }

        checkPasswordHistory(user, newPassword);

        String encodedNewPassword = passwordEncoder.encode(newPassword);

        savePasswordToHistory(user, user.getPasswordHash());

        user.setPasswordHash(encodedNewPassword);
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    private void checkPasswordHistory(User user, String newPassword) {
        List<PasswordHistory> recentPasswords = passwordHistoryRepository.findRecentPasswordsByUserId(user.getId(), PASSWORD_HISTORY_LIMIT);

        for (PasswordHistory history : recentPasswords) {
            if (passwordEncoder.matches(newPassword, history.getPasswordHash())) {
                throw new RuntimeException("New password cannot match any of your last " + PASSWORD_HISTORY_LIMIT + " passwords");
            }
        }
    }

    private void savePasswordToHistory(User user, String passwordHash) {
        PasswordHistory history = PasswordHistory.builder()
                .user(user)
                .passwordHash(passwordHash)
                .changedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        passwordHistoryRepository.save(history);
    }

    public LoginResponse verifyLoginOtp(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!otpService.validateOtp(user.getEmail(), otp, "LOGIN_VERIFICATION")) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        log.info("Login OTP verified for user: {}", user.getEmail());

        // Clear failed login attempts on successful OTP verification
        FailedLoginAttempt successAttempt = failedLoginAttemptRepository.findByEmail(user.getEmail()).orElse(null);
        if (successAttempt != null) {
            failedLoginAttemptRepository.delete(successAttempt);
        }

        Set<String> roles = userRoleRepository.findByUserId(user.getId())
                .stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmployeeId().toString(),
                user.getEmail(),
                roles
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenValue(refreshToken)
                .isRevoked(false)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(rt);

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("Login successful for user: {}", user.getEmail());

        String firstName = "User";
        String lastName = user.getEmployeeId().toString();
        if (user.getEmployee() != null) {
            firstName = user.getEmployee().getFirstName();
            lastName = user.getEmployee().getLastName();
        }

        return LoginResponse.builder()
                .userId(user.getId())
                .employeeId(user.getEmployeeId().toString())
                .email(user.getEmail())
                .firstName(firstName)
                .lastName(lastName)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTimeSecs())
                .roles(roles)
                .status(user.getStatus())
                .build();
    }
}
