package com.rightFit.service;

import com.rightFit.dto.RmgDetailDTO;
import com.rightFit.entity.Employee;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RmgDashboardService {

    private final EmployeeRepository employeeRepository;

    public List<RmgDetailDTO> getAllRmgs() {
        log.debug("Fetching all RMGs with associate counts");

        List<Employee> rmgs = employeeRepository.findAll().stream()
                .filter(e -> e.getSubordinates() != null && !e.getSubordinates().isEmpty())
                .collect(Collectors.toList());

        return rmgs.stream()
                .map(this::mapToRmgDetail)
                .collect(Collectors.toList());
    }

    public RmgDetailDTO getRmgDetail(String employeeId) {
        log.debug("Fetching RMG detail: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return mapToRmgDetail(rmg);
    }

    public Page<Employee> getAssociatesForRmg(String employeeId, Pageable pageable) {
        log.debug("Fetching associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.findByRmgManagerId(rmg.getId(), pageable);
    }

    public List<Employee> getAssociatesForRmgActive(String employeeId) {
        log.debug("Fetching active associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.findByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());
    }

    public long getAssociateCountForRmg(String employeeId) {
        log.debug("Counting active associates for RMG: {}", employeeId);

        Employee rmg = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + employeeId));

        return employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());
    }

    private RmgDetailDTO mapToRmgDetail(Employee rmg) {
        long associateCount = employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", rmg.getId());

        return RmgDetailDTO.builder()
                .rmgId(rmg.getId())
                .employeeId(rmg.getEmployeeId())
                .rmgName(rmg.getFirstName() + " " + rmg.getLastName())
                .email(rmg.getEmail())
                .department(rmg.getDepartment() != null ? rmg.getDepartment().getName() : null)
                .designation(rmg.getDesignation())
                .associateCount(associateCount)
                .status(rmg.getEmploymentStatus())
                .build();
    }
}
