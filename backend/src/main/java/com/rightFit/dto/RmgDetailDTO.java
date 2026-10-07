package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
