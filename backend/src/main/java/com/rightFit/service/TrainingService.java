package com.rightFit.service;

import com.rightFit.dto.TrainingDtos.AssignTrainingRequest;
import com.rightFit.dto.TrainingDtos.CreateTrainingProgramRequest;
import com.rightFit.dto.TrainingDtos.InterestDecisionRequest;
import com.rightFit.dto.TrainingDtos.OpenTrainingDTO;
import com.rightFit.dto.TrainingDtos.TrainingAssignmentDTO;
import com.rightFit.dto.TrainingDtos.TrainingProgramDTO;
import com.rightFit.dto.TrainingDtos.UpdateTrainingAssignmentRequest;
import com.rightFit.dto.TrainingDtos.UpdateTrainingProgramRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Rejection;
import com.rightFit.entity.TrainingAssignment;
import com.rightFit.entity.TrainingProgram;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.AllocationRepository;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.RejectionRepository;
import com.rightFit.repository.TrainingAssignmentRepository;
import com.rightFit.repository.TrainingProgramRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Training Management (BRD 29, FR-053): RMG creates a program and assigns a group of employees to
 * it, typically in response to a repeated-rejection skill gap (RejectionService) or a Demand/Supply
 * shortage (WorkforceIntelligenceService) - this service doesn't require either, both are optional
 * inputs to the decision, not a hard dependency.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TrainingService {
    private final EventMailer eventMailer;

    /** Assignments that hold a seat. */
    private static final List<String> SEAT_STATUSES = List.of("ASSIGNED", "IN_PROGRESS");

    private final TrainingProgramRepository programRepository;
    private final TrainingAssignmentRepository assignmentRepository;
    private final AllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final RejectionRepository rejectionRepository;
    private final RequirementAccessGuard accessGuard;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<TrainingProgramDTO> listPrograms(boolean activeOnly) {
        List<TrainingProgram> programs = activeOnly
                ? programRepository.findByIsActiveTrueOrderByProgramNameAsc()
                : programRepository.findAllByOrderByProgramNameAsc();
        return programs.stream().map(this::toProgramDTO).toList();
    }

    public TrainingProgramDTO createProgram(CreateTrainingProgramRequest request) {
        requireRmgOrAdmin();
        TrainingProgram program = programRepository.save(TrainingProgram.builder()
                .programId("TRAIN-" + programRepository.nextProgramSequence())
                .programName(request.getProgramName())
                .description(request.getDescription())
                .durationDays(request.getDurationDays())
                .trainingType(request.getTrainingType())
                .provider(request.getProvider())
                .cost(request.getCost())
                .requiredCertifications(request.getRequiredCertifications())
                .maxParticipants(request.getMaxParticipants())
                .isActive(true)
                .build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_PROGRAM_CREATED",
                "TRAINING_PROGRAM", program.getId(), null, null,
                "Training program created: " + program.getProgramName());
        return toProgramDTO(program);
    }

    public TrainingProgramDTO updateProgram(String programId, UpdateTrainingProgramRequest request) {
        requireRmgOrAdmin();
        TrainingProgram program = findProgram(programId);
        if (request.getProgramName() != null) {
            program.setProgramName(request.getProgramName());
        }
        if (request.getDescription() != null) {
            program.setDescription(request.getDescription());
        }
        if (request.getDurationDays() != null) {
            program.setDurationDays(request.getDurationDays());
        }
        if (request.getTrainingType() != null) {
            program.setTrainingType(request.getTrainingType());
        }
        if (request.getProvider() != null) {
            program.setProvider(request.getProvider());
        }
        if (request.getCost() != null) {
            program.setCost(request.getCost());
        }
        if (request.getRequiredCertifications() != null) {
            program.setRequiredCertifications(request.getRequiredCertifications());
        }
        if (request.getMaxParticipants() != null) {
            long taken = seatsTaken(program);
            if (request.getMaxParticipants() < taken) {
                throw new BusinessRuleException("'" + program.getProgramName() + "' already has " + taken
                        + " people, so it can't be cut down to " + request.getMaxParticipants() + " seats");
            }
            program.setMaxParticipants(request.getMaxParticipants());
        }
        TrainingProgram saved = programRepository.save(program);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_PROGRAM_UPDATED",
                "TRAINING_PROGRAM", saved.getId(), null, null,
                "Training program updated: " + saved.getProgramName());
        return toProgramDTO(saved);
    }

    public TrainingProgramDTO retireProgram(String programId) {
        requireRmgOrAdmin();
        TrainingProgram program = findProgram(programId);
        program.setIsActive(false);
        TrainingProgram saved = programRepository.save(program);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_PROGRAM_RETIRED",
                "TRAINING_PROGRAM", saved.getId(), "true", "false", "Retired: " + saved.getProgramName());
        return toProgramDTO(saved);
    }

    /** Assigns a group of employees to a program in one call (BRD: "Training can be created for a group of employees"). */
    public List<TrainingAssignmentDTO> assign(String programId, AssignTrainingRequest request) {
        Employee actor = requireRmgOrAdmin();
        TrainingProgram program = findProgram(programId);
        if (!Boolean.TRUE.equals(program.getIsActive())) {
            throw new BusinessRuleException("'" + program.getProgramName() + "' has been retired and cannot take new assignments");
        }
        assertSeatsFor(program, request.getEmployeeIds().size());
        Rejection rejection = request.getRejectionId() == null ? null : findRejection(request.getRejectionId());

        List<TrainingAssignmentDTO> created = new java.util.ArrayList<>();
        for (String employeeId : request.getEmployeeIds()) {
            Employee employee = employeeRepository.findByEmployeeId(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

            TrainingAssignment assignment = assignmentRepository.save(TrainingAssignment.builder()
                    .assignmentId("TA-" + assignmentRepository.nextAssignmentSequence())
                    .employee(employee)
                    .trainingProgram(program)
                    .rejection(rejection)
                    .assignmentStatus("ASSIGNED")
                    .startDate(request.getStartDate())
                    .expectedEndDate(request.getExpectedEndDate())
                    .assignedBy(actor)
                    .assignedAt(LocalDateTime.now())
                    .build());

            notificationService.notify(employee, "TRAINING_ASSIGNMENT",
                    "You've been assigned to " + program.getProgramName(),
                    "Scheduled" + (request.getStartDate() != null ? " from " + request.getStartDate() : "")
                            + ". Reach out to your RMG with questions.",
                    "TRAINING_ASSIGNMENT", assignment.getAssignmentId());
            eventMailer.trainingAssigned(assignment);
            created.add(toAssignmentDTO(assignment));
        }
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_ASSIGNED", "TRAINING_PROGRAM",
                program.getId(), null, null,
                created.size() + " employee(s) assigned to " + program.getProgramName());
        return created;
    }

    @Transactional(readOnly = true)
    public List<TrainingAssignmentDTO> listAssignments() {
        Employee rmg = accessGuard.isAdmin() ? null : requireRmgOrAdmin();
        List<TrainingAssignment> assignments = accessGuard.isAdmin()
                ? assignmentRepository.findAllOrderByAssignedAtDesc()
                : assignmentRepository.findForRmg(rmg.getId());
        return assignments.stream().map(this::toAssignmentDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<TrainingAssignmentDTO> myAssignments() {
        Employee employee = accessGuard.currentEmployee();
        return assignmentRepository.findByEmployeeIdOrderByAssignedAtDesc(employee.getId()).stream()
                .map(this::toAssignmentDTO).toList();
    }

    /** Active trainings, each with the associate's latest assignment on it (if any), so they can ask to join. */
    @Transactional(readOnly = true)
    public List<OpenTrainingDTO> openTrainings() {
        Employee me = accessGuard.currentEmployee();
        java.util.Map<Long, TrainingAssignment> mine = new java.util.HashMap<>();
        for (TrainingAssignment a : assignmentRepository.findByEmployeeIdOrderByAssignedAtDesc(me.getId())) {
            mine.putIfAbsent(a.getTrainingProgram().getId(), a);
        }
        return programRepository.findByIsActiveTrueOrderByProgramNameAsc().stream().map(p -> {
            TrainingAssignment a = mine.get(p.getId());
            return OpenTrainingDTO.builder()
                    .programId(p.getProgramId())
                    .programName(p.getProgramName())
                    .description(p.getDescription())
                    .durationDays(p.getDurationDays())
                    .trainingType(p.getTrainingType())
                    .provider(p.getProvider())
                    .requiredCertifications(p.getRequiredCertifications())
                    .myAssignmentId(a != null ? a.getAssignmentId() : null)
                    .myStatus(a != null ? a.getAssignmentStatus() : null)
                    .maxParticipants(p.getMaxParticipants())
                    .seatsTaken((int) seatsTaken(p))
                    .build();
        }).toList();
    }

    /**
     * An unallocated associate asks to join a training. It waits as REQUESTED until their RMG decides;
     * allocated associates are on a project and cannot take training.
     */
    public TrainingAssignmentDTO requestInterest(String programId) {
        Employee me = accessGuard.currentEmployee();
        if (!allocationRepository.findByEmployeeIdAndStatus(me.getId(), "ACTIVE").isEmpty()) {
            throw new BusinessRuleException("You are on a project. Training opens again when your allocation ends.");
        }
        TrainingProgram program = findProgram(programId);
        if (!Boolean.TRUE.equals(program.getIsActive())) {
            throw new BusinessRuleException("'" + program.getProgramName() + "' is no longer offered");
        }
        boolean open = assignmentRepository.findByEmployeeIdOrderByAssignedAtDesc(me.getId()).stream()
                .anyMatch(a -> a.getTrainingProgram().getId().equals(program.getId())
                        && List.of("REQUESTED", "ASSIGNED", "IN_PROGRESS").contains(a.getAssignmentStatus()));
        if (open) {
            throw new BusinessRuleException("You already asked for, or are on, '" + program.getProgramName() + "'");
        }

        TrainingAssignment request = assignmentRepository.save(TrainingAssignment.builder()
                .assignmentId("TA-" + assignmentRepository.nextAssignmentSequence())
                .employee(me)
                .trainingProgram(program)
                .assignmentStatus("REQUESTED")
                .assignedAt(LocalDateTime.now())
                .build());
        notificationService.notifyRmgOf(me, "TRAINING_INTEREST",
                CandidateWorkflowService.name(me) + " asked to join " + program.getProgramName(),
                "Approve or decline the request in Training.", "TRAINING_ASSIGNMENT", request.getAssignmentId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_INTEREST", "TRAINING_ASSIGNMENT",
                request.getId(), null, "REQUESTED", me.getEmployeeId() + " asked to join " + program.getProgramName());
        return toAssignmentDTO(request);
    }

    /** The RMG approves (it becomes a normal ASSIGNED training) or declines an associate's request. */
    public TrainingAssignmentDTO decideInterest(String assignmentId, InterestDecisionRequest decision) {
        Employee rmg = requireRmgOrAdmin();
        TrainingAssignment a = assignmentRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingAssignment", assignmentId));
        if (!"REQUESTED".equals(a.getAssignmentStatus())) {
            throw new BusinessRuleException("This request was already answered (" + a.getAssignmentStatus() + ")");
        }
        if (rmg != null && a.getEmployee().getRmgManager() != null && !a.getEmployee().getRmgManager().getId().equals(rmg.getId())) {
            throw ProjectAccessDeniedException.notYours("This training request");
        }
        String program = a.getTrainingProgram().getProgramName();
        if (decision.isApprove()) {
            assertSeatsFor(a.getTrainingProgram(), 1);
            a.setAssignmentStatus("ASSIGNED");
            a.setAssignedBy(rmg);
            a.setAssignedAt(LocalDateTime.now());
            a.setStartDate(decision.getStartDate());
            a.setExpectedEndDate(decision.getExpectedEndDate());
        } else {
            a.setAssignmentStatus("DECLINED");
        }
        String reason = decision.getComment() == null || decision.getComment().isBlank() ? null : decision.getComment().trim();
        a.setDecisionComment(reason);
        TrainingAssignment saved = assignmentRepository.save(a);
        notificationService.notify(a.getEmployee(), "TRAINING_INTEREST_" + (decision.isApprove() ? "APPROVED" : "DECLINED"),
                decision.isApprove() ? "You are in " + program : "Your request for " + program + " was declined",
                decision.getComment() != null ? decision.getComment() : "Reach out to your RMG with questions.",
                "TRAINING_ASSIGNMENT", saved.getAssignmentId());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_INTEREST_DECIDED", "TRAINING_ASSIGNMENT",
                saved.getId(), "REQUESTED", saved.getAssignmentStatus(), decision.getComment());
        eventMailer.trainingDecision(saved, decision.isApprove(), reason);
        return toAssignmentDTO(saved);
    }

    public TrainingAssignmentDTO updateAssignment(String assignmentId, UpdateTrainingAssignmentRequest request) {
        requireRmgOrAdmin();
        TrainingAssignment assignment = assignmentRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingAssignment", assignmentId));

        if (request.getAssignmentStatus() != null) {
            assignment.setAssignmentStatus(request.getAssignmentStatus());
        }
        if (request.getCompletionStatus() != null) {
            assignment.setCompletionStatus(request.getCompletionStatus());
        }
        if (request.getScore() != null) {
            assignment.setScore(request.getScore());
        }
        if (request.getCertificateId() != null) {
            assignment.setCertificateId(request.getCertificateId());
        }
        if (request.getActualEndDate() != null) {
            assignment.setActualEndDate(request.getActualEndDate());
        }
        TrainingAssignment saved = assignmentRepository.save(assignment);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "TRAINING_ASSIGNMENT_UPDATED",
                "TRAINING_ASSIGNMENT", saved.getId(), null, null,
                saved.getAssignmentId() + " -> " + saved.getAssignmentStatus());
        return toAssignmentDTO(saved);
    }

    private TrainingProgram findProgram(String programId) {
        return programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingProgram", programId));
    }

    private Rejection findRejection(String rejectionId) {
        return rejectionRepository.findByRejectionId(rejectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Rejection", rejectionId));
    }

    private Employee requireRmgOrAdmin() {
        if (!accessGuard.isAdmin() && !accessGuard.roleCodes().contains(RequirementAccessGuard.RMG)) {
            throw ProjectAccessDeniedException.notYours("Training management (RMG or Admin only)");
        }
        return accessGuard.isAdmin() ? null : accessGuard.currentEmployee();
    }

    private TrainingProgramDTO toProgramDTO(TrainingProgram program) {
        return TrainingProgramDTO.builder()
                .programId(program.getProgramId())
                .programName(program.getProgramName())
                .description(program.getDescription())
                .durationDays(program.getDurationDays())
                .trainingType(program.getTrainingType())
                .provider(program.getProvider())
                .cost(program.getCost())
                .requiredCertifications(program.getRequiredCertifications())
                .isActive(program.getIsActive())
                .maxParticipants(program.getMaxParticipants())
                .seatsTaken((int) seatsTaken(program))
                .build();
    }

    /** People holding a seat on the program right now. Requests that are still waiting do not hold one. */
    private long seatsTaken(TrainingProgram program) {
        return assignmentRepository.countSeatsTaken(program.getId(), SEAT_STATUSES);
    }

    /** Refuses to put more people on a program than it has seats for. */
    private void assertSeatsFor(TrainingProgram program, int people) {
        if (program.getMaxParticipants() == null) {
            return;
        }
        long left = program.getMaxParticipants() - seatsTaken(program);
        if (people > left) {
            throw new BusinessRuleException(left <= 0
                    ? "'" + program.getProgramName() + "' is full (" + program.getMaxParticipants() + " of " + program.getMaxParticipants() + " seats taken)"
                    : "Only " + left + " seat" + (left == 1 ? "" : "s") + " left on '" + program.getProgramName() + "', so " + people + " can't be added");
        }
    }

    private TrainingAssignmentDTO toAssignmentDTO(TrainingAssignment assignment) {
        return TrainingAssignmentDTO.builder()
                .assignmentId(assignment.getAssignmentId())
                .employeeId(assignment.getEmployee().getEmployeeId())
                .employeeName(CandidateWorkflowService.name(assignment.getEmployee()))
                .programId(assignment.getTrainingProgram().getProgramId())
                .programName(assignment.getTrainingProgram().getProgramName())
                .rejectionId(assignment.getRejection() != null ? assignment.getRejection().getRejectionId() : null)
                .assignmentStatus(assignment.getAssignmentStatus())
                .startDate(assignment.getStartDate())
                .expectedEndDate(assignment.getExpectedEndDate())
                .actualEndDate(assignment.getActualEndDate())
                .completionStatus(assignment.getCompletionStatus())
                .score(assignment.getScore())
                .certificateId(assignment.getCertificateId())
                .assignedByName(assignment.getAssignedBy() != null ? CandidateWorkflowService.name(assignment.getAssignedBy()) : null)
                .assignedAt(assignment.getAssignedAt())
                .decisionComment(assignment.getDecisionComment())
                .build();
    }
}
