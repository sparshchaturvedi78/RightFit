package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmgDetailDTO {

    private Long rmgId;

    private String employeeId;

    private String rmgName;

    private String email;

    private String department;

    private String designation;

    private Long associateCount;

    private String status;

    // ---- Admin RMG page only (null on the dashboard roster) ----

    private String grade;

    private String location;

    /** The Admin this RMG reports to. */
    private String reportsToName;

    private String reportsToEmployeeId;

    /** The RMG's active associates per workforce bucket (IN_PROJECT, ON_BENCH, IN_TRAINING, UNASSIGNED). */
    private Map<String, Long> workforce;
}
