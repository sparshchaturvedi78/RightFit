package com.rightFit.repository;

import com.rightFit.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId")
    List<RolePermission> findByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT rp FROM RolePermission rp WHERE rp.permission.id = :permissionId")
    List<RolePermission> findByPermissionId(@Param("permissionId") Long permissionId);

    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    Optional<RolePermission> findByRoleIdAndPermissionId(
            @Param("roleId") Long roleId,
            @Param("permissionId") Long permissionId);

    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    void deleteByRoleIdAndPermissionId(
            @Param("roleId") Long roleId,
            @Param("permissionId") Long permissionId);

    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId ORDER BY rp.permission.name")
    List<RolePermission> findByRoleIdOrderByPermissionName(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(rp) FROM RolePermission rp WHERE rp.role.id = :roleId")
    long countByRoleId(@Param("roleId") Long roleId);
}
