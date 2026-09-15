package com.rightFit.controller;

import com.rightFit.dto.CreateEmployeeRequest;
import com.rightFit.dto.UpdateEmployeeRequest;
import com.rightFit.dto.ChangeRmgRequest;
import com.rightFit.dto.DeactivateEmployeeRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.service.EmployeeManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
@Validated
public class AdminEmployeeController {

    private final EmployeeManagementService employeeManagementService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CREATE')")
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        log.info("Creating employee: {}", request.getEmployeeId());
        EmployeeDTO employee = employeeManagementService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(employee);
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_VIEW')")
    public ResponseEntity<Page<EmployeeDTO>> getEmployees(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String designation,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long rmgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        log.info("Fetching employees with filters");

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<EmployeeDTO> employees = employeeManagementService.getEmployees(
                employeeId, firstName, lastName, email, status, designation, departmentId, rmgId, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_VIEW')")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long employeeId) {
        log.info("Fetching employee: {}", employeeId);
        EmployeeDTO employee = employeeManagementService.getEmployee(employeeId);
        return ResponseEntity.ok(employee);
    }

    @PutMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_UPDATE')")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        log.info("Updating employee: {}", employeeId);
        EmployeeDTO employee = employeeManagementService.updateEmployee(employeeId, request);
        return ResponseEntity.ok(employee);
    }

    @PutMapping("/{employeeId}/rmg")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_UPDATE')")
    public ResponseEntity<Void> changeRmg(
            @PathVariable Long employeeId,
            @Valid @RequestBody ChangeRmgRequest request) {
        log.info("Changing RMG for employee: {}", employeeId);
        employeeManagementService.changeRmg(employeeId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{employeeId}/deactivate")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_DEACTIVATE')")
    public ResponseEntity<Void> deactivateEmployee(
            @PathVariable Long employeeId,
            @Valid @RequestBody DeactivateEmployeeRequest request) {
        log.info("Deactivating employee: {}", employeeId);
        employeeManagementService.deactivateEmployee(employeeId, request);
        return ResponseEntity.noContent().build();
    }
}
