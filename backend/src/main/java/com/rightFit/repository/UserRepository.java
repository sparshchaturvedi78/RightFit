package com.rightFit.repository;

import com.rightFit.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmployeeId(String employeeId);

    boolean existsByEmail(String email);

    boolean existsByEmployeeId(String employeeId);

    long countByStatus(String status);

    /**
     * Admin Users page: login accounts, each filter optional. {@code state} is one of BLOCKED (status INACTIVE),
     * LOCKED (locked after failed sign-ins) or NEVER (never signed in); anything else means no state filter.
     */
    @Query("SELECT u FROM User u LEFT JOIN u.employee e WHERE " +
            "(CAST(:q AS string) IS NULL OR LOWER(u.employeeId) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "   LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))) AND " +
            "(CAST(:role AS string) IS NULL OR EXISTS (SELECT 1 FROM UserRole ur WHERE ur.user = u AND ur.isActive = true " +
            "   AND ur.role.code = CAST(:role AS string))) AND " +
            "(CAST(:state AS string) IS NULL OR " +
            "   (CAST(:state AS string) = 'BLOCKED' AND u.status = 'INACTIVE') OR " +
            "   (CAST(:state AS string) = 'NEVER' AND u.lastLogin IS NULL) OR " +
            "   (CAST(:state AS string) = 'LOCKED' AND EXISTS (SELECT 1 FROM FailedLoginAttempt f " +
            "       WHERE f.email = u.email AND f.lockedUntil > :now))) " +
            // The signed-in admin's own account comes first, then everyone by employee ID.
            "ORDER BY CASE WHEN u.id = :me THEN 0 ELSE 1 END, u.employeeId")
    Page<User> searchAccounts(@Param("q") String q, @Param("role") String role, @Param("state") String state,
                              @Param("now") LocalDateTime now, @Param("me") Long me, Pageable pageable);

    /** Active accounts that have never signed in (the "never signed in" count). */
    long countByStatusAndLastLoginIsNull(String status);
}
