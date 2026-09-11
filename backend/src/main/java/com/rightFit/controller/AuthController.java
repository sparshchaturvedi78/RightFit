package com.rightFit.controller;

import com.rightFit.dto.*;
import com.rightFit.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        try {
            LoginResponse response = authenticationService.login(loginRequest, ipAddress, userAgent);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(ErrorResponse.builder()
                    .status(401)
                    .error("AUTHENTICATION_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRequest tokenRequest) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ErrorResponse.builder()
                        .status(401)
                        .error("UNAUTHORIZED")
                        .message("User must be authenticated to refresh token")
                        .build());
            }

            String principal = (String) authentication.getPrincipal();
            Long userId = extractUserIdFromAuth(authentication);
            TokenResponse response = authenticationService.refreshToken(tokenRequest.getRefreshToken(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(ErrorResponse.builder()
                    .status(401)
                    .error("TOKEN_REFRESH_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody TokenRequest tokenRequest) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ErrorResponse.builder()
                        .status(401)
                        .error("UNAUTHORIZED")
                        .message("User must be authenticated to logout")
                        .build());
            }

            Long userId = extractUserIdFromAuth(authentication);
            authenticationService.logout(tokenRequest.getRefreshToken(), userId);
            return ResponseEntity.ok(new LogoutResponse("Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(ErrorResponse.builder()
                    .status(401)
                    .error("LOGOUT_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ErrorResponse.builder()
                    .status(401)
                    .error("UNAUTHORIZED")
                    .message("User not authenticated")
                    .build());
        }

        try {
            Long userId = extractUserIdFromAuth(authentication);
            UserProfileDto profile = authenticationService.getUserProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Failed to fetch user profile: {}", e.getMessage());
            return ResponseEntity.status(500).body(ErrorResponse.builder()
                    .status(500)
                    .error("INTERNAL_SERVER_ERROR")
                    .message(e.getMessage())
                    .build());
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }

    private Long extractUserIdFromAuth(Authentication authentication) {
        Object details = authentication.getDetails();
        if (details instanceof Long) {
            return (Long) details;
        }
        if (details instanceof String) {
            try {
                return Long.parseLong((String) details);
            } catch (NumberFormatException e) {
                log.error("Failed to parse userId from auth details: {}", details);
            }
        }
        throw new RuntimeException("Unable to extract user ID from authentication");
    }
}
