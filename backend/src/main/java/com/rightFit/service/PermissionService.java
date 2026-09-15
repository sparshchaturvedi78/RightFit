package com.rightFit.service;

import com.rightFit.entity.Permission;
import com.rightFit.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public Permission getPermissionById(Long permissionId) {
        return permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + permissionId));
    }

    @Transactional(readOnly = true)
    public Optional<Permission> getPermissionByName(String name) {
        return permissionRepository.findByName(name);
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllActivePermissions() {
        log.debug("Fetching all active permissions");
        return permissionRepository.findAllActive();
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllSystemPermissions() {
        log.debug("Fetching all system-defined permissions");
        return permissionRepository.findAllSystemPermissions();
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllCustomPermissions() {
        log.debug("Fetching all custom permissions");
        return permissionRepository.findAllCustomPermissions();
    }

    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByResource(String resource) {
        log.debug("Fetching permissions for resource: {}", resource);
        return permissionRepository.findByResourceAndActive(resource);
    }

    @Transactional(readOnly = true)
    public Optional<Permission> getPermissionByResourceAndAction(String resource, String action) {
        log.debug("Fetching permission for resource: {}, action: {}", resource, action);
        return permissionRepository.findByResourceAndActionAndActive(resource, action);
    }

    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByNames(Set<String> names) {
        log.debug("Fetching permissions by names: {}", names);
        return permissionRepository.findByNamesAndActive(names);
    }

    @Transactional(readOnly = true)
    public long countSystemPermissions() {
        return permissionRepository.countSystemPermissions();
    }

    public Permission createPermission(Permission permission) {
        log.info("Creating new permission: {}", permission.getName());
        permission.setIsSystem(false);
        permission.setIsActive(true);
        return permissionRepository.save(permission);
    }

    public Permission updatePermission(Long permissionId, Permission updatedPermission) {
        Permission permission = getPermissionById(permissionId);

        // Prevent modification of system permissions
        if (permission.getIsSystem()) {
            throw new RuntimeException("Cannot modify system-defined permission: " + permission.getName());
        }

        log.info("Updating permission: {}", permissionId);
        permission.setDescription(updatedPermission.getDescription());
        permission.setScope(updatedPermission.getScope());

        return permissionRepository.save(permission);
    }

    public void deletePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);

        if (permission.getIsSystem()) {
            throw new RuntimeException("Cannot delete system-defined permission: " + permission.getName());
        }

        log.info("Deleting permission: {} ({})", permission.getName(), permissionId);
        permissionRepository.deleteById(permissionId);
    }

    public void deactivatePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);

        if (permission.getIsSystem()) {
            throw new RuntimeException("Cannot deactivate system-defined permission: " + permission.getName());
        }

        log.info("Deactivating permission: {} ({})", permission.getName(), permissionId);
        permission.setIsActive(false);
        permissionRepository.save(permission);
    }

    public void reactivatePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);

        log.info("Reactivating permission: {} ({})", permission.getName(), permissionId);
        permission.setIsActive(true);
        permissionRepository.save(permission);
    }
}
