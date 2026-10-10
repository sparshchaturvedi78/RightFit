package com.rightFit.service;

import com.rightFit.dto.RejectionDtos.EmployeeRejectionHistoryDTO;
import com.rightFit.dto.RejectionDtos.RejectionDTO;
import com.rightFit.entity.CandidateApplication;
import com.rightFit.entity.Employee;
import com.rightFit.entity.Rejection;
import com.rightFit.entity.RejectionReason;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.RejectionReasonRepository;
import com.rightFit.repository.RejectionRepository;
import com.rightFit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Rejection Management (BRD 28, FR-052): records every Manager rejection into a dedicated,
 * cross-candidate history, feeding RMG's repeated-rejection analysis and the training-assignment
 * workflow it can trigger. CandidateDecisionService already stamps the same reason/comment onto
 * CandidateApplication for quick per-candidate display - this is the piece that was missing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RejectionService {

    private final RejectionRepository rejectionRepository;
    private final RejectionReasonRepository rejectionReasonRepository;
    private final EmployeeRepository employeeRepository;
    private final RequirementAccessGuard accessGuard;

    /** Called by CandidateDecisionService at the moment a Manager rejects a candidate. */
    public void recordRejection(CandidateApplication candidate, Employee rejectedBy, String reasonCode, String comment) {
        RejectionReason reason = rejectionReasonRepository.findByReasonNameIgnoreCase(reasonCode)
                .orElseThrow(() -> new ResourceNotFoundException("RejectionReason", reasonCode));

        Rejection rejection = Rejection.builder()
                .rejectionId("REJ-" + rejectionRepository.nextRejectionSequence())
                .candidateApplication(candidate)
                .employee(candidate.getEmployee())
                .project(candidate.getRequirement().getProject())
                .requirement(candidate.getRequirement())
                .rejectionReason(reason)
                .rejectedBy(rejectedBy)
                .rejectionComment(comment)
                .build();
        rejectionRepository.save(rejection);
        log.info("Rejection {} recorded for {} on {}: {}", rejection.getRejectionId(),
                candidate.getEmployee().getEmployeeId(), candidate.getRequirement().getRequirementId(), reasonCode);
    }

    @Transactional(readOnly = true)
    public List<RejectionDTO> listForRmg() {
        Employee rmg = currentRmgOrAdmin();
        List<Rejection> rejections = accessGuard.isAdmin()
                ? rejectionRepository.findAllOrderByRejectionDateDesc()
                : rejectionRepository.findForRmg(rmg.getId());
        return rejections.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public EmployeeRejectionHistoryDTO employeeHistory(String employeeId) {
        currentRmgOrAdmin();
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        if (!accessGuard.isAdmin() && !reviewsEmployee(accessGuard.currentEmployee(), employee)) {
            throw ProjectAccessDeniedException.notYours("This employee's rejection history");
        }

        List<Rejection> rejections = rejectionRepository.findByEmployeeIdOrderByRejectionDateDesc(employee.getId());
        Map<String, Long> byReason = new LinkedHashMap<>();
        for (Rejection r : rejections) {
            byReason.merge(r.getRejectionReason().getReasonName(), 1L, Long::sum);
        }
        return EmployeeRejectionHistoryDTO.builder()
                .employeeId(employee.getEmployeeId())
                .employeeName(CandidateWorkflowService.name(employee))
                .totalRejections(rejections.size())
                .byReason(byReason)
                .history(rejections.stream().map(this::toDTO).toList())
                .build();
    }

    private boolean reviewsEmployee(Employee rmg, Employee employee) {
        return employee.getRmgManager() == null || employee.getRmgManager().getId().equals(rmg.getId());
    }

    private Employee currentRmgOrAdmin() {
        if (!accessGuard.isAdmin() && !accessGuard.roleCodes().contains(RequirementAccessGuard.RMG)) {
            throw ProjectAccessDeniedException.notYours("Rejection review (RMG or Admin only)");
        }
        return accessGuard.isAdmin() ? null : accessGuard.currentEmployee();
    }

    private RejectionDTO toDTO(Rejection r) {
        return RejectionDTO.builder()
                .rejectionId(r.getRejectionId())
                .applicationId(r.getCandidateApplication().getApplicationId())
                .employeeId(r.getEmployee().getEmployeeId())
                .employeeName(CandidateWorkflowService.name(r.getEmployee()))
                .projectId(r.getProject().getProjectId())
                .projectName(r.getProject().getProjectName())
                .requirementId(r.getRequirement().getRequirementId())
                .positionTitle(r.getRequirement().getPositionTitle())
                .reasonName(r.getRejectionReason().getReasonName())
                .reasonCategory(r.getRejectionReason().getReasonCategory())
                .rejectedByName(CandidateWorkflowService.name(r.getRejectedBy()))
                .rejectionDate(r.getRejectionDate())
                .rejectionComment(r.getRejectionComment())
                .build();
    }
}
