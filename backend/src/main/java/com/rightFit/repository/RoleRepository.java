package com.rightFit.repository;

import com.rightFit.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    @Query("SELECT r FROM Role r WHERE r.roleType = 'SYSTEM'")
    List<Role> findAllSystemRoles();

    @Query("SELECT r FROM Role r WHERE r.roleType = 'CUSTOM'")
    List<Role> findAllCustomRoles();

    @Query("SELECT r FROM Role r WHERE r.isModifiable = true")
    List<Role> findAllModifiable();

    @Query("SELECT r FROM Role r WHERE r.isModifiable = false")
    List<Role> findAllImmutable();

    @Query("SELECT COUNT(r) FROM Role r WHERE r.roleType = 'SYSTEM'")
    long countSystemRoles();

    @Query("SELECT COUNT(r) FROM Role r WHERE r.roleType = 'CUSTOM'")
    long countCustomRoles();
}
