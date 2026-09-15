package com.rightFit.controller;

import com.rightFit.entity.Permission;
import com.rightFit.service.RoleService;
import com.rightFit.repository.RolePermissionRepository;
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
@RequestMapping("/api/admin/role-permissions")
@RequiredArgsConstructor
@Validated
public class RolePermissionManagementController {

    private final RoleService roleService;
    private final RolePermissionRepository rolePermissionRepository;

    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasPermission(null, 'ROLE_PERMISSION_VIEW')")
    public ResponseEntity<List<Permission>> getRolePermissions(@PathVariable Long roleId) {
        log.info("Fetching permissions for role: {}", roleId);
        List<Permission> permissions = roleService.getRolePermissions(roleId);
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/permission/{permissionId}/roles")
    @PreAuthorize("hasPermission(null, 'ROLE_PERMISSION_VIEW')")
    public ResponseEntity<List<Long>> getRolesWithPermission(@PathVariable Long permissionId) {
        log.info("Fetching roles with permission: {}", permissionId);
        List<Long> roleIds = rolePermissionRepository.findByPermissionId(permissionId)
                .stream()
                .map(rp -> rp.getRole().getId())
                .collect(Collectors.toList());
        return ResponseEntity.ok(roleIds);
    }

    @GetMapping("/role/{roleId}/permission/{permissionId}")
    @PreAuthorize("hasPermission(null, 'ROLE_PERMISSION_VIEW')")
    public ResponseEntity<Boolean> hasRolePermission(
            @PathVariable Long roleId,
            @PathVariable Long permissionId) {
        log.info("Checking if role {} has permission {}", roleId, permissionId);
        boolean has = rolePermissionRepository.findByRoleIdAndPermissionId(roleId, permissionId).isPresent();
        return ResponseEntity.ok(has);
    }
}
