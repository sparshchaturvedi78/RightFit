package com.rightFit.service;

import java.util.Map;
import java.util.Set;

/** Candidate pipeline vocabulary and legal transitions (BRD 11). */
public final class CandidateStatus {

    private CandidateStatus() {
    }

    public static final String IDENTIFIED = "IDENTIFIED";
    public static final String SHORTLISTED = "SHORTLISTED";
    public static final String INVITATION_SENT = "INVITATION_SENT";
    public static final String ACCEPTED = "ACCEPTED";
    public static final String INTERVIEW = "INTERVIEW";
    public static final String INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED";
    public static final String RECOMMENDED = "RECOMMENDED";
    public static final String MANAGER_REVIEW = "MANAGER_REVIEW";
    public static final String SELECTED = "SELECTED";
    public static final String ALLOCATION_REQUESTED = "ALLOCATION_REQUESTED";
    public static final String ALLOCATED = "ALLOCATED";
    public static final String DECLINED = "DECLINED";
    public static final String REJECTED = "REJECTED";
    public static final String WITHDRAWN = "WITHDRAWN";
    public static final String ON_HOLD = "ON_HOLD";

    public static final Set<String> TERMINAL = Set.of(ALLOCATED, DECLINED, REJECTED, WITHDRAWN);

    public static final Set<String> REJECTION_REASON_CODES = Set.of(
            "SKILL_GAP", "EXPERIENCE_GAP", "DOMAIN_MISMATCH", "LOCATION_MISMATCH",
            "WORK_MODE_MISMATCH", "COMMUNICATION", "PROJECT_FIT", "OTHER");

    private static final Map<String, Set<String>> ALLOWED = Map.ofEntries(
            Map.entry(IDENTIFIED, Set.of(SHORTLISTED, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(SHORTLISTED, Set.of(INVITATION_SENT, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(INVITATION_SENT, Set.of(ACCEPTED, DECLINED, SHORTLISTED, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(ACCEPTED, Set.of(INTERVIEW, MANAGER_REVIEW, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(INTERVIEW, Set.of(INTERVIEW_COMPLETED, ACCEPTED, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(INTERVIEW_COMPLETED, Set.of(RECOMMENDED, INTERVIEW, MANAGER_REVIEW, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(RECOMMENDED, Set.of(MANAGER_REVIEW, INTERVIEW, REJECTED, WITHDRAWN, ON_HOLD)),
            Map.entry(MANAGER_REVIEW, Set.of(SELECTED, REJECTED, INTERVIEW, WITHDRAWN, ON_HOLD)),
            Map.entry(SELECTED, Set.of(ALLOCATION_REQUESTED, DECLINED, WITHDRAWN, ON_HOLD)),
            Map.entry(ALLOCATION_REQUESTED, Set.of(ALLOCATED, SELECTED)),
            Map.entry(ON_HOLD, Set.of(IDENTIFIED, SHORTLISTED, INVITATION_SENT, ACCEPTED, INTERVIEW, INTERVIEW_COMPLETED,
                    RECOMMENDED, MANAGER_REVIEW, SELECTED, REJECTED, WITHDRAWN)));

    public static boolean canTransition(String from, String to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }
}
