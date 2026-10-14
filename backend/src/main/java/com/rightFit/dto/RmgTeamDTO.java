package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/** One page of the active associates reporting to an RMG (Admin RMG page → RMG details), filterable by workforce bucket. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmgTeamDTO {

    private List<MemberDTO> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;

    /** Everyone reporting to the RMG regardless of the filter — for the header count. */
    private long teamSize;

    /** Team size per workforce bucket — fills the filter. */
    private Map<String, Long> workforce;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDTO {
        private Long id;
        private String employeeId;
        private String firstName;
        private String lastName;
        private String email;
        private String designation;
        private String grade;
        /** IN_PROJECT, ON_BENCH, IN_TRAINING or UNASSIGNED. */
        private String workforce;
    }
}
