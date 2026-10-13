package com.rightFit.service;

import com.rightFit.repository.BenchHistoryRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.TrainingAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * The Admin "workforce distribution": where every ACTIVE employee is right now. One definition shared by the
 * dashboard counts and the Employees workforce filter, computed here from small id queries instead of one huge
 * JPQL predicate (which was heavy enough for Hibernate to run a small server out of heap while parsing it at start-up).
 * Each person lands in exactly one bucket, in this order: project, training, bench / pool, unassigned.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkforceBucketService {

    public static final String IN_PROJECT = "IN_PROJECT";
    public static final String IN_TRAINING = "IN_TRAINING";
    public static final String ON_BENCH = "ON_BENCH";
    public static final String UNASSIGNED = "UNASSIGNED";

    private final EmployeeRepository employeeRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;
    private final BenchHistoryRepository benchHistoryRepository;
    private final ProjectMembershipService projectMembershipService;

    /** Bucket name for every ACTIVE employee id. */
    public Map<Long, String> bucketsOfActiveEmployees() {
        Set<Long> inProject = projectMembershipService.inActiveProjects();
        Set<Long> inTraining = new HashSet<>(trainingAssignmentRepository.findEmployeeIdsInActiveTraining());
        Set<Long> onBench = new HashSet<>(benchHistoryRepository.findCurrentEmployeeIds());

        Map<Long, String> buckets = new HashMap<>();
        for (Object[] row : employeeRepository.findActiveEmployeeWorkflags()) {
            Long id = (Long) row[0];
            String allocationStatus = (String) row[1];
            String poolStatus = (String) row[2];
            String bucket;
            if ("ALLOCATED".equals(allocationStatus) || inProject.contains(id)) {
                bucket = IN_PROJECT;
            } else if (inTraining.contains(id)) {
                bucket = IN_TRAINING;
            } else if (onBench.contains(id) || "IN_RESOURCE_POOL".equals(poolStatus)) {
                bucket = ON_BENCH;
            } else {
                bucket = UNASSIGNED;
            }
            buckets.put(id, bucket);
        }
        return buckets;
    }

    /** Ids of the ACTIVE employees in one bucket (IN_PROJECT, IN_TRAINING, ON_BENCH or UNASSIGNED). */
    public Set<Long> idsIn(String bucket) {
        Set<Long> ids = new HashSet<>();
        bucketsOfActiveEmployees().forEach((id, b) -> {
            if (b.equalsIgnoreCase(bucket)) {
                ids.add(id);
            }
        });
        return ids;
    }
}
