package com.rightFit.service;

import com.rightFit.dto.LoginRequest;
import com.rightFit.dto.LoginResponse;
import com.rightFit.dto.TokenResponse;
import com.rightFit.dto.UserProfileDto;
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
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRoleRepository userRoleRepository;
    private final FailedLoginAttemptRepository failedLoginAttemptRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    public LoginResponse login(LoginRequest loginRequest, String ipAddress, String userAgent) {
        String employeeId = loginRequest.getEmployeeId();
        String password = loginRequest.getPassword();

        log.info("Login attempt for employee ID: {}", employeeId);

        // Parse employee ID as Long
        Long empId = Long.parseLong(employeeId);

        // Find user
        User user = userRepository.findByEmployeeId(empId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.debug("User found: {}", user.getEmail());

        // Check account lock status
        checkAccountLock(user);

        // Check status
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Account is inactive");
        }

        // Validate password with BCrypt
        boolean passwordMatches = passwordEncoder.matches(password, user.getPasswordHash());
        if (!passwordMatches) {
            recordFailedLoginAttempt(user, ipAddress, userAgent);
            // Re-check lock after recording failed attempt
            checkAccountLock(user);
            throw new RuntimeException("Invalid password");
        }
        log.info("Password validated successfully");

        // Clear failed login attempts on successful login
        FailedLoginAttempt successAttempt = failedLoginAttemptRepository.findByEmail(user.getEmail()).orElse(null);
        if (successAttempt != null) {
            failedLoginAttemptRepository.delete(successAttempt);
        }

        // Get roles
        Set<String> roles = userRoleRepository.findByUserId(user.getId())
                .stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                empId.toString(),
                user.getEmail(),
                roles
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        // Save refresh token
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenValue(refreshToken)
                .isRevoked(false)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(rt);

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("Login successful for user: {}", user.getEmail());

        // Get employee details if available, otherwise use defaults
        String firstName = "User";
        String lastName = empId.toString();
        if (user.getEmployee() != null) {
            firstName = user.getEmployee().getFirstName();
            lastName = user.getEmployee().getLastName();
        }

        return LoginResponse.builder()
                .userId(user.getId())
                .employeeId(empId.toString())
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

    public void logout(String refreshToken, Long requestingUserId) {
        RefreshToken rt = refreshTokenRepository.findByTokenValue(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        // Validate that the requesting user owns this refresh token
        if (!rt.getUser().getId().equals(requestingUserId)) {
            log.warn("Logout attempted by user {} for another user's token", requestingUserId);
            throw new RuntimeException("Unauthorized: Cannot logout another user's session");
        }

        rt.setIsRevoked(true);
        refreshTokenRepository.save(rt);
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
}
