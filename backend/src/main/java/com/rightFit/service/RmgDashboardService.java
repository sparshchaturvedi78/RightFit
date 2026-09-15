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

    public RmgDetailDTO getRmgDetail(Long rmgId) {
        log.debug("Fetching RMG detail: {}", rmgId);

        Employee rmg = employeeRepository.findById(rmgId)
                .orElseThrow(() -> new RuntimeException("RMG not found: " + rmgId));

        return mapToRmgDetail(rmg);
    }

    public Page<Employee> getAssociatesForRmg(Long rmgId, Pageable pageable) {
        log.debug("Fetching associates for RMG: {}", rmgId);

        return employeeRepository.findByRmgManagerId(rmgId, pageable);
    }

    public List<Employee> getAssociatesForRmgActive(Long rmgId) {
        log.debug("Fetching active associates for RMG: {}", rmgId);

        return employeeRepository.findByEmploymentStatusAndRmgManagerId("ACTIVE", rmgId);
    }

    public long getAssociateCountForRmg(Long rmgId) {
        log.debug("Counting active associates for RMG: {}", rmgId);

        return employeeRepository.countByEmploymentStatusAndRmgManagerId("ACTIVE", rmgId);
    }

    private RmgDetailDTO mapToRmgDetail(Employee rmg) {
        long associateCount = getAssociateCountForRmg(rmg.getId());

        return RmgDetailDTO.builder()
                .rmgId(rmg.getId())
                .rmgName(rmg.getFirstName() + " " + rmg.getLastName())
                .email(rmg.getEmail())
                .department(rmg.getDepartment() != null ? rmg.getDepartment().getName() : null)
                .designation(rmg.getDesignation())
                .associateCount(associateCount)
                .status(rmg.getEmploymentStatus())
                .build();
    }
}
