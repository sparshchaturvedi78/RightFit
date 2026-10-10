package com.rightFit.controller;

import com.rightFit.dto.AssociateProfileDtos.AddEmployeeSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.EmployeeAvailabilityDTO;
import com.rightFit.dto.AssociateProfileDtos.EmployeeCertificationDTO;
import com.rightFit.dto.AssociateProfileDtos.EmployeePreferenceDTO;
import com.rightFit.dto.AssociateProfileDtos.EmployeeSkillDTO;
import com.rightFit.dto.AssociateProfileDtos.RequestUnavailabilityRequest;
import com.rightFit.dto.AssociateProfileDtos.UpdateEmployeePreferenceRequest;
import com.rightFit.dto.AssociateProfileDtos.UpdateEmployeeSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.UpdateProfileRequest;
import com.rightFit.dto.EmployeeDTO;
import com.rightFit.service.EmployeeAvailabilityService;
import com.rightFit.service.EmployeeCertificationService;
import com.rightFit.service.EmployeeCertificationService.DocumentContent;
import com.rightFit.service.EmployeePreferenceService;
import com.rightFit.service.EmployeeProfileService;
import com.rightFit.service.EmployeeSkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/** Associate Phase: self-service profile. Every endpoint operates on the caller's own record,
 * resolved from the JWT - no {employeeId} path parameter anywhere in this controller, by design. */
@Slf4j
@RestController
@RequestMapping("/api/associate")
@RequiredArgsConstructor
@Validated
public class AssociateProfileController {

    private final EmployeeProfileService profileService;
    private final EmployeeSkillService skillService;
    private final EmployeeCertificationService certificationService;
    private final EmployeePreferenceService preferenceService;
    private final EmployeeAvailabilityService availabilityService;

    @GetMapping("/profile")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_PROFILE_UPDATE')")
    public ResponseEntity<EmployeeDTO> getProfile() {
        return ResponseEntity.ok(profileService.getMine());
    }

    @PutMapping("/profile")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_PROFILE_UPDATE')")
    public ResponseEntity<EmployeeDTO> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        log.info("Updating own profile");
        return ResponseEntity.ok(profileService.updateMine(request));
    }

    @GetMapping("/skills")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_SKILL_MANAGE')")
    public ResponseEntity<List<EmployeeSkillDTO>> listSkills() {
        return ResponseEntity.ok(skillService.listMine());
    }

    @PostMapping("/skills")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_SKILL_MANAGE')")
    public ResponseEntity<EmployeeSkillDTO> addSkill(@Valid @RequestBody AddEmployeeSkillRequest request) {
        log.info("Adding own skill: {}", request.getSkillName());
        return ResponseEntity.ok(skillService.addMine(request));
    }

    /** Addressed by skill name, not an internal row id - an employee can only ever have one row per
     * skill, so the name is already unambiguous and is exactly what the employee picked it by. */
    @PutMapping("/skills/{skillName}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_SKILL_MANAGE')")
    public ResponseEntity<EmployeeSkillDTO> updateSkill(@PathVariable String skillName,
                                                        @Valid @RequestBody UpdateEmployeeSkillRequest request) {
        return ResponseEntity.ok(skillService.updateMine(skillName, request));
    }

    @DeleteMapping("/skills/{skillName}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_SKILL_MANAGE')")
    public ResponseEntity<Void> removeSkill(@PathVariable String skillName) {
        skillService.removeMine(skillName);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/certifications")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CERTIFICATION_MANAGE')")
    public ResponseEntity<List<EmployeeCertificationDTO>> listCertifications() {
        return ResponseEntity.ok(certificationService.listMine());
    }

    /** Resolved by catalog certification name - see EmployeeCertificationService.addMine for why
     * update/delete below still need the row's own id instead (renewals share a name). */
    @PostMapping(value = "/certifications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CERTIFICATION_MANAGE')")
    public ResponseEntity<EmployeeCertificationDTO> addCertification(
            @RequestParam String certificationName,
            @RequestParam LocalDate obtainedDate,
            @RequestParam(required = false) LocalDate expiryDate,
            @RequestParam(required = false) MultipartFile file) {
        log.info("Adding own certification: {}", certificationName);
        return ResponseEntity.ok(certificationService.addMine(certificationName, obtainedDate, expiryDate, file));
    }

    @PutMapping(value = "/certifications/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CERTIFICATION_MANAGE')")
    public ResponseEntity<EmployeeCertificationDTO> updateCertification(
            @PathVariable Long id,
            @RequestParam(required = false) LocalDate obtainedDate,
            @RequestParam(required = false) LocalDate expiryDate,
            @RequestParam(required = false) MultipartFile file) {
        return ResponseEntity.ok(certificationService.updateMine(id, obtainedDate, expiryDate, file));
    }

    @GetMapping("/certifications/{id}/document")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CERTIFICATION_MANAGE')")
    public ResponseEntity<byte[]> getCertificationDocument(@PathVariable Long id) {
        DocumentContent document = certificationService.getDocument(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.fileName() + "\"")
                .body(document.bytes());
    }

    @DeleteMapping("/certifications/{id}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CERTIFICATION_MANAGE')")
    public ResponseEntity<Void> removeCertification(@PathVariable Long id) {
        certificationService.removeMine(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_PREFERENCE_MANAGE')")
    public ResponseEntity<EmployeePreferenceDTO> getPreferences() {
        return ResponseEntity.ok(preferenceService.getMine());
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_PREFERENCE_MANAGE')")
    public ResponseEntity<EmployeePreferenceDTO> updatePreferences(@RequestBody UpdateEmployeePreferenceRequest request) {
        return ResponseEntity.ok(preferenceService.updateMine(request));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_REQUEST')")
    public ResponseEntity<List<EmployeeAvailabilityDTO>> getAvailability() {
        return ResponseEntity.ok(availabilityService.myHistory());
    }

    @PostMapping("/availability/request-unavailability")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_REQUEST')")
    public ResponseEntity<EmployeeAvailabilityDTO> requestUnavailability(
            @Valid @RequestBody RequestUnavailabilityRequest request) {
        log.info("Requesting unavailability until {}", request.getExpectedReturnDate());
        return ResponseEntity.ok(availabilityService.requestUnavailability(request));
    }

    @PostMapping("/availability/{id}/cancel-request")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_REQUEST')")
    public ResponseEntity<EmployeeAvailabilityDTO> cancelRequest(@PathVariable Long id) {
        return ResponseEntity.ok(availabilityService.cancelMine(id));
    }

    @PostMapping("/availability/return-early")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_AVAILABILITY_REQUEST')")
    public ResponseEntity<EmployeeAvailabilityDTO> returnEarly() {
        log.info("Returning early from unavailability");
        return ResponseEntity.ok(availabilityService.returnEarly());
    }
}
