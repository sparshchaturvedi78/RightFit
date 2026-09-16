package com.rightFit.service;

import com.rightFit.dto.EmployeeSearchRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeSearchService {

    private final EmployeeRepository employeeRepository;

    public Page<EmployeeDTO> searchEmployees(EmployeeSearchRequest request) {
        log.debug("Quick-searching employees with query: {}", request.getQuery());

        int page = request.getPage() != null && request.getPage() > 0 ? request.getPage() : 0;
        int size = request.getSize() != null && request.getSize() > 0 ? request.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "firstName"));

        Page<Employee> employees = employeeRepository.quickSearch(request.getQuery(), pageable);

        return employees.map(this::mapToDTO);
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .designation(employee.getDesignation())
                .domain(employee.getDomain())
                .employmentStatus(employee.getEmploymentStatus())
                .allocationStatus(employee.getAllocationStatus())
                .availabilityStatus(employee.getAvailabilityStatus())
                .rmgId(employee.getRmgManager() != null ? employee.getRmgManager().getId() : null)
                .rmgName(employee.getRmgManager() != null ?
                        employee.getRmgManager().getFirstName() + " " + employee.getRmgManager().getLastName() : null)
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .build();
    }
}
