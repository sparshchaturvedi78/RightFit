package com.rightFit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@rightfit.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        String subject = getSubjectForPurpose(purpose);
        String message = formatOtpMessage(otpCode, purpose);

        if (!mailEnabled) {
            log.info("\n" +
                    "========================================\n" +
                    "EMAIL SERVICE (CONSOLE MODE - NOT CONFIGURED)\n" +
                    "========================================\n" +
                    "To: {}\n" +
                    "From: {}\n" +
                    "Subject: {}\n" +
                    "Purpose: {}\n" +
                    "OTP CODE: {}\n" +
                    "Message:\n{}\n" +
                    "========================================\n",
                    toEmail, fromEmail, subject, purpose, otpCode, message);
            return;
        }

        try {
            log.info("Sending OTP email to: {} for purpose: {}", toEmail, purpose);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}, error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }

    private String getSubjectForPurpose(String purpose) {
        return switch (purpose) {
            case "EMAIL_VERIFICATION" -> "RightFit - Email Verification OTP";
            case "PASSWORD_RESET" -> "RightFit - Password Reset OTP";
            case "FORGOT_PASSWORD" -> "RightFit - Forgot Password OTP";
            case "LOGIN_VERIFICATION" -> "RightFit - Login Verification OTP";
            case "ACCOUNT_RECOVERY" -> "RightFit - Account Recovery OTP";
            default -> "RightFit - One Time Password";
        };
    }

    private String formatOtpMessage(String otpCode, String purpose) {
        return switch (purpose) {
            case "EMAIL_VERIFICATION" ->
                "Welcome to RightFit!\n\n" +
                "Please verify your email address using the OTP below:\n" +
                "OTP: " + otpCode + "\n\n" +
                "This OTP will expire in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n";
            case "PASSWORD_RESET" ->
                "Password Reset Request\n\n" +
                "Use the OTP below to reset your password:\n" +
                "OTP: " + otpCode + "\n\n" +
                "This OTP will expire in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n";
            case "FORGOT_PASSWORD" ->
                "Forgot Password Request\n\n" +
                "Use the OTP below to reset your password:\n" +
                "OTP: " + otpCode + "\n\n" +
                "This OTP will expire in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n";
            case "LOGIN_VERIFICATION" ->
                "Login Verification\n\n" +
                "Use the OTP below to complete your login:\n" +
                "OTP: " + otpCode + "\n\n" +
                "This OTP will expire in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n";
            case "ACCOUNT_RECOVERY" ->
                "Account Recovery\n\n" +
                "Use the OTP below to recover your account:\n" +
                "OTP: " + otpCode + "\n\n" +
                "This OTP will expire in 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n";
            default ->
                "Your One Time Password (OTP): " + otpCode + "\n" +
                "This OTP will expire in 10 minutes.\n";
        };
    }
}
