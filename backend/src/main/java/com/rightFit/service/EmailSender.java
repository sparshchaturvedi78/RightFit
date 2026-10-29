package com.rightFit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * The only place that sends email. With {@code app.mail.enabled=false} it prints the message to the console instead.
 *
 * <p>Two transports: {@code resend} calls Resend's HTTPS API, which works on hosts that block outbound SMTP (such as
 * Render), and {@code smtp} uses JavaMail with Gmail, for local development.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailSender {

    private static final URI RESEND_URI = URI.create("https://api.resend.com/emails");

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@rightfit.com}")
    private String fromEmail;

    /** smtp or resend. */
    @Value("${app.mail.provider:smtp}")
    private String provider;

    @Value("${app.mail.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.mail.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${app.mail.brevo.sender-name:RightFit}")
    private String brevoSenderName;

    /** Sends now and throws if the provider fails. Used where the caller needs to know, such as sign-in codes. */
    public void sendNow(MailMessage m) {
        if (!mailEnabled) {
            log.info("\n========================================\n"
                    + "EMAIL SERVICE (CONSOLE MODE - NOT CONFIGURED)\n"
                    + "========================================\n"
                    + "To: {}\nFrom: {}\nSubject: {}\nKind: {}\nMessage:\n{}\n"
                    + "========================================\n", m.to(), fromEmail, m.subject(), m.kind(), m.text());
            return;
        }
        if ("resend".equalsIgnoreCase(provider)) {
            sendViaResend(m);
        } else if ("brevo".equalsIgnoreCase(provider)) {
            sendViaBrevo(m);
        } else {
            sendViaSmtp(m);
        }
    }

    /** Runs in the background. A failure is logged and never reaches the caller. */
    @Async
    public void deliverAsync(MailMessage m) {
        try {
            sendNow(m);
        } catch (RuntimeException e) {
            log.warn("Background email {} to {} not sent: {}", m.kind(), m.to(), e.getMessage());
        }
    }

    /**
     * Brevo's transactional API. Works on hosts that block SMTP, and needs only a verified sender email address,
     * not a domain. The sender is {@code app.mail.from}, which must be verified in Brevo.
     */
    private void sendViaBrevo(MailMessage m) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.error("Email not sent ({}): BREVO_API_KEY is not set", m.kind());
            throw new RuntimeException("Failed to send email");
        }
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "sender", Map.of("email", fromEmail, "name", brevoSenderName),
                    "to", List.of(Map.of("email", m.to())),
                    "subject", m.subject(),
                    "htmlContent", m.html(),
                    "textContent", m.text()));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .timeout(Duration.ofSeconds(15))
                    .header("api-key", brevoApiKey)
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.error("Brevo rejected {} email to {}: HTTP {} {}", m.kind(), m.to(), response.statusCode(), response.body());
                throw new RuntimeException("Failed to send email");
            }
            log.info("Sent {} email to: {} (Brevo)", m.kind(), m.to());
        } catch (IOException e) {
            log.error("Failed to reach Brevo for {} email to {}: {}", m.kind(), m.to(), e.getMessage());
            throw new RuntimeException("Failed to send email");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to send email");
        }
    }

    private void sendViaResend(MailMessage m) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("Email not sent ({}): RESEND_API_KEY is not set", m.kind());
            throw new RuntimeException("Failed to send email");
        }
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "from", fromEmail,
                    "to", List.of(m.to()),
                    "subject", m.subject(),
                    "html", m.html(),
                    "text", m.text()));
            HttpRequest request = HttpRequest.newBuilder(RESEND_URI)
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.error("Resend rejected {} email to {}: HTTP {} {}", m.kind(), m.to(), response.statusCode(), response.body());
                throw new RuntimeException("Failed to send email");
            }
            log.info("Sent {} email to: {} (Resend)", m.kind(), m.to());
        } catch (IOException e) {
            log.error("Failed to reach Resend for {} email to {}: {}", m.kind(), m.to(), e.getMessage());
            throw new RuntimeException("Failed to send email");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to send email");
        }
    }

    private void sendViaSmtp(MailMessage m) {
        try {
            log.info("Sending {} email to: {} (SMTP)", m.kind(), m.to());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(m.to());
            helper.setFrom(fromEmail);
            helper.setSubject(m.subject());
            helper.setText(m.text(), m.html());
            mailSender.send(message);
        } catch (MailException | MessagingException e) {
            log.error("Failed to send {} email to: {}, error: {}", m.kind(), m.to(), e.getMessage());
            throw new RuntimeException("Failed to send email");
        }
    }
}
