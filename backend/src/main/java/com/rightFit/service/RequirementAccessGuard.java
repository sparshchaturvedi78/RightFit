package com.rightFit.service;

import com.rightFit.entity.Employee;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.Role;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.PermissionDeniedException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import com.rightFit.repository.UserRoleRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Authorization Levels 2 and 3 (BRD 38): project ownership and requirement responsibility.
 * RbacPermissionEvaluator has no target-object awareness, so these checks live here in the service layer.
 * Platform Role != Project Membership != Requirement Responsibility.
 */
@Component
@RequiredArgsConstructor
public class RequirementAccessGuard {

    public static final String ADMIN = "ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String RMG = "RMG";

    private final EmployeeRepository employeeRepository;
    private final UserRoleRepository userRoleRepository;
    private final RequirementAssignmentRepository assignmentRepository;

    public Long currentUserId() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        if (userId == null) {
            throw new PermissionDeniedException("AUTHENTICATION", "Authentication required");
        }
        return userId;
    }

    public Employee currentEmployee() {
        return employeeRepository.findByUserId(currentUserId())
                .orElseThrow(() -> new PermissionDeniedException("EMPLOYEE_PROFILE",
                        "No employee profile is linked to the current user"));
    }

    /** For system-driven actions where the acting user may legitimately have no employee profile. */
    public Employee currentEmployeeOrNull() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return userId == null ? null : employeeRepository.findByUserId(userId).orElse(null);
    }

    public Set<String> roleCodes() {
        return codesForUser(currentUserId());
    }

    public Set<String> roleCodesOf(Employee employee) {
        return employee.getUser() == null ? Set.of() : codesForUser(employee.getUser().getId());
    }

    private Set<String> codesForUser(Long userId) {
        return userRoleRepository.findByUserIdAndActive(userId).stream()
                .map(ur -> ur.getRole())
                .filter(Objects::nonNull)
                .map(Role::getCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    public boolean isAdmin() {
        return roleCodes().contains(ADMIN);
    }

    /** ADMIN bypasses; otherwise the caller must be the project's Manager and must have claimed it. */
    public void assertOwnsProjectOrAdmin(Project project) {
        if (isAdmin()) {
            return;
        }
        assertOwnsProject(project);
    }

    /** Strict ownership - no Admin bypass (final decision, allocation request: BRD 39 "Admin: No"). */
    public void assertOwnsProject(Project project) {
        Employee caller = currentEmployee();
        if (!isManagerOf(project, caller)) {
            throw ProjectAccessDeniedException.notOwned(project.getProjectId());
        }
        requireClaimed(project);
    }

    /** Owner, Admin, or anyone holding an active responsibility on the requirement. */
    public void assertCanReadRequirement(ProjectRequirement requirement) {
        if (isAdmin()) {
            return;
        }
        Employee caller = currentEmployee();
        Project project = requirement.getProject();
        if (isManagerOf(project, caller)) {
            requireClaimed(project);
            return;
        }
        if (assignmentRepository.existsByRequirementIdAndEmployeeIdAndIsActiveTrue(requirement.getId(), caller.getId())) {
            return;
        }
        throw ProjectAccessDeniedException.notOwned(project.getProjectId());
    }

    /** True for accounts that hold the ADMIN role - they are never part of the candidate pool or a responsibility team. */
    public boolean isAdminAccount(Employee employee) {
        return roleCodesOf(employee).contains(ADMIN);
    }

    /** RMG-only accounts cannot shortlist, coordinate or interview (BRD 39), so they cannot hold responsibilities. */
    public boolean isRmgOnlyAccount(Employee employee) {
        Set<String> codes = roleCodesOf(employee);
        return codes.contains(RMG) && !codes.contains(MANAGER) && !codes.contains(ADMIN);
    }

    /** Browsing a project's requirements: Admin, its claimed Manager, or someone with a responsibility in it. */
    public void assertCanBrowseProject(Project project) {
        if (isAdmin()) {
            return;
        }
        Employee caller = currentEmployee();
        if (isManagerOf(project, caller)) {
            requireClaimed(project);
            return;
        }
        if (assignmentRepository.existsByRequirementProjectIdAndEmployeeIdAndIsActiveTrue(project.getId(), caller.getId())) {
            return;
        }
        throw ProjectAccessDeniedException.notOwned(project.getProjectId());
    }

    /** Shortlisting/sourcing: owning Manager, Admin (authorized) or assigned SOURCER. RMG never. */
    public void assertCanSource(ProjectRequirement requirement) {
        assertOwnerAdminOrResponsibility(requirement, "SOURCER");
    }

    /** Scheduling/coordinating interviews: owning Manager, Admin or assigned COORDINATOR. */
    public void assertCanCoordinate(ProjectRequirement requirement) {
        assertOwnerAdminOrResponsibility(requirement, "COORDINATOR");
    }

    /** Conducting interviews / feedback: owning Manager (no assignment needed, BR-011), Admin or INTERVIEWER. RMG never. */
    public void assertCanInterview(ProjectRequirement requirement) {
        assertNotRmgOnly();
        assertOwnerAdminOrResponsibility(requirement, "INTERVIEWER");
    }

    public void assertNotRmgOnly() {
        Set<String> codes = roleCodes();
        if (codes.contains(RMG) && !codes.contains(MANAGER) && !codes.contains(ADMIN)) {
            throw ProjectAccessDeniedException.rmgForbidden();
        }
    }

    /** True when the employee may conduct interviews on the requirement (owner-Manager or INTERVIEWER, never RMG-only). */
    public boolean isEligibleInterviewer(ProjectRequirement requirement, Employee candidateInterviewer) {
        if (!"ACTIVE".equals(candidateInterviewer.getEmploymentStatus())) {
            return false;
        }
        Set<String> codes = roleCodesOf(candidateInterviewer);
        if (codes.contains(RMG) && !codes.contains(MANAGER) && !codes.contains(ADMIN)) {
            return false;
        }
        return isManagerOf(requirement.getProject(), candidateInterviewer)
                || hasResponsibility(requirement, candidateInterviewer, "INTERVIEWER");
    }

    public boolean hasResponsibility(ProjectRequirement requirement, Employee employee, String type) {
        return assignmentRepository.existsByRequirementIdAndEmployeeIdAndResponsibilityTypeAndIsActiveTrue(
                requirement.getId(), employee.getId(), type);
    }

    public boolean isManagerOf(Project project, Employee employee) {
        return project.getManager() != null && project.getManager().getId().equals(employee.getId());
    }

    /** Candidate-stage mutations only make sense while the requirement is open (PUBLISHED). */
    public void assertRequirementOpen(ProjectRequirement requirement) {
        if (!"PUBLISHED".equals(requirement.getStatus())) {
            throw new BusinessRuleException("Requirement " + requirement.getRequirementId() + " is "
                    + requirement.getStatus() + "; this action requires a PUBLISHED requirement");
        }
    }

    private void assertOwnerAdminOrResponsibility(ProjectRequirement requirement, String responsibility) {
        if (isAdmin()) {
            return;
        }
        Employee caller = currentEmployee();
        Project project = requirement.getProject();
        if (isManagerOf(project, caller)) {
            requireClaimed(project);
            return;
        }
        if (hasResponsibility(requirement, caller, responsibility)) {
            return;
        }
        throw ProjectAccessDeniedException.responsibilityRequired(requirement.getRequirementId(), responsibility);
    }

    private void requireClaimed(Project project) {
        if (!Boolean.TRUE.equals(project.getManagerClaimed())) {
            throw ProjectAccessDeniedException.notClaimed(project.getProjectId());
        }
    }
}
