package com.rightFit.service;

import com.rightFit.entity.Role;
import com.rightFit.entity.RolePermission;
import com.rightFit.entity.Permission;
import com.rightFit.exception.SystemRoleModificationException;
import com.rightFit.repository.RoleRepository;
import com.rightFit.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionService permissionService;

    // System role names (protected)
    private static final Set<String> SYSTEM_ROLES = Set.of("ADMIN", "MANAGER", "RMG", "ASSOCIATE");

    @Transactional(readOnly = true)
    public Role getRoleById(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
    }

    @Transactional(readOnly = true)
    public Optional<Role> getRoleByName(String name) {
        return roleRepository.findByName(name);
    }

    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {
        log.debug("Fetching all roles");
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Role> getAllSystemRoles() {
        log.debug("Fetching all system roles");
        return roleRepository.findAll().stream()
                .filter(r -> "SYSTEM".equals(r.getRoleType()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Role> getAllCustomRoles() {
        log.debug("Fetching all custom roles");
        return roleRepository.findAll().stream()
                .filter(r -> "CUSTOM".equals(r.getRoleType()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Permission> getRolePermissions(Long roleId) {
        log.debug("Fetching permissions for role: {}", roleId);
        return rolePermissionRepository.findByRoleId(roleId)
                .stream()
                .map(RolePermission::getPermission)
                .collect(Collectors.toList());
    }

    public Role createRole(Role role) {
        validateRoleNameUniqueness(role.getName());

        log.info("Creating new custom role: {}", role.getName());
        role.setRoleType("CUSTOM");
        role.setIsModifiable(true);

        return roleRepository.save(role);
    }

    public Role updateRole(Long roleId, Role updatedRole) {
        Role role = getRoleById(roleId);

        // Prevent modification of system roles
        if (!role.getIsModifiable()) {
            throw new SystemRoleModificationException(role.getName(),
                    "Cannot modify system role: " + role.getName());
        }

        log.info("Updating role: {} ({})", role.getName(), roleId);
        role.setDescription(updatedRole.getDescription());

        return roleRepository.save(role);
    }

    public void deleteRole(Long roleId) {
        Role role = getRoleById(roleId);

        // Prevent deletion of system roles
        if ("SYSTEM".equals(role.getRoleType())) {
            throw new SystemRoleModificationException(role.getName(),
                    "Cannot delete system role: " + role.getName());
        }

        log.info("Deleting role: {} ({})", role.getName(), roleId);
        roleRepository.deleteById(roleId);
    }

    public void assignPermissionToRole(Long roleId, Long permissionId) {
        Role role = getRoleById(roleId);
        Permission permission = permissionService.getPermissionById(permissionId);

        // Prevent permission assignment to system roles in MVP
        if ("SYSTEM".equals(role.getRoleType())) {
            throw new SystemRoleModificationException(role.getName(),
                    "Cannot assign permissions to system roles in Phase 3.1. " +
                    "Custom role creation and permission management deferred to Phase 3.2+");
        }

        // Check if already assigned
        if (rolePermissionRepository.findByRoleIdAndPermissionId(roleId, permissionId).isPresent()) {
            log.warn("Permission {} already assigned to role {}", permissionId, roleId);
            return;
        }

        log.info("Assigning permission {} to role {} ({})",
                permission.getName(), role.getName(), roleId);

        RolePermission rolePermission = RolePermission.builder()
                .role(role)
                .permission(permission)
                .build();

        rolePermissionRepository.save(rolePermission);
    }

    public void removePermissionFromRole(Long roleId, Long permissionId) {
        Role role = getRoleById(roleId);

        // Prevent permission removal from system roles
        if ("SYSTEM".equals(role.getRoleType())) {
            throw new SystemRoleModificationException(role.getName(),
                    "Cannot remove permissions from system roles: " + role.getName());
        }

        // Prevent removing all permissions from ADMIN role
        if ("ADMIN".equals(role.getName())) {
            long permissionCount = rolePermissionRepository.countByRoleId(roleId);
            if (permissionCount <= 1) {
                throw new RuntimeException("Cannot remove all permissions from ADMIN role");
            }
        }

        log.info("Removing permission {} from role {} ({})",
                permissionId, role.getName(), roleId);

        rolePermissionRepository.deleteByRoleIdAndPermissionId(roleId, permissionId);
    }

    public boolean isSystemRole(String roleName) {
        return SYSTEM_ROLES.contains(roleName);
    }

    public boolean isSystemRole(Long roleId) {
        Role role = getRoleById(roleId);
        return "SYSTEM".equals(role.getRoleType());
    }

    private void validateRoleNameUniqueness(String name) {
        if (roleRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Role with name '" + name + "' already exists");
        }
    }
}
