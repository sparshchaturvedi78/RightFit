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
            LoginOtpSentResponse response = authenticationService.login(loginRequest, ipAddress, userAgent);
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

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody VerifyLoginOtpRequest verifyLoginOtpRequest) {
        try {
            LoginResponse response = authenticationService.verifyLoginOtp(verifyLoginOtpRequest.getSessionId(), verifyLoginOtpRequest.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login OTP verification failed: {}", e.getMessage());
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
    public ResponseEntity<?> logout(@RequestBody TokenRequest tokenRequest, HttpServletRequest request) {
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
            String accessToken = extractTokenFromRequest(request);
            authenticationService.logout(tokenRequest.getRefreshToken(), userId, accessToken);
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

    @PostMapping("/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(@Valid @RequestBody VerifyEmailRequest verifyEmailRequest) {
        try {
            authenticationService.verifyEmail(verifyEmailRequest.getEmail(), verifyEmailRequest.getOtp());
            return ResponseEntity.ok(new LogoutResponse("Email verified successfully"));
        } catch (Exception e) {
            log.error("Email verification failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
                    .error("VERIFICATION_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/forgot-password/step1")
    public ResponseEntity<?> forgotPasswordStep1(@Valid @RequestBody ForgotPasswordStep1Request request) {
        try {
            authenticationService.forgotPasswordStep1(request.getEmail());
            return ResponseEntity.ok(new LogoutResponse("OTP sent to your registered email. Please check your inbox."));
        } catch (Exception e) {
            log.error("Forgot password step 1 failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
                    .error("FORGOT_PASSWORD_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/forgot-password/step2")
    public ResponseEntity<?> forgotPasswordStep2(@Valid @RequestBody ForgotPasswordStep2Request request) {
        try {
            String resetToken = authenticationService.forgotPasswordStep2(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(ForgotPasswordStep2Response.builder()
                    .message("OTP verified successfully. Proceed to reset password.")
                    .resetToken(resetToken)
                    .build());
        } catch (Exception e) {
            log.error("Forgot password step 2 failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
                    .error("OTP_VERIFICATION_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/forgot-password/step3")
    public ResponseEntity<?> forgotPasswordStep3(@Valid @RequestBody ForgotPasswordStep3Request request) {
        try {
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.status(400).body(ErrorResponse.builder()
                        .status(400)
                        .error("VALIDATION_ERROR")
                        .message("Passwords do not match")
                        .build());
            }

            authenticationService.forgotPasswordStep3(request.getEmail(), request.getResetToken(), request.getNewPassword(), request.getConfirmPassword());
            return ResponseEntity.ok(new LogoutResponse("Password reset successfully. You can now login with your new password."));
        } catch (Exception e) {
            log.error("Forgot password step 3 failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
                    .error("PASSWORD_RESET_FAILED")
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ErrorResponse.builder()
                    .status(401)
                    .error("UNAUTHORIZED")
                    .message("You must be logged in to reset password")
                    .build());
        }

        try {
            Long userId = extractUserIdFromAuth(authentication);

            if (!resetPasswordRequest.getNewPassword().equals(resetPasswordRequest.getConfirmPassword())) {
                return ResponseEntity.status(400).body(ErrorResponse.builder()
                        .status(400)
                        .error("VALIDATION_ERROR")
                        .message("Passwords do not match")
                        .build());
            }

            if (resetPasswordRequest.getOldPassword() == null || resetPasswordRequest.getOldPassword().isEmpty()) {
                return ResponseEntity.status(400).body(ErrorResponse.builder()
                        .status(400)
                        .error("VALIDATION_ERROR")
                        .message("Old password is required")
                        .build());
            }

            if (resetPasswordRequest.getOldPassword().equals(resetPasswordRequest.getNewPassword())) {
                return ResponseEntity.status(400).body(ErrorResponse.builder()
                        .status(400)
                        .error("VALIDATION_ERROR")
                        .message("New password cannot be the same as old password")
                        .build());
            }

            authenticationService.resetPasswordWithOldPassword(
                    userId,
                    resetPasswordRequest.getOldPassword(),
                    resetPasswordRequest.getNewPassword(),
                    resetPasswordRequest.getConfirmPassword()
            );

            return ResponseEntity.ok(new LogoutResponse("Password reset successfully"));
        } catch (Exception e) {
            log.error("Password reset failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(ErrorResponse.builder()
                    .status(400)
                    .error("PASSWORD_RESET_FAILED")
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

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
