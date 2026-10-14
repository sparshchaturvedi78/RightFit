package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/** Header numbers, attention counts and the 14-day sign-in series for the Admin Users page. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccountSummaryDTO {

    private long totalAccounts;

    /** Accounts holding each role (ADMIN, MANAGER, RMG, ASSOCIATE). An account with two roles counts in both. */
    private Map<String, Long> accountsByRole;

    private long blocked;
    private long locked;
    private long neverSignedIn;
    private long signInsToday;

    /** One entry per day for the last 14 days, oldest first. Days with no sign-ins have a count of 0. */
    private List<DayCount> signIns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayCount {
        /** yyyy-MM-dd */
        private String date;
        private long count;
    }
}
