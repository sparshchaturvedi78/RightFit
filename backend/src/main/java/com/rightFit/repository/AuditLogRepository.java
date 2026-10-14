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

    /**
     * Unpaged, for the audit-history file export (BR-050 / FR-056). userId/entityType/action are optional;
     * startTime/endTime are not - a bare "? IS NULL" with no other context trips Postgres's parameter type
     * inference for timestamp params (unlike Long/String above), so the caller always resolves a concrete
     * range first (see AuditQueryService.exportCsv).
     */
    @Query("""
        SELECT al FROM AuditLog al
        WHERE (:userId IS NULL OR al.userId = :userId)
        AND (:entityType IS NULL OR al.entityType = :entityType)
        AND (:action IS NULL OR al.action = :action)
        AND al.timestamp BETWEEN :startTime AND :endTime
        ORDER BY al.timestamp DESC
        """)
    java.util.List<AuditLog> findForExport(
            @Param("userId") Long userId,
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    long countByTimestampAfter(LocalDateTime timestamp);

    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.entityType = :entityType")
    long countByEntityType(@Param("entityType") String entityType);

    /** Every action name that has been logged, for the Audit log's action search. */
    @Query("SELECT DISTINCT al.action FROM AuditLog al ORDER BY al.action")
    java.util.List<String> findDistinctActions();

    /** [day, number of entries] for the filters given; days with no entries are absent. */
    @Query("""
        SELECT CAST(al.timestamp AS date), COUNT(al) FROM AuditLog al
        WHERE (:userId IS NULL OR al.userId = :userId)
        AND (:entityType IS NULL OR al.entityType = :entityType)
        AND (:action IS NULL OR al.action = :action)
        AND al.timestamp BETWEEN :startTime AND :endTime
        GROUP BY CAST(al.timestamp AS date)
        ORDER BY CAST(al.timestamp AS date)
        """)
    java.util.List<Object[]> countPerDay(
            @Param("userId") Long userId,
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /** How many different people made the entries matching the filters. */
    @Query("""
        SELECT COUNT(DISTINCT al.userId) FROM AuditLog al
        WHERE (:userId IS NULL OR al.userId = :userId)
        AND (:entityType IS NULL OR al.entityType = :entityType)
        AND (:action IS NULL OR al.action = :action)
        AND al.timestamp BETWEEN :startTime AND :endTime
        """)
    long countPeople(
            @Param("userId") Long userId,
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /** [action, number of entries] for the filters, most common first. */
    @Query("""
        SELECT al.action, COUNT(al) FROM AuditLog al
        WHERE (:userId IS NULL OR al.userId = :userId)
        AND (:entityType IS NULL OR al.entityType = :entityType)
        AND (:action IS NULL OR al.action = :action)
        AND al.timestamp BETWEEN :startTime AND :endTime
        GROUP BY al.action
        ORDER BY COUNT(al) DESC
        """)
    java.util.List<Object[]> countPerAction(
            @Param("userId") Long userId,
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);
}
