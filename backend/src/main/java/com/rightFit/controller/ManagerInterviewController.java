package com.rightFit.controller;

import com.rightFit.dto.InterviewDtos.InterviewDTO;
import com.rightFit.dto.InterviewDtos.InterviewResponseRequest;
import com.rightFit.dto.InterviewDtos.ScheduleInterviewRequest;
import com.rightFit.dto.InterviewDtos.SubmitFeedbackRequest;
import com.rightFit.dto.RequirementStatusChangeRequest;
import com.rightFit.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
public class ManagerInterviewController {

    private final InterviewService interviewService;

    @PostMapping("/api/manager/candidates/{applicationId}/interviews")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_SCHEDULE')")
    public ResponseEntity<InterviewDTO> schedule(@PathVariable String applicationId,
                                                 @Valid @RequestBody ScheduleInterviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(interviewService.schedule(applicationId, request));
    }

    @GetMapping("/api/manager/candidates/{applicationId}/interviews")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_READ')")
    public ResponseEntity<List<InterviewDTO>> listForCandidate(@PathVariable String applicationId) {
        return ResponseEntity.ok(interviewService.listForCandidate(applicationId));
    }

    @GetMapping("/api/manager/interviews/mine")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_READ')")
    public ResponseEntity<List<InterviewDTO>> assignedToMe() {
        return ResponseEntity.ok(interviewService.assignedToMe());
    }

    @GetMapping("/api/manager/interviews/{interviewId}")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_READ')")
    public ResponseEntity<InterviewDTO> get(@PathVariable String interviewId) {
        return ResponseEntity.ok(interviewService.get(interviewId));
    }

    @PutMapping("/api/manager/interviews/{interviewId}/cancel")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_SCHEDULE')")
    public ResponseEntity<InterviewDTO> cancel(@PathVariable String interviewId,
                                               @Valid @RequestBody RequirementStatusChangeRequest request) {
        return ResponseEntity.ok(interviewService.cancel(interviewId, request.getReason()));
    }

    @PostMapping("/api/manager/interviews/{interviewId}/feedback")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_CONDUCT')")
    public ResponseEntity<InterviewDTO> submitFeedback(@PathVariable String interviewId,
                                                       @Valid @RequestBody SubmitFeedbackRequest request) {
        return ResponseEntity.ok(interviewService.submitFeedback(interviewId, request));
    }

    @GetMapping("/api/associate/interviews")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_RESPOND')")
    public ResponseEntity<List<InterviewDTO>> myInterviews() {
        return ResponseEntity.ok(interviewService.myInterviews());
    }

    @PutMapping("/api/associate/interviews/{interviewId}/respond")
    @PreAuthorize("hasPermission(null, 'INTERVIEW_RESPOND')")
    public ResponseEntity<InterviewDTO> respond(@PathVariable String interviewId,
                                                @Valid @RequestBody InterviewResponseRequest request) {
        return ResponseEntity.ok(interviewService.respond(interviewId, request));
    }
}
