package com.rightFit.service;

import com.rightFit.dto.EmployeeDTO;
import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final EmployeeRepository employeeRepository;
    private final UserRoleRepository userRoleRepository;

    public Page<EmployeeDTO> searchUsers(String query, String role, Double minExperience, Double maxExperience,
                                          String employmentStatus, String allocationStatus, String availabilityStatus,
                                          String poolStatus, Long departmentId, Long locationId, String designation,
                                          String domain, String grade, Long rmgId, Pageable pageable) {
        log.debug("Searching users with filters - role: {}, employmentStatus: {}, allocationStatus: {}",
                role, employmentStatus, allocationStatus);

        Page<Employee> employees = employeeRepository.searchUsers(query, role, minExperience, maxExperience,
                employmentStatus, allocationStatus, availabilityStatus, poolStatus, departmentId, locationId,
                designation, domain, grade, rmgId, pageable);

        return employees.map(this::mapToDTO);
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        Set<String> roles = employee.getUser() != null
                ? userRoleRepository.findByUserIdAndActive(employee.getUser().getId()).stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet())
                : Set.of();

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
                .poolStatus(employee.getPoolStatus())
                .workingHoursPerDay(employee.getWorkingHoursPerDay())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .locationId(employee.getLocation() != null ? employee.getLocation().getId() : null)
                .locationName(employee.getLocation() != null ? employee.getLocation().getName() : null)
                .rmgId(employee.getRmgManager() != null ? employee.getRmgManager().getId() : null)
                .rmgName(employee.getRmgManager() != null ?
                        employee.getRmgManager().getFirstName() + " " + employee.getRmgManager().getLastName() : null)
                .employmentStatus(employee.getEmploymentStatus())
                .allocationStatus(employee.getAllocationStatus())
                .availabilityStatus(employee.getAvailabilityStatus())
                .availableFromDate(employee.getAvailableFromDate())
                .userId(employee.getUser() != null ? employee.getUser().getId() : null)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .roles(roles)
                .build();
    }
}
