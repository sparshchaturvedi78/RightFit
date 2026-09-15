package com.rightFit.repository;

import com.rightFit.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByName(String name);

    @Query("SELECT p FROM Permission p WHERE p.isActive = true ORDER BY p.name")
    List<Permission> findAllActive();

    @Query("SELECT p FROM Permission p WHERE p.resource = :resource AND p.isActive = true")
    List<Permission> findByResourceAndActive(@Param("resource") String resource);

    @Query("SELECT p FROM Permission p WHERE p.resource = :resource AND p.action = :action AND p.isActive = true")
    Optional<Permission> findByResourceAndActionAndActive(
            @Param("resource") String resource,
            @Param("action") String action);

    @Query("SELECT p FROM Permission p WHERE p.isSystem = true AND p.isActive = true")
    List<Permission> findAllSystemPermissions();

    @Query("SELECT p FROM Permission p WHERE p.isSystem = false AND p.isActive = true")
    List<Permission> findAllCustomPermissions();

    @Query("SELECT COUNT(p) FROM Permission p WHERE p.isSystem = true AND p.isActive = true")
    long countSystemPermissions();

    @Query("SELECT p FROM Permission p WHERE p.name IN :names AND p.isActive = true")
    List<Permission> findByNamesAndActive(@Param("names") Set<String> names);
}
