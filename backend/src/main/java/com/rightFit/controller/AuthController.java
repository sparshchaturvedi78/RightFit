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
            TokenResponse response = authenticationService.refreshToken(tokenRequest.getRefreshToken());
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
            authenticationService.logout(tokenRequest.getRefreshToken());
            return ResponseEntity.ok(new LogoutResponse("Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
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
            Long userId = (Long) authentication.getDetails();
            // TODO: Fetch user details from database and return UserProfileDto
            return ResponseEntity.ok(UserProfileDto.builder().build());
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
}
