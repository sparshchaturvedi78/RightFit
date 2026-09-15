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
public class ReplacementResultDTO {

    private boolean success;

    private String message;

    private Map<String, Integer> affectedCounts;

    private String error;
}
