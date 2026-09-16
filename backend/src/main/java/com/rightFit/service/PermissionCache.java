package com.rightFit.service;

import com.rightFit.entity.Permission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionCache {

    private final PermissionService permissionService;

    @Cacheable(value = "permissions", unless = "#result == null || #result.isEmpty()")
    public List<Permission> getAllActivePermissions() {
        log.debug("Loading all active permissions into cache");
        return permissionService.getAllActivePermissions();
    }

    @Cacheable(value = "systemPermissions", unless = "#result == null || #result.isEmpty()")
    public List<Permission> getAllSystemPermissions() {
        log.debug("Loading all system permissions into cache");
        return permissionService.getAllSystemPermissions();
    }

    @Cacheable(value = "permissionsByRole", key = "#roleId", unless = "#result == null || #result.isEmpty()")
    public Set<String> getPermissionNamesByRoleId(Long roleId) {
        log.debug("Loading permissions for role {} into cache", roleId);
        // This would be implemented when we create role permission retrieval
        return Set.of();
    }

    @Cacheable(value = "permissionsByUser", key = "#userId", unless = "#result == null || #result.isEmpty()")
    public Set<String> getEffectivePermissionsByUserId(Long userId) {
        log.debug("Loading effective permissions for user {} into cache", userId);
        // This would be implemented when we create user role and permission retrieval
        return Set.of();
    }

    @CacheEvict(value = "permissions", allEntries = true)
    public void invalidatePermissionsCache() {
        log.info("Invalidating all permissions cache");
    }

    @CacheEvict(value = "systemPermissions", allEntries = true)
    public void invalidateSystemPermissionsCache() {
        log.info("Invalidating system permissions cache");
    }

    @CacheEvict(value = "permissionsByRole", key = "#roleId")
    public void invalidateRolePermissionsCache(Long roleId) {
        log.info("Invalidating permissions cache for role: {}", roleId);
    }

    @CacheEvict(value = "permissionsByUser", key = "#userId")
    public void invalidateUserPermissionsCache(Long userId) {
        log.info("Invalidating permissions cache for user: {}", userId);
    }

    @CacheEvict(value = {"permissions", "systemPermissions", "permissionsByRole", "permissionsByUser"}, allEntries = true)
    public void invalidateAllCaches() {
        log.info("Invalidating ALL permission caches");
    }
}
