package com.rightFit.service;

import com.rightFit.dto.LoginRequest;
import com.rightFit.dto.LoginResponse;
import com.rightFit.dto.TokenResponse;
import com.rightFit.entity.*;
import com.rightFit.repository.*;
import com.rightFit.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

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
        log.debug("Password hash from DB: {}", user.getPasswordHash());
        log.debug("Incoming password: {}", password);

        // Check status
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Account is inactive");
        }

        // PASSWORD VALIDATION DISABLED - See AUTHENTICATION_SETUP.md for instructions
        log.debug("Password validation disabled - follow AUTHENTICATION_SETUP.md to enable");

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

    public TokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        RefreshToken rt = refreshTokenRepository.findByTokenValueAndIsRevokedFalse(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (rt.isExpired()) {
            throw new RuntimeException("Refresh token expired");
        }

        User user = rt.getUser();
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

    public void logout(String refreshToken) {
        refreshTokenRepository.findByTokenValue(refreshToken)
                .ifPresent(rt -> {
                    rt.setIsRevoked(true);
                    refreshTokenRepository.save(rt);
                });
    }
}
