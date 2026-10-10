package com.rightFit.controller;

import com.rightFit.dto.TrainingDtos.AssignTrainingRequest;
import com.rightFit.dto.TrainingDtos.CreateTrainingProgramRequest;
import com.rightFit.dto.TrainingDtos.TrainingAssignmentDTO;
import com.rightFit.dto.TrainingDtos.TrainingProgramDTO;
import com.rightFit.dto.TrainingDtos.UpdateTrainingAssignmentRequest;
import com.rightFit.dto.TrainingDtos.UpdateTrainingProgramRequest;
import com.rightFit.service.TrainingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Training Management (BRD 29, FR-053): RMG creates programs and assigns groups of employees to them. */
@Slf4j
@RestController
@RequiredArgsConstructor
@Validated
public class RmgTrainingController {

    private final TrainingService trainingService;

    @GetMapping("/api/rmg/training-programs")
    @PreAuthorize("hasPermission(null, 'TRAINING_READ')")
    public ResponseEntity<List<TrainingProgramDTO>> listPrograms(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(trainingService.listPrograms(activeOnly));
    }

    @PostMapping("/api/rmg/training-programs")
    @PreAuthorize("hasPermission(null, 'TRAINING_MANAGE')")
    public ResponseEntity<TrainingProgramDTO> createProgram(@Valid @RequestBody CreateTrainingProgramRequest request) {
        log.info("Creating training program: {}", request.getProgramName());
        return ResponseEntity.ok(trainingService.createProgram(request));
    }

    @PutMapping("/api/rmg/training-programs/{programId}")
    @PreAuthorize("hasPermission(null, 'TRAINING_MANAGE')")
    public ResponseEntity<TrainingProgramDTO> updateProgram(@PathVariable String programId,
                                                            @RequestBody UpdateTrainingProgramRequest request) {
        return ResponseEntity.ok(trainingService.updateProgram(programId, request));
    }

    @PutMapping("/api/rmg/training-programs/{programId}/retire")
    @PreAuthorize("hasPermission(null, 'TRAINING_MANAGE')")
    public ResponseEntity<TrainingProgramDTO> retireProgram(@PathVariable String programId) {
        log.info("Retiring training program: {}", programId);
        return ResponseEntity.ok(trainingService.retireProgram(programId));
    }

    @PostMapping("/api/rmg/training-programs/{programId}/assign")
    @PreAuthorize("hasPermission(null, 'TRAINING_MANAGE')")
    public ResponseEntity<List<TrainingAssignmentDTO>> assign(@PathVariable String programId,
                                                              @Valid @RequestBody AssignTrainingRequest request) {
        log.info("Assigning {} employee(s) to training program {}", request.getEmployeeIds().size(), programId);
        return ResponseEntity.ok(trainingService.assign(programId, request));
    }

    @GetMapping("/api/rmg/training-assignments")
    @PreAuthorize("hasPermission(null, 'TRAINING_READ')")
    public ResponseEntity<List<TrainingAssignmentDTO>> listAssignments() {
        return ResponseEntity.ok(trainingService.listAssignments());
    }

    @PutMapping("/api/rmg/training-assignments/{assignmentId}")
    @PreAuthorize("hasPermission(null, 'TRAINING_MANAGE')")
    public ResponseEntity<TrainingAssignmentDTO> updateAssignment(@PathVariable String assignmentId,
                                                                  @RequestBody UpdateTrainingAssignmentRequest request) {
        return ResponseEntity.ok(trainingService.updateAssignment(assignmentId, request));
    }

    @GetMapping("/api/associate/training-assignments")
    @PreAuthorize("hasPermission(null, 'TRAINING_READ_OWN')")
    public ResponseEntity<List<TrainingAssignmentDTO>> myAssignments() {
        return ResponseEntity.ok(trainingService.myAssignments());
    }
}
