package com.rightFit.controller;

import com.rightFit.entity.Role;
import com.rightFit.entity.Permission;
import com.rightFit.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
@Validated
public class AdminRoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'ROLE_VIEW')")
    public ResponseEntity<List<Role>> getAllRoles() {
        log.info("Fetching all roles");
        List<Role> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/system")
    @PreAuthorize("hasPermission(null, 'ROLE_VIEW')")
    public ResponseEntity<List<Role>> getSystemRoles() {
        log.info("Fetching all system roles");
        List<Role> roles = roleService.getAllSystemRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/custom")
    @PreAuthorize("hasPermission(null, 'ROLE_VIEW')")
    public ResponseEntity<List<Role>> getCustomRoles() {
        log.info("Fetching all custom roles");
        List<Role> roles = roleService.getAllCustomRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("hasPermission(null, 'ROLE_VIEW')")
    public ResponseEntity<Role> getRoleById(@PathVariable Long roleId) {
        log.info("Fetching role with ID: {}", roleId);
        Role role = roleService.getRoleById(roleId);
        return ResponseEntity.ok(role);
    }

    @GetMapping("/{roleId}/permissions")
    @PreAuthorize("hasPermission(null, 'ROLE_VIEW')")
    public ResponseEntity<List<String>> getRolePermissions(@PathVariable Long roleId) {
        log.info("Fetching permissions for role ID: {}", roleId);
        List<Permission> permissions = roleService.getRolePermissions(roleId);
        List<String> permissionNames = permissions.stream()
                .map(Permission::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissionNames);
    }
}
