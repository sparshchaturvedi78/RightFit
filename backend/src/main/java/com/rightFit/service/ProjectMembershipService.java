package com.rightFit.service;

import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Who is "in a project" right now. The employee's flat allocation_status column is only a hint and was never kept
 * in sync with the team (seeded people are members of a project while their allocation table is empty), so the
 * Admin screens treat someone as in a project when ANY of these is true:
 * the flag says ALLOCATED, they are an active member of an ACTIVE project, they hold an ACTIVE allocation on an
 * ACTIVE project, or they are the Manager of an ACTIVE project.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectMembershipService {

    private final ProjectMemberRepository projectMemberRepository;
    private final AllocationRepository allocationRepository;
    private final ProjectRepository projectRepository;

    /** Of the given employees, the ones who are in an active project (flag-independent evidence only). */
    public Set<Long> inActiveProjects(Collection<Long> employeeIds) {
        Set<Long> result = new HashSet<>();
        if (employeeIds == null || employeeIds.isEmpty()) {
            return result;
        }
        result.addAll(projectMemberRepository.findEmployeeIdsInActiveProjects(employeeIds));
        result.addAll(allocationRepository.findEmployeeIdsInActiveProjects(employeeIds));
        result.addAll(projectRepository.findManagerIdsOfActiveProjects(employeeIds));
        return result;
    }

    /** Everyone in the organization who is in an active project. */
    public Set<Long> inActiveProjects() {
        Set<Long> result = new HashSet<>();
        result.addAll(projectMemberRepository.findEmployeeIdsInActiveProjects());
        result.addAll(allocationRepository.findEmployeeIdsInActiveProjects());
        result.addAll(projectRepository.findManagerIdsOfActiveProjects());
        return result;
    }
}
