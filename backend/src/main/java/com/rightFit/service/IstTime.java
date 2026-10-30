package com.rightFit.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * The server keeps every timestamp as UTC wall-clock time (the JVM runs in UTC). People here work in India, so anything
 * shown to them as text, and the business hours used for suggested interview slots, go through this class.
 */
final class IstTime {

    static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private IstTime() {
    }

    /** A stored UTC time, written in India time with the given pattern. */
    static String format(LocalDateTime utc, String pattern) {
        return toIst(utc).format(DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH));
    }

    static LocalDateTime toIst(LocalDateTime utc) {
        return utc.atOffset(ZoneOffset.UTC).atZoneSameInstant(IST).toLocalDateTime();
    }

    static LocalDateTime toUtc(LocalDateTime ist) {
        return ist.atZone(IST).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }
}
