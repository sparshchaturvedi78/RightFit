package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDTO {

    private Long id;

    private String type;

    private String title;

    private String message;

    private String entityType;

    private String entityRef;

    private Boolean isRead;

    private LocalDateTime readAt;

    private LocalDateTime createdAt;
}
