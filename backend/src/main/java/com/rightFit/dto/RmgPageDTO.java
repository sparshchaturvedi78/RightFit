package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** One page of the Admin RMG list, with the organization-wide numbers for the page header. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmgPageDTO {

    private List<RmgDetailDTO> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;

    /** Every RMG, ignoring the filters. */
    private long totalRmgs;
    private long activeRmgs;

    /** Active employees who report to an RMG. */
    private long associatesCovered;

    /** Inactive RMGs that still have active associates reporting to them. */
    private long needReplacement;
}
