package com.rightFit.service;

import com.rightFit.dto.NotificationDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Notification;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.NotificationRepository;
import com.rightFit.repository.RoleRepository;
import com.rightFit.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final RequirementAccessGuard accessGuard;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    /** In-app notification (BRD 33). Delivery channels (email/Teams/Slack) are future integrations. */
    public void notify(Employee recipient, String type, String title, String message,
                       String entityType, String entityRef) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityRef(entityRef)
                .build());
        log.debug("Notification {} queued for {}", type, recipient.getEmployeeId());
    }

    /** The employee's assigned RMG is notified (BR-039); with no assigned RMG, every active RMG is. */
    public void notifyRmgOf(Employee employee, String type, String title, String message,
                            String entityType, String entityRef) {
        if (employee.getRmgManager() != null) {
            notify(employee.getRmgManager(), type, title, message, entityType, entityRef);
            return;
        }
        roleRepository.findByCode(RequirementAccessGuard.RMG).ifPresent(role ->
                userRoleRepository.findByRoleIdAndActive(role.getId()).forEach(ur -> {
                    if (ur.getUser() != null && ur.getUser().getEmployee() != null) {
                        notify(ur.getUser().getEmployee(), type, title, message, entityType, entityRef);
                    }
                }));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> myNotifications(boolean unreadOnly, Pageable pageable) {
        Long me = accessGuard.currentEmployee().getId();
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(me, pageable)
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(me, pageable);
        return page.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notificationRepository.countByRecipientIdAndIsReadFalse(accessGuard.currentEmployee().getId());
    }

    public NotificationDTO markRead(Long notificationId) {
        Notification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, accessGuard.currentEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", String.valueOf(notificationId)));
        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toDTO(notification);
    }

    public int markAllRead() {
        return notificationRepository.markAllRead(accessGuard.currentEmployee().getId(), LocalDateTime.now());
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityRef(n.getEntityRef())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
