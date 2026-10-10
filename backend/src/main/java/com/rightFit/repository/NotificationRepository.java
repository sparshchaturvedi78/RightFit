package com.rightFit.repository;

import com.rightFit.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllRead(@Param("recipientId") Long recipientId, @Param("now") LocalDateTime now);
}
