package com.rightFit.controller;

import com.rightFit.dto.NotificationDTO;
import com.rightFit.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasPermission(null, 'NOTIFICATION_READ_OWN')")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> myNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificationService.myNotifications(unreadOnly, PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("unread", notificationService.unreadCount()));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markRead(notificationId));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead() {
        return ResponseEntity.ok(Map.of("updated", notificationService.markAllRead()));
    }
}
