package com.rightFit.controller;

import com.rightFit.dto.AccountReasonRequest;
import com.rightFit.dto.UserAccountDTO;
import com.rightFit.dto.UserAccountSummaryDTO;
import com.rightFit.service.AdminUserAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Admin Users page: login accounts, sign-in state, and block / unblock / unlock. */
@Slf4j
@RestController
@RequestMapping("/api/admin/users/accounts")
@RequiredArgsConstructor
@Validated
public class AdminUserAccountController {

    private final AdminUserAccountService accountService;

    /** One page of accounts. state: BLOCKED, LOCKED or NEVER (anything else = all). */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_READ')")
    public ResponseEntity<Page<UserAccountDTO>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(accountService.search(q, role, state, page, size));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_READ')")
    public ResponseEntity<UserAccountSummaryDTO> summary() {
        return ResponseEntity.ok(accountService.summary());
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_READ')")
    public ResponseEntity<UserAccountDTO> get(@PathVariable Long userId) {
        return ResponseEntity.ok(accountService.get(userId));
    }

    @PutMapping("/{userId}/block")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_DEACTIVATE')")
    public ResponseEntity<UserAccountDTO> block(@PathVariable Long userId, @RequestBody AccountReasonRequest request) {
        log.info("Blocking sign-in for user {}", userId);
        return ResponseEntity.ok(accountService.block(userId, request));
    }

    @PutMapping("/{userId}/unblock")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_DEACTIVATE')")
    public ResponseEntity<UserAccountDTO> unblock(@PathVariable Long userId, @RequestBody AccountReasonRequest request) {
        log.info("Unblocking sign-in for user {}", userId);
        return ResponseEntity.ok(accountService.unblock(userId, request));
    }

    @PutMapping("/{userId}/unlock")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_UPDATE')")
    public ResponseEntity<UserAccountDTO> unlock(@PathVariable Long userId, @RequestBody AccountReasonRequest request) {
        log.info("Unlocking account for user {}", userId);
        return ResponseEntity.ok(accountService.unlock(userId, request));
    }
}
