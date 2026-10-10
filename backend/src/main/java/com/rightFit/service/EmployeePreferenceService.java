package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.EmployeePreferenceDTO;
import com.rightFit.dto.AssociateProfileDtos.UpdateEmployeePreferenceRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.EmployeePreference;
import com.rightFit.repository.EmployeePreferenceRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Associate Phase: self-service preferences (BRD 18). One row per employee; created lazily on
 * first access. Every field can be set back to null to clear it. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeePreferenceService {

    private final EmployeePreferenceRepository preferenceRepository;
    private final RequirementAccessGuard accessGuard;
    private final AuditLogService auditLogService;

    public EmployeePreferenceDTO getMine() {
        return toDTO(findOrCreate(accessGuard.currentEmployee()));
    }

    public EmployeePreferenceDTO updateMine(UpdateEmployeePreferenceRequest request) {
        Employee employee = accessGuard.currentEmployee();
        EmployeePreference preference = findOrCreate(employee);

        preference.setPreferredTechnology(request.getPreferredTechnology());
        preference.setPreferredDomain(request.getPreferredDomain());
        preference.setPreferredLocation(request.getPreferredLocation());
        preference.setPreferredWorkMode(request.getPreferredWorkMode());
        preference.setPreferredProjectType(request.getPreferredProjectType());
        EmployeePreference saved = preferenceRepository.save(preference);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_PREFERENCE_UPDATED",
                "EMPLOYEE_PREFERENCE", saved.getId(), null, null,
                employee.getEmployeeId() + " updated preferences");
        return toDTO(saved);
    }

    private EmployeePreference findOrCreate(Employee employee) {
        return preferenceRepository.findByEmployeeId(employee.getId())
                .orElseGet(() -> preferenceRepository.save(EmployeePreference.builder()
                        .employee(employee)
                        .build()));
    }

    private EmployeePreferenceDTO toDTO(EmployeePreference preference) {
        return EmployeePreferenceDTO.builder()
                .preferredTechnology(preference.getPreferredTechnology())
                .preferredDomain(preference.getPreferredDomain())
                .preferredLocation(preference.getPreferredLocation())
                .preferredWorkMode(preference.getPreferredWorkMode())
                .preferredProjectType(preference.getPreferredProjectType())
                .build();
    }
}
