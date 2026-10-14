package com.rightFit.repository;

import com.rightFit.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserId(Long userId);

    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.isActive = true")
    List<UserRole> findByUserIdAndActive(@Param("userId") Long userId);

    /** [userId, roleName] pairs for many users at once (Admin Employees list). */
    @Query("SELECT ur.user.id, r.name FROM UserRole ur JOIN ur.role r WHERE ur.isActive = true AND ur.user.id IN :userIds")
    List<Object[]> findActiveRoleNamesByUserIds(@Param("userIds") java.util.Collection<Long> userIds);

    /** [userId, role code] pairs (ADMIN, MANAGER, RMG, ASSOCIATE) for many users at once (Admin Users page). */
    @Query("SELECT ur.user.id, r.code FROM UserRole ur JOIN ur.role r WHERE ur.isActive = true AND ur.user.id IN :userIds")
    List<Object[]> findActiveRoleCodesByUserIds(@Param("userIds") java.util.Collection<Long> userIds);

    /** [role code, number of distinct accounts holding it] — the Users page's per-role totals. */
    @Query("SELECT r.code, COUNT(DISTINCT ur.user.id) FROM UserRole ur JOIN ur.role r WHERE ur.isActive = true GROUP BY r.code")
    List<Object[]> countAccountsPerRoleCode();

    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.role.id = :roleId")
    Optional<UserRole> findByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);

    @Query("SELECT ur FROM UserRole ur WHERE ur.role.id = :roleId")
    List<UserRole> findByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT ur FROM UserRole ur WHERE ur.role.id = :roleId AND ur.isActive = true")
    List<UserRole> findByRoleIdAndActive(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(ur) FROM UserRole ur WHERE ur.role.id = :roleId AND ur.isActive = true")
    long countByRoleIdAndActive(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(ur) FROM UserRole ur WHERE ur.user.id = :userId AND ur.isActive = true")
    long countByUserIdAndActive(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId AND ur.role.id = :roleId")
    void deleteByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);
}
