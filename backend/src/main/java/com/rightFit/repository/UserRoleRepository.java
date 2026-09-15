package com.rightFit.repository;

import com.rightFit.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId AND ur.role.id = :roleId")
    void deleteByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);
}
