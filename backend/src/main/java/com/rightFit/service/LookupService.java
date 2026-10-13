package com.rightFit.service;

import com.rightFit.dto.LookupDtos.DepartmentDTO;
import com.rightFit.dto.LookupDtos.LocationDTO;
import com.rightFit.dto.LookupDtos.LookupsDTO;
import com.rightFit.entity.Department;
import com.rightFit.entity.Location;
import com.rightFit.repository.DepartmentRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LookupService {

    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final EmployeeRepository employeeRepository;

    /** Active departments and locations (a null flag counts as active) plus the designations already in use. */
    public LookupsDTO lookups() {
        return LookupsDTO.builder()
                .departments(departmentRepository.findAll().stream()
                        .filter(d -> !Boolean.FALSE.equals(d.getIsActive()))
                        .sorted(Comparator.comparing(Department::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                        .map(d -> DepartmentDTO.builder().id(d.getId()).name(d.getName()).code(d.getCode()).build())
                        .toList())
                .locations(locationRepository.findAll().stream()
                        .filter(l -> !Boolean.FALSE.equals(l.getIsActive()))
                        .sorted(Comparator.comparing(Location::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                        .map(l -> LocationDTO.builder().id(l.getId()).name(l.getName()).city(l.getCity()).country(l.getCountry()).build())
                        .toList())
                .designations(employeeRepository.findDistinctDesignations())
                .build();
    }
}
