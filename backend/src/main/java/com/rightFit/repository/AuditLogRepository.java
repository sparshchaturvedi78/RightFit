package com.rightFit.repository;

import com.rightFit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT al FROM AuditLog al WHERE al.userId = :userId ORDER BY al.timestamp DESC")
    Page<AuditLog> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType ORDER BY al.timestamp DESC")
    Page<AuditLog> findByEntityType(@Param("entityType") String entityType, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType AND al.entityId = :entityId ORDER BY al.timestamp DESC")
    Page<AuditLog> findByEntityTypeAndEntityId(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId,
            Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.action = :action ORDER BY al.timestamp DESC")
    Page<AuditLog> findByAction(@Param("action") String action, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.timestamp BETWEEN :startTime AND :endTime ORDER BY al.timestamp DESC")
    Page<AuditLog> findByTimestampBetween(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.userId = :userId AND al.timestamp BETWEEN :startTime AND :endTime ORDER BY al.timestamp DESC")
    Page<AuditLog> findByUserIdAndTimestampBetween(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType AND al.timestamp BETWEEN :startTime AND :endTime ORDER BY al.timestamp DESC")
    Page<AuditLog> findByEntityTypeAndTimestampBetween(
            @Param("entityType") String entityType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query(value = """
        SELECT al FROM AuditLog al
        WHERE (:userId IS NULL OR al.userId = :userId)
        AND (:entityType IS NULL OR al.entityType = :entityType)
        AND (:action IS NULL OR al.action = :action)
        AND (al.timestamp BETWEEN :startTime AND :endTime)
        ORDER BY al.timestamp DESC
        """)
    Page<AuditLog> findByFilters(
            @Param("userId") Long userId,
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.entityType = :entityType")
    long countByEntityType(@Param("entityType") String entityType);
}
