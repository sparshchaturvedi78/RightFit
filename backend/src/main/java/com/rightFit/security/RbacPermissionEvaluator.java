package com.rightFit.security;

import com.rightFit.service.UserRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class RbacPermissionEvaluator implements PermissionEvaluator {

    private final UserRoleService userRoleService;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("User not authenticated");
            return false;
        }

        Long userId = extractUserId(authentication);
        if (userId == null) {
            log.warn("Could not extract user ID from authentication");
            return false;
        }

        String permissionName = permission.toString();
        Set<String> userPermissions = userRoleService.getUserPermissionNames(userId);

        boolean hasPermission = userPermissions.contains(permissionName);
        log.debug("Permission check - User: {}, Permission: {}, Result: {}",
                userId, permissionName, hasPermission);

        return hasPermission;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("User not authenticated");
            return false;
        }

        Long userId = extractUserId(authentication);
        if (userId == null) {
            log.warn("Could not extract user ID from authentication");
            return false;
        }

        String permissionName = permission.toString();
        Set<String> userPermissions = userRoleService.getUserPermissionNames(userId);

        boolean hasPermission = userPermissions.contains(permissionName);
        log.debug("Permission check - User: {}, Target: {} ({}), Permission: {}, Result: {}",
                userId, targetId, targetType, permissionName, hasPermission);

        return hasPermission;
    }

    private Long extractUserId(Authentication authentication) {
        try {
            if (authentication.getDetails() instanceof Long) {
                return (Long) authentication.getDetails();
            }
            if (authentication.getDetails() != null) {
                String detailsStr = authentication.getDetails().toString();
                try {
                    return Long.parseLong(detailsStr);
                } catch (NumberFormatException e) {
                    log.debug("Could not parse user ID from details: {}", detailsStr);
                }
            }
        } catch (Exception e) {
            log.error("Error extracting user ID from authentication: {}", e.getMessage());
        }
        return null;
    }
}
