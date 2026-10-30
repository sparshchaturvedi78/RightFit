package com.rightFit.service;

import com.rightFit.dto.AssociateDtos.DutyDTO;
import com.rightFit.dto.AssociateDtos.MyProjectDTO;
import com.rightFit.dto.AssociateDtos.OpenRequirementDTO;
import com.rightFit.dto.AssociateDtos.TeamPersonDTO;
import com.rightFit.entity.Allocation;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Interview;
import com.rightFit.entity.Project;
import com.rightFit.entity.ProjectMember;
import com.rightFit.entity.ProjectRequirement;
import com.rightFit.entity.RequirementAssignment;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.CandidateApplicationRepository;
import com.rightFit.repository.InterviewRepository;
import com.rightFit.repository.ProjectMemberRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.RequirementAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The associate's side of work: open requirements they can apply to (while unallocated), the project they are
 * allocated to with its team, and the hiring responsibilities (SOURCER / COORDINATOR / INTERVIEWER) they hold.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssociateWorkService {

    private static final Set<String> OPEN_INTERVIEW = Set.of("SCHEDULED", "ACCEPTED");

    private final ProjectRequirementRepository requirementRepository;
    private final CandidateApplicationRepository candidateRepository;
    private final AllocationRepository allocationRepository;
    private final ProjectMemberRepository memberRepository;
    private final RequirementAssignmentRepository assignmentRepository;
    private final InterviewRepository interviewRepository;
    private final RequirementAccessGuard accessGuard;

    /** Every published requirement, newest first, with the associate's own candidacy on each (if any). */
    public List<OpenRequirementDTO> openRequirements() {
        Employee me = accessGuard.currentEmployee();
        Map<Long, CandidateApplication> mine = new HashMap<>();
        for (CandidateApplication c : candidateRepository.findByEmployeeIdOrderByCreatedAtDesc(me.getId())) {
            mine.putIfAbsent(c.getRequirement().getId(), c);
        }
        return requirementRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED").stream()
                // A project without a manager is visible to admins only, so associates do not see its openings.
                .filter(r -> r.getProject().getManager() != null)
                .filter(r -> !accessGuard.isManagerOf(r.getProject(), me))
                .map(r -> {
                    CandidateApplication c = mine.get(r.getId());
                    Employee manager = r.getProject().getManager();
                    return OpenRequirementDTO.builder()
                            .requirementId(r.getRequirementId())
                            .positionTitle(r.getPositionTitle())
                            .description(r.getDescription())
                            .projectId(r.getProject().getProjectId())
                            .projectName(r.getProject().getProjectName())
                            .managerName(CandidateWorkflowService.name(manager))
                            .requiredSkills(r.getRequiredSkills())
                            .requiredCertifications(r.getRequiredCertifications())
                            .minExperience(r.getMinExperience())
                            .maxExperience(r.getMaxExperience())
                            .priority(r.getPriority())
                            .allocationStartDate(r.getAllocationStartDate())
                            .allocationEndDate(r.getAllocationEndDate())
                            .myApplicationId(c != null ? c.getApplicationId() : null)
                            .myStatus(c != null ? c.getStatus() : null)
                            .build();
                })
                .toList();
    }

    /** The projects the associate is allocated to right now, each with its manager and the people on it. */
    public List<MyProjectDTO> myProjects() {
        Employee me = accessGuard.currentEmployee();
        List<MyProjectDTO> result = new ArrayList<>();
        for (Allocation mine : allocationRepository.findByEmployeeIdAndStatus(me.getId(), "ACTIVE")) {
            Project p = mine.getProject();
            Map<Long, Allocation> hours = new HashMap<>();
            for (Allocation a : allocationRepository.findActiveWithEmployeeByProjectId(p.getId())) {
                hours.putIfAbsent(a.getEmployee().getId(), a);
            }

            Map<Long, TeamPersonDTO> team = new LinkedHashMap<>();
            Employee pm = p.getManager();
            if (pm != null) {
                team.put(pm.getId(), person(pm, "MANAGER", hours.get(pm.getId()), me));
            }
            for (ProjectMember m : memberRepository.findByProjectIdAndIsActiveTrueOrderByJoinedAtAsc(p.getId())) {
                if ("ACTIVE".equals(m.getEmployee().getEmploymentStatus())) {
                    team.putIfAbsent(m.getEmployee().getId(), person(m.getEmployee(), m.getRole(), hours.get(m.getEmployee().getId()), me));
                }
            }
            for (Allocation a : hours.values()) {
                team.putIfAbsent(a.getEmployee().getId(), person(a.getEmployee(), "MEMBER", a, me));
            }

            result.add(MyProjectDTO.builder()
                    .projectId(p.getProjectId())
                    .projectName(p.getProjectName())
                    .clientName(p.getClientName())
                    .description(p.getDescription())
                    .status(p.getStatus())
                    .projectStartDate(p.getStartDate())
                    .projectEndDate(p.getEndDate())
                    .managerName(CandidateWorkflowService.name(pm))
                    .managerEmployeeId(pm != null ? pm.getEmployeeId() : null)
                    .managerEmail(pm != null ? pm.getEmail() : null)
                    .myHoursPerDay(mine.getHoursPerDay())
                    .myStartDate(mine.getStartDate())
                    .myEndDate(mine.getEndDate())
                    .myRole(memberRepository.findByProjectIdAndEmployeeId(p.getId(), me.getId()).map(ProjectMember::getRole).orElse(null))
                    .myWorkingHoursPerDay(me.getWorkingHoursPerDay())
                    .team(new ArrayList<>(team.values()))
                    .build());
        }
        return result;
    }

    /** Each SOURCER / COORDINATOR / INTERVIEWER responsibility on a live requirement, with what is waiting on it. */
    public List<DutyDTO> myDuties() {
        Employee me = accessGuard.currentEmployee();
        LocalDateTime now = LocalDateTime.now();
        List<Interview> myInterviews = interviewRepository.findByInterviewerIdOrderByScheduledAtDesc(me.getId());
        List<DutyDTO> duties = new ArrayList<>();
        for (RequirementAssignment a : assignmentRepository.findByEmployeeIdAndIsActiveTrue(me.getId())) {
            ProjectRequirement r = a.getRequirement();
            if (!List.of("PUBLISHED", "ON_HOLD").contains(r.getStatus())) {
                continue;
            }
            List<CandidateApplication> candidates = candidateRepository.findByRequirementIdOrderByCreatedAtDesc(r.getId());
            List<Interview> here = myInterviews.stream()
                    .filter(i -> i.getRequirement().getId().equals(r.getId()) && OPEN_INTERVIEW.contains(i.getStatus()))
                    .toList();
            duties.add(DutyDTO.builder()
                    .requirementId(r.getRequirementId())
                    .positionTitle(r.getPositionTitle())
                    .projectName(r.getProject().getProjectName())
                    .requirementStatus(r.getStatus())
                    .responsibility(a.getResponsibilityType())
                    .toShortlist(count(candidates, CandidateStatus.IDENTIFIED))
                    .toInvite(count(candidates, CandidateStatus.SHORTLISTED))
                    .toBook(count(candidates, CandidateStatus.ACCEPTED))
                    .upcomingInterviews(here.stream().filter(i -> !i.getScheduledAt().isBefore(now)).count())
                    .feedbackDue(here.stream().filter(i -> i.getScheduledAt().isBefore(now)).count())
                    .build());
        }
        return duties;
    }

    private static long count(List<CandidateApplication> candidates, String status) {
        return candidates.stream().filter(c -> status.equals(c.getStatus()) && !Boolean.TRUE.equals(c.getArchived())).count();
    }

    private static TeamPersonDTO person(Employee e, String role, Allocation allocation, Employee me) {
        BigDecimal hours = allocation != null ? allocation.getHoursPerDay() : null;
        return TeamPersonDTO.builder()
                .employeeId(e.getEmployeeId())
                .name(CandidateWorkflowService.name(e))
                .designation(e.getDesignation())
                .email(e.getEmail())
                .role(role)
                .hoursPerDay(hours)
                .me(e.getId().equals(me.getId()))
                .build();
    }
}
