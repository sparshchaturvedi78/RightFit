package com.rightFit.service;

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

/**
 * The only place that talks to SMTP. With {@code app.mail.enabled=false} it prints the message to the console instead.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailSender {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@rightfit.com}")
    private String fromEmail;

    /** Sends now and throws if SMTP fails. Used where the caller needs to know, such as sign-in codes. */
    public void sendNow(MailMessage m) {
        if (!mailEnabled) {
            log.info("\n========================================\n"
                    + "EMAIL SERVICE (CONSOLE MODE - NOT CONFIGURED)\n"
                    + "========================================\n"
                    + "To: {}\nFrom: {}\nSubject: {}\nKind: {}\nMessage:\n{}\n"
                    + "========================================\n", m.to(), fromEmail, m.subject(), m.kind(), m.text());
            return;
        }
        try {
            log.info("Sending {} email to: {}", m.kind(), m.to());
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

    /** Runs in the background. A failure is logged and never reaches the caller. */
    @Async
    public void deliverAsync(MailMessage m) {
        try {
            sendNow(m);
        } catch (RuntimeException e) {
            log.warn("Background email {} to {} not sent: {}", m.kind(), m.to(), e.getMessage());
        }
    }
}
