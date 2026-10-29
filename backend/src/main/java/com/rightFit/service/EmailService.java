package com.rightFit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Codes and the welcome email. These are sent straight away, because the person is waiting for them. Other events
 * go through {@link EventMailer}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a");

    private final EmailSender emailSender;
    private final EventMailer eventMailer;
    private final MailTemplateRenderer templates;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    /** Where a new employee signs in. A placeholder until the deployed address is known. */
    @Value("${app.mail.login-url:http://localhost:5173/login}")
    private String loginUrl;

    /** Sends a one-time code. Each purpose has its own layout. */
    public void sendOtpEmail(String toEmail, String firstName, String otpCode, String purpose) {
        String name = firstName == null || firstName.isBlank() ? "there" : firstName.trim();
        if ("FORGOT_PASSWORD".equals(purpose)) {
            emailSender.sendNow(eventMailer.forgotPasswordCode(toEmail, name, otpCode, otpExpiryMinutes));
            return;
        }
        Map<String, String> values = new LinkedHashMap<>();
        values.put("firstName", name);
        values.put("otp", otpCode);
        values.put("expiryMinutes", String.valueOf(otpExpiryMinutes));

        String subject;
        String html;
        String text;
        if ("LOGIN_VERIFICATION".equals(purpose)) {
            subject = "Your RightFit sign-in code: " + otpCode;
            values.put("requestedAt", LocalDateTime.now().format(WHEN));
            html = templates.render("login-otp", values);
            text = "Hi " + name + ",\n\n"
                    + "Your RightFit sign-in code is " + otpCode + ".\n"
                    + "It expires in " + otpExpiryMinutes + " minutes. Never share this code.\n\n"
                    + "Didn't try to sign in? Ignore this email.\n";
        } else {
            SecurityCopy copy = SecurityCopy.of(purpose);
            subject = copy.subject(otpCode);
            values.put("eyebrow", copy.eyebrow());
            values.put("heading", copy.heading());
            values.put("intro", copy.intro());
            values.put("footnote", copy.footnote());
            html = templates.render("security-otp", values);
            text = "Hi " + name + ",\n\n" + copy.intro() + "\n\n"
                    + "Your code is " + otpCode + ". It is valid for " + otpExpiryMinutes + " minutes and can be used once.\n\n"
                    + copy.footnote() + "\n";
        }
        emailSender.sendNow(new MailMessage(toEmail, subject, text, html, "OTP (" + purpose + ")"));
    }

    /** Welcome email for a newly created employee: their ID, the temporary password and the sign-in link. */
    public void sendAccountCreated(String toEmail, String firstName, String employeeId, String temporaryPassword, String roleLabel) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("firstName", firstName == null || firstName.isBlank() ? "there" : firstName.trim());
        values.put("employeeId", employeeId);
        values.put("email", toEmail);
        values.put("temporaryPassword", temporaryPassword);
        values.put("roleLabel", roleLabel);
        values.put("loginUrl", loginUrl);
        String html = templates.render("account-created", values);
        String text = "Hi " + values.get("firstName") + ",\n\n"
                + "An account has been created for you as " + roleLabel + " on RightFit.\n\n"
                + "Employee ID: " + employeeId + "\n"
                + "Email: " + toEmail + "\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "Sign in here: " + loginUrl + "\n\n"
                + "Change your temporary password after you sign in.\n";
        emailSender.sendNow(new MailMessage(toEmail, "Welcome to RightFit: your account details", text, html, "ACCOUNT_CREATED"));
    }

    /** Wording for the security-code emails. */
    private record SecurityCopy(String eyebrow, String heading, String intro, String footnote, String subjectPrefix) {
        static SecurityCopy of(String purpose) {
            return switch (purpose) {
                case "EMAIL_VERIFICATION" -> new SecurityCopy("Verify your email", "Confirm your email address",
                        "use this code to confirm your email address for RightFit.",
                        "If you didn’t ask to verify this address, you can ignore this email.", "Verify your email");
                case "PASSWORD_RESET" -> new SecurityCopy("Password reset", "Reset your password",
                        "we received a request to reset your RightFit password.",
                        "If you didn’t request this, ignore this email. Your password stays the same.", "Reset your password");
                case "ACCOUNT_RECOVERY" -> new SecurityCopy("Account recovery", "Recover your account",
                        "we received a request to recover your RightFit account.",
                        "If you didn’t request this, ignore this email and your account stays as it is.", "Account recovery");
                default -> new SecurityCopy("Security code", "Your security code",
                        "here is the code you asked for.",
                        "If you didn’t ask for this code, ignore this email.", "Security code");
            };
        }

        String subject(String code) {
            return "RightFit " + subjectPrefix + " code: " + code;
        }
    }
}
