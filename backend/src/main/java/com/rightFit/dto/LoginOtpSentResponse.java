package com.rightFit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginOtpSentResponse {

    private String message;
    private String email;
    private String sessionId;
    private Long expiryMinutes;
}
