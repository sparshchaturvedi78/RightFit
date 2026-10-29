package com.rightFit.service;

/** One outgoing email: who it goes to, and the plain-text and HTML bodies. {@code kind} is for logs only. */
public record MailMessage(String to, String subject, String text, String html, String kind) {
}
