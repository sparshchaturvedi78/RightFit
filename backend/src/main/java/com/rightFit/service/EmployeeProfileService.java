package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.UpdateProfileRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Associate Phase: basic profile self-service. Only `phone` is editable - everything else on the
 * Employee row is organizational, not personal, and stays Admin-only (BRD 18). */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeProfileService {

    private final EmployeeRepository employeeRepository;
    private final RequirementAccessGuard accessGuard;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public EmployeeDTO getMine() {
        return toDTO(accessGuard.currentEmployee());
    }

    public EmployeeDTO updateMine(UpdateProfileRequest request) {
        Employee employee = accessGuard.currentEmployee();
        String before = employee.getPhone();
        employee.setPhone(request.getPhone());
        Employee updated = employeeRepository.save(employee);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_PROFILE_UPDATED", "EMPLOYEE",
                employee.getId(), before, request.getPhone(), "Phone number updated via self-service");
        return toDTO(updated);
    }

    private EmployeeDTO toDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .grade(employee.getGrade())
                .designation(employee.getDesignation())
                .domain(employee.getDomain())
                .yearsOfExperience(employee.getYearsOfExperience())
                .dateOfJoining(employee.getDateOfJoining())
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .employmentStatus(employee.getEmploymentStatus())
                .allocationStatus(employee.getAllocationStatus())
                .availabilityStatus(employee.getAvailabilityStatus())
                .build();
    }
}
