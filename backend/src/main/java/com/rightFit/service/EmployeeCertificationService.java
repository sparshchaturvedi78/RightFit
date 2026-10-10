package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.EmployeeCertificationDTO;
import com.rightFit.entity.Certification;
import com.rightFit.entity.Employee;
import com.rightFit.entity.EmployeeCertification;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.ProjectAccessDeniedException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CertificationRepository;
import com.rightFit.repository.EmployeeCertificationRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/**
 * Associate Phase: self-service certifications (BRD 18), with optional uploaded evidence.
 * Title/issuer/description live on the shared catalog (Certification) and are never duplicated
 * here - only what's genuinely per-employee (dates, validity, their own file) lives on this record.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeCertificationService {

    private final EmployeeCertificationRepository employeeCertificationRepository;
    private final CertificationRepository certificationRepository;
    private final FileStorageService fileStorageService;
    private final RequirementAccessGuard accessGuard;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EmployeeCertificationDTO> listMine() {
        Employee employee = accessGuard.currentEmployee();
        return employeeCertificationRepository.findByEmployeeIdOrderByObtainedDateDesc(employee.getId()).stream()
                .map(this::toDTO).toList();
    }

    /**
     * Resolved by catalog name, not id - unlike the per-employee record below, the catalog entry
     * itself is always unique by name, so there's no ambiguity to worry about here (contrast with
     * update/remove, which still need the row's own id: one employee can hold several certification
     * records with the *same* name over time - e.g. a renewed certificate - so name alone can't tell
     * those apart).
     */
    public EmployeeCertificationDTO addMine(String certificationName, LocalDate obtainedDate, LocalDate expiryDate,
                                            MultipartFile file) {
        Employee employee = accessGuard.currentEmployee();
        Certification certification = certificationRepository.findByCertificationNameIgnoreCase(certificationName)
                .orElseThrow(() -> new ResourceNotFoundException("Certification", certificationName));
        if (!Boolean.TRUE.equals(certification.getIsActive())) {
            throw new BusinessRuleException("'" + certification.getCertificationName()
                    + "' has been retired and is no longer available for new selections");
        }

        EmployeeCertification.EmployeeCertificationBuilder builder = EmployeeCertification.builder()
                .employee(employee)
                .certification(certification)
                .obtainedDate(obtainedDate)
                .expiryDate(expiryDate)
                .isValid(isValid(expiryDate));

        if (file != null && !file.isEmpty()) {
            String storageKey = fileStorageService.store(file);
            builder.fileName(file.getOriginalFilename())
                    .storageKey(storageKey)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize());
        }

        EmployeeCertification saved = employeeCertificationRepository.save(builder.build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_CERTIFICATION_ADDED",
                "EMPLOYEE_CERTIFICATION", saved.getId(), null, null,
                employee.getEmployeeId() + " added certification " + certification.getCertificationName());
        return toDTO(saved);
    }

    public EmployeeCertificationDTO updateMine(Long id, LocalDate obtainedDate, LocalDate expiryDate,
                                               MultipartFile file) {
        Employee employee = accessGuard.currentEmployee();
        EmployeeCertification certification = findMine(employee, id);

        if (obtainedDate != null) {
            certification.setObtainedDate(obtainedDate);
        }
        if (expiryDate != null) {
            certification.setExpiryDate(expiryDate);
        }
        certification.setIsValid(isValid(certification.getExpiryDate()));

        if (file != null && !file.isEmpty()) {
            String newStorageKey = fileStorageService.store(file);
            String oldStorageKey = certification.getStorageKey();
            certification.setFileName(file.getOriginalFilename());
            certification.setStorageKey(newStorageKey);
            certification.setContentType(file.getContentType());
            certification.setFileSize(file.getSize());
            EmployeeCertification saved = employeeCertificationRepository.save(certification);
            fileStorageService.delete(oldStorageKey);
            auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_CERTIFICATION_FILE_REPLACED",
                    "EMPLOYEE_CERTIFICATION", saved.getId(), null, null,
                    employee.getEmployeeId() + " replaced the file for " + saved.getCertification().getCertificationName());
            return toDTO(saved);
        }

        EmployeeCertification saved = employeeCertificationRepository.save(certification);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_CERTIFICATION_UPDATED",
                "EMPLOYEE_CERTIFICATION", saved.getId(), null, null,
                employee.getEmployeeId() + " updated " + saved.getCertification().getCertificationName());
        return toDTO(saved);
    }

    public void removeMine(Long id) {
        Employee employee = accessGuard.currentEmployee();
        EmployeeCertification certification = findMine(employee, id);
        employeeCertificationRepository.delete(certification);
        fileStorageService.delete(certification.getStorageKey());

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_CERTIFICATION_REMOVED",
                "EMPLOYEE_CERTIFICATION", id, certification.getCertification().getCertificationName(), null,
                employee.getEmployeeId() + " removed " + certification.getCertification().getCertificationName());
    }

    /** Document download: the owning employee, or Admin. */
    @Transactional(readOnly = true)
    public DocumentContent getDocument(Long id) {
        Employee caller = accessGuard.currentEmployee();
        EmployeeCertification certification = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeCertification", String.valueOf(id)));

        boolean isOwner = certification.getEmployee().getId().equals(caller.getId());
        if (!isOwner && !accessGuard.isAdmin()) {
            throw ProjectAccessDeniedException.notYours("This certification document");
        }
        if (certification.getStorageKey() == null) {
            throw new BusinessRuleException("This certification has no uploaded document");
        }
        byte[] bytes = fileStorageService.read(certification.getStorageKey());
        return new DocumentContent(certification.getFileName(), certification.getContentType(), bytes);
    }

    private EmployeeCertification findMine(Employee employee, Long id) {
        return employeeCertificationRepository.findByIdAndEmployeeId(id, employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeCertification", String.valueOf(id)));
    }

    private boolean isValid(LocalDate expiryDate) {
        return expiryDate == null || !expiryDate.isBefore(LocalDate.now());
    }

    private EmployeeCertificationDTO toDTO(EmployeeCertification certification) {
        Certification catalog = certification.getCertification();
        return EmployeeCertificationDTO.builder()
                .id(certification.getId())
                .certificationId(catalog.getId())
                .certificationName(catalog.getCertificationName())
                .issuingOrganization(catalog.getIssuingOrganization())
                .obtainedDate(certification.getObtainedDate())
                .expiryDate(certification.getExpiryDate())
                .isValid(certification.getIsValid())
                .fileName(certification.getFileName())
                .contentType(certification.getContentType())
                .fileSize(certification.getFileSize())
                .hasDocument(certification.getStorageKey() != null)
                .build();
    }

    public record DocumentContent(String fileName, String contentType, byte[] bytes) {
    }
}
