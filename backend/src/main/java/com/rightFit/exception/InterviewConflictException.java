package com.rightFit.exception;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/** The requested interview time clashes with another interview. Carries free times the manager can pick instead. */
@Getter
public class InterviewConflictException extends BusinessRuleException {

    private final List<String> conflicts;
    private final List<LocalDateTime> suggestions;

    public InterviewConflictException(List<String> conflicts, List<LocalDateTime> suggestions) {
        super("INTERVIEW_CONFLICT", "That time clashes with another interview. Pick one of the suggested times.");
        this.conflicts = conflicts;
        this.suggestions = suggestions;
    }
}
