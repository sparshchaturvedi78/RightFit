package com.rightFit.controller;

import com.rightFit.entity.Permission;
import com.rightFit.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/permissions")
@RequiredArgsConstructor
@Validated
public class AdminPermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        log.info("Fetching all active permissions");
        List<Permission> permissions = permissionService.getAllActivePermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/system")
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<List<Permission>> getSystemPermissions() {
        log.info("Fetching all system permissions");
        List<Permission> permissions = permissionService.getAllSystemPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/custom")
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<List<Permission>> getCustomPermissions() {
        log.info("Fetching all custom permissions");
        List<Permission> permissions = permissionService.getAllCustomPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/{permissionId}")
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<Permission> getPermissionById(@PathVariable Long permissionId) {
        log.info("Fetching permission with ID: {}", permissionId);
        Permission permission = permissionService.getPermissionById(permissionId);
        return ResponseEntity.ok(permission);
    }

    @GetMapping("/name/{permissionName}")
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<Permission> getPermissionByName(@PathVariable String permissionName) {
        log.info("Fetching permission by name: {}", permissionName);
        Permission permission = permissionService.getPermissionByName(permissionName)
                .orElseThrow(() -> new RuntimeException("Permission not found: " + permissionName));
        return ResponseEntity.ok(permission);
    }

    @GetMapping("/resource/{resource}")
    @PreAuthorize("hasPermission(null, 'PERMISSION_VIEW')")
    public ResponseEntity<List<Permission>> getPermissionsByResource(@PathVariable String resource) {
        log.info("Fetching permissions for resource: {}", resource);
        List<Permission> permissions = permissionService.getPermissionsByResource(resource);
        return ResponseEntity.ok(permissions);
    }
}
