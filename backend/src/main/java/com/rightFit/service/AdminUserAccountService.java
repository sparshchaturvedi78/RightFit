package com.rightFit.service;

import com.rightFit.dto.AccountReasonRequest;
import com.rightFit.dto.UserAccountDTO;
import com.rightFit.dto.UserAccountSummaryDTO;
import com.rightFit.entity.Employee;
import com.rightFit.entity.FailedLoginAttempt;
import com.rightFit.entity.User;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.FailedLoginAttemptRepository;
import com.rightFit.repository.LoginEventRepository;
import com.rightFit.repository.UserRepository;
import com.rightFit.repository.UserRoleRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The Admin Users page: login accounts, whether they can sign in, and the block / unblock / unlock actions.
 * Roles are only read here; they are changed on the Employees page.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserAccountService {

    /** Prefix on the block reason of an account blocked because its employee was deactivated. */
    public static final String EMPLOYEE_DEACTIVATED_PREFIX = "Employee deactivated: ";
    private static final Set<String> STATES = Set.of("BLOCKED", "LOCKED", "NEVER");
    private static final List<String> ROLE_ORDER = List.of("ADMIN", "MANAGER", "RMG", "ASSOCIATE");

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final FailedLoginAttemptRepository failedLoginAttemptRepository;
    private final LoginEventRepository loginEventRepository;
    private final UserRoleService userRoleService;
    private final AuditLogService auditLogService;
    private final RequirementAccessGuard accessGuard;

    @Transactional(readOnly = true)
    public Page<UserAccountDTO> search(String q, String role, String state, int page, int size) {
        String query = q == null || q.isBlank() ? null : q.trim();
        String roleCode = role == null || role.isBlank() ? null : role.trim().toUpperCase();
        String stateCode = state == null ? null : state.trim().toUpperCase();
        if (stateCode != null && !STATES.contains(stateCode)) {
            stateCode = null;
        }
        int safeSize = Math.max(1, Math.min(size, 100));
        Long me = SecurityContextUtil.getCurrentUserId();
        // The order (own account first, then employee ID) is set in the query itself.
        Page<User> users = userRepository.searchAccounts(query, roleCode, stateCode, LocalDateTime.now(), me,
                PageRequest.of(Math.max(0, page), safeSize));

        List<Long> ids = users.getContent().stream().map(User::getId).toList();
        Map<Long, List<String>> roles = rolesByUser(ids);
        Map<String, FailedLoginAttempt> failures = failuresByEmail(users.getContent());
        LocalDateTime now = LocalDateTime.now();
        return users.map(u -> toDto(u, roles.getOrDefault(u.getId(), List.of()),
                failures.get(u.getEmail()), now));
    }

    @Transactional(readOnly = true)
    public UserAccountDTO get(Long userId) {
        User user = findUser(userId);
        Map<Long, List<String>> roles = rolesByUser(List.of(userId));
        FailedLoginAttempt failure = failedLoginAttemptRepository.findByEmail(user.getEmail()).orElse(null);
        return toDto(user, roles.getOrDefault(userId, List.of()), failure, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public UserAccountSummaryDTO summary() {
        LocalDateTime now = LocalDateTime.now();

        Map<String, Long> byRole = new HashMap<>();
        for (String code : ROLE_ORDER) {
            byRole.put(code, 0L);
        }
        for (Object[] row : userRoleRepository.countAccountsPerRoleCode()) {
            byRole.put((String) row[0], ((Number) row[1]).longValue());
        }

        Map<String, Long> perDay = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (Object[] row : loginEventRepository.countPerDaySince(today.minusDays(13).atStartOfDay())) {
            perDay.put(row[0].toString(), ((Number) row[1]).longValue());
        }
        List<UserAccountSummaryDTO.DayCount> series = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            String day = today.minusDays(i).toString();
            series.add(UserAccountSummaryDTO.DayCount.builder().date(day).count(perDay.getOrDefault(day, 0L)).build());
        }

        return UserAccountSummaryDTO.builder()
                .totalAccounts(userRepository.count())
                .accountsByRole(byRole)
                .blocked(userRepository.countByStatus("INACTIVE"))
                .locked(failedLoginAttemptRepository.countByLockedUntilAfter(now))
                .neverSignedIn(userRepository.countByStatusAndLastLoginIsNull("ACTIVE"))
                .signInsToday(perDay.getOrDefault(today.toString(), 0L))
                .signIns(series)
                .build();
    }

    public UserAccountDTO block(Long userId, AccountReasonRequest request) {
        String reason = requireReason(request);
        User user = findUser(userId);
        Long me = SecurityContextUtil.getCurrentUserId();
        if (user.getId().equals(me)) {
            throw new BusinessRuleException("You can't block your own account.");
        }
        if ("INACTIVE".equals(user.getStatus())) {
            throw new BusinessRuleException(user.getEmployeeId() + " is already blocked.");
        }
        if (holdsRole(user, "ADMIN") && userRoleService.countActiveAdmins() <= 1) {
            throw new BusinessRuleException("This is the last active Admin, so their account can't be blocked.");
        }

        user.setStatus("INACTIVE");
        user.setBlockReason(reason);
        user.setBlockedBy(actorLabel());
        user.setBlockedAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.logAction(me, "ACCOUNT_BLOCKED", "USER", user.getId(), "ACTIVE", "INACTIVE", reason);
        return get(userId);
    }

    public UserAccountDTO unblock(Long userId, AccountReasonRequest request) {
        String reason = requireReason(request);
        User user = findUser(userId);
        if ("ACTIVE".equals(user.getStatus())) {
            throw new BusinessRuleException(user.getEmployeeId() + " can already sign in.");
        }
        Employee employee = user.getEmployee();
        if (employee != null && "INACTIVE".equals(employee.getEmploymentStatus())) {
            throw new BusinessRuleException(employee.getFirstName() + " " + employee.getLastName()
                    + " is deactivated. Reactivate them on Employees first.");
        }

        user.setStatus("ACTIVE");
        user.setBlockReason(null);
        user.setBlockedBy(null);
        user.setBlockedAt(null);
        userRepository.save(user);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ACCOUNT_UNBLOCKED", "USER", user.getId(),
                "INACTIVE", "ACTIVE", reason);
        return get(userId);
    }

    public UserAccountDTO unlock(Long userId, AccountReasonRequest request) {
        String reason = requireReason(request);
        User user = findUser(userId);
        FailedLoginAttempt failure = failedLoginAttemptRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new BusinessRuleException(user.getEmployeeId() + " isn't locked."));
        if (failure.getLockedUntil() == null || !failure.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException(user.getEmployeeId() + " isn't locked.");
        }

        failure.setLockedUntil(null);
        failure.setAttemptCount(0);
        failedLoginAttemptRepository.save(failure);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "ACCOUNT_UNLOCKED", "USER", user.getId(),
                "LOCKED", "ACTIVE", reason);
        return get(userId);
    }

    // ---- helpers -----------------------------------------------------------------------------------------------

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", String.valueOf(userId)));
    }

    private static String requireReason(AccountReasonRequest request) {
        String reason = request == null || request.getReason() == null ? "" : request.getReason().trim();
        if (reason.length() < 3) {
            throw new BusinessRuleException("Give a reason of at least 3 characters. It is kept in the audit log.");
        }
        return reason.length() > 500 ? reason.substring(0, 500) : reason;
    }

    private boolean holdsRole(User user, String code) {
        return rolesByUser(List.of(user.getId())).getOrDefault(user.getId(), List.of()).contains(code);
    }

    private Map<Long, List<String>> rolesByUser(List<Long> userIds) {
        Map<Long, List<String>> roles = new HashMap<>();
        if (userIds.isEmpty()) {
            return roles;
        }
        for (Object[] row : userRoleRepository.findActiveRoleCodesByUserIds(userIds)) {
            roles.computeIfAbsent((Long) row[0], k -> new ArrayList<>()).add((String) row[1]);
        }
        roles.values().forEach(list -> list.sort((a, b) -> ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)));
        return roles;
    }

    private Map<String, FailedLoginAttempt> failuresByEmail(List<User> users) {
        List<String> emails = users.stream().map(User::getEmail).toList();
        Map<String, FailedLoginAttempt> byEmail = new HashMap<>();
        if (!emails.isEmpty()) {
            failedLoginAttemptRepository.findByEmailIn(emails).forEach(f -> byEmail.put(f.getEmail(), f));
        }
        return byEmail;
    }

    private UserAccountDTO toDto(User u, List<String> roles, FailedLoginAttempt failure, LocalDateTime now) {
        boolean locked = failure != null && failure.getLockedUntil() != null && failure.getLockedUntil().isAfter(now);
        String state = "INACTIVE".equals(u.getStatus()) ? "BLOCKED" : locked ? "LOCKED" : "ALLOWED";
        Employee e = u.getEmployee();
        return UserAccountDTO.builder()
                .userId(u.getId())
                .employeeId(u.getEmployeeId())
                .name(e != null ? e.getFirstName() + " " + e.getLastName() : null)
                .email(u.getEmail())
                .status(u.getStatus())
                .signInState(state)
                .neverSignedIn(u.getLastLogin() == null)
                .lastLoginAt(u.getLastLogin())
                .createdAt(u.getCreatedAt())
                .roles(roles)
                .employmentStatus(e != null ? e.getEmploymentStatus() : null)
                .blockReason(u.getBlockReason())
                .blockedBy(u.getBlockedBy())
                .blockedAt(u.getBlockedAt())
                .lockedUntil(locked ? failure.getLockedUntil() : null)
                .self(u.getId().equals(SecurityContextUtil.getCurrentUserId()))
                .build();
    }

    private String actorLabel() {
        Employee me = accessGuard.currentEmployeeOrNull();
        return me == null ? "System" : me.getFirstName() + " " + me.getLastName() + " (" + me.getEmployeeId() + ")";
    }
}
