package com.rightFit.controller;

import com.rightFit.entity.UserRole;
import com.rightFit.security.SecurityContextUtil;
import com.rightFit.service.UserRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/user-roles")
@RequiredArgsConstructor
@Validated
public class UserRoleManagementController {

    private final UserRoleService userRoleService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasPermission(null, 'USER_ROLE_ASSIGN')")
    public ResponseEntity<List<UserRole>> getUserRoles(@PathVariable Long userId) {
        log.info("Fetching roles for user: {}", userId);
        List<UserRole> userRoles = userRoleService.getUserRoles(userId);
        return ResponseEntity.ok(userRoles);
    }

    @PostMapping("/assign")
    @PreAuthorize("hasPermission(null, 'USER_ROLE_ASSIGN')")
    public ResponseEntity<Void> assignRoleToUser(
            @RequestParam Long userId,
            @RequestParam Long roleId) {
        log.info("Assigning role {} to user {}", roleId, userId);
        Long currentUserId = SecurityContextUtil.getCurrentUserId();
        userRoleService.assignRoleToUser(userId, roleId, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/remove")
    @PreAuthorize("hasPermission(null, 'USER_ROLE_ASSIGN')")
    public ResponseEntity<Void> removeRoleFromUser(
            @RequestParam Long userId,
            @RequestParam Long roleId) {
        log.info("Removing role {} from user {}", roleId, userId);
        userRoleService.removeRoleFromUser(userId, roleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/deactivate")
    @PreAuthorize("hasPermission(null, 'USER_ROLE_ASSIGN')")
    public ResponseEntity<Void> deactivateUserRoles(@RequestParam Long userId) {
        log.info("Deactivating all roles for user: {}", userId);
        userRoleService.deactivateUserRoles(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reactivate")
    @PreAuthorize("hasPermission(null, 'USER_ROLE_ASSIGN')")
    public ResponseEntity<Void> reactivateUserRoles(@RequestParam Long userId) {
        log.info("Reactivating all roles for user: {}", userId);
        userRoleService.reactivateUserRoles(userId);
        return ResponseEntity.noContent().build();
    }
}
