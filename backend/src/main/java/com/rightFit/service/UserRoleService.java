package com.rightFit.service;

import com.rightFit.entity.User;
import com.rightFit.entity.Role;
import com.rightFit.entity.UserRole;
import com.rightFit.exception.InvalidRoleAssignmentException;
import com.rightFit.exception.LastAdminException;
import com.rightFit.repository.UserRepository;
import com.rightFit.repository.RoleRepository;
import com.rightFit.repository.UserRoleRepository;
import com.rightFit.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionService permissionService;

    @Transactional(readOnly = true)
    public List<UserRole> getUserRoles(Long userId) {
        return userRoleRepository.findByUserIdAndActive(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> getUserPermissionIds(Long userId) {
        List<UserRole> userRoles = getUserRoles(userId);
        return userRoles.stream()
                .flatMap(ur -> rolePermissionRepository.findByRoleId(ur.getRole().getId())
                        .stream()
                        .map(rp -> rp.getPermission().getId()))
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Set<String> getUserPermissionNames(Long userId) {
        List<UserRole> userRoles = getUserRoles(userId);
        return userRoles.stream()
                .flatMap(ur -> ur.getRole().getRolePermissions().stream())
                .map(rp -> rp.getPermission().getName())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public boolean userHasRole(Long userId, Long roleId) {
        return userRoleRepository.findByUserIdAndRoleId(userId, roleId).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean userHasRole(Long userId, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        return userHasRole(userId, role.getId());
    }

    public void assignRoleToUser(Long userId, Long roleId, Long assignedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        // Special handling for ADMIN role
        if ("ADMIN".equals(role.getName())) {
            log.warn("Assigning ADMIN role to user {} - this requires explicit authorization", userId);
            // In production, this should require explicit confirmation or two-factor auth
        }

        // Check if already assigned
        if (userHasRole(userId, roleId)) {
            log.warn("Role {} already assigned to user {}", roleId, userId);
            return;
        }

        log.info("Assigning role {} ({}) to user {} ({})",
                role.getName(), roleId, user.getEmail(), userId);

        UserRole userRole = UserRole.builder()
                .user(user)
                .role(role)
                .assignedBy(assignedBy)
                .isActive(true)
                .build();

        userRoleRepository.save(userRole);
    }

    public void removeRoleFromUser(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        // Prevent removal of ADMIN role if it's the last admin
        if ("ADMIN".equals(role.getName())) {
            long adminUserCount = userRoleRepository.findByRoleIdAndActive(roleId)
                    .stream()
                    .filter(ur -> "ACTIVE".equals(ur.getUser().getStatus()))
                    .count();

            if (adminUserCount <= 1) {
                throw new LastAdminException(
                        "Cannot remove the last active ADMIN user (" + user.getEmail() + ") from the system");
            }
        }

        log.info("Removing role {} ({}) from user {} ({})",
                role.getName(), roleId, user.getEmail(), userId);

        userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);
    }

    public void deactivateUserRoles(Long userId) {
        log.info("Deactivating all roles for user: {}", userId);
        userRoleRepository.findByUserId(userId)
                .forEach(ur -> {
                    ur.setIsActive(false);
                    userRoleRepository.save(ur);
                });
    }

    public void reactivateUserRoles(Long userId) {
        log.info("Reactivating all roles for user: {}", userId);
        userRoleRepository.findByUserId(userId)
                .forEach(ur -> {
                    ur.setIsActive(true);
                    userRoleRepository.save(ur);
                });
    }

    @Transactional(readOnly = true)
    public long countActiveAdmins() {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));
        return userRoleRepository.findByRoleIdAndActive(adminRole.getId())
                .stream()
                .filter(ur -> "ACTIVE".equals(ur.getUser().getStatus()))
                .count();
    }
}
