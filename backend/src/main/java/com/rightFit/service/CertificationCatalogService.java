package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.CertificationDTO;
import com.rightFit.dto.AssociateProfileDtos.CreateCertificationRequest;
import com.rightFit.dto.AssociateProfileDtos.UpdateCertificationRequest;
import com.rightFit.entity.Certification;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.CertificationRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Admin-managed certification catalog (BRD 18). Retired, not deleted - existing
 * employee_certifications rows must keep working regardless of catalog changes. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CertificationCatalogService {

    private final CertificationRepository certificationRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CertificationDTO> list(boolean activeOnly) {
        List<Certification> certifications = activeOnly
                ? certificationRepository.findByIsActiveTrueOrderByCertificationNameAsc()
                : certificationRepository.findAllByOrderByCertificationNameAsc();
        return certifications.stream().map(this::toDTO).toList();
    }

    public CertificationDTO create(CreateCertificationRequest request) {
        certificationRepository.findByCertificationNameIgnoreCase(request.getCertificationName()).ifPresent(existing -> {
            throw new DuplicateEntityException("Certification", "certificationName", request.getCertificationName());
        });
        Certification saved = certificationRepository.save(Certification.builder()
                .certificationName(request.getCertificationName())
                .issuingOrganization(request.getIssuingOrganization())
                .description(request.getDescription())
                .validYears(request.getValidYears())
                .isActive(true)
                .build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CERTIFICATION_CREATED", "CERTIFICATION",
                saved.getId(), null, null, "Certification catalog entry created: " + saved.getCertificationName());
        return toDTO(saved);
    }

    public CertificationDTO update(Long id, UpdateCertificationRequest request) {
        Certification certification = find(id);
        if (request.getCertificationName() != null) {
            certification.setCertificationName(request.getCertificationName());
        }
        if (request.getIssuingOrganization() != null) {
            certification.setIssuingOrganization(request.getIssuingOrganization());
        }
        if (request.getDescription() != null) {
            certification.setDescription(request.getDescription());
        }
        if (request.getValidYears() != null) {
            certification.setValidYears(request.getValidYears());
        }
        Certification saved = certificationRepository.save(certification);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CERTIFICATION_UPDATED", "CERTIFICATION",
                saved.getId(), null, null, "Certification catalog entry updated: " + saved.getCertificationName());
        return toDTO(saved);
    }

    public CertificationDTO retire(Long id) {
        Certification certification = find(id);
        certification.setIsActive(false);
        Certification saved = certificationRepository.save(certification);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "CERTIFICATION_RETIRED", "CERTIFICATION",
                saved.getId(), "true", "false", "Certification retired: " + saved.getCertificationName());
        return toDTO(saved);
    }

    private Certification find(Long id) {
        return certificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification", String.valueOf(id)));
    }

    private CertificationDTO toDTO(Certification certification) {
        return CertificationDTO.builder()
                .id(certification.getId())
                .certificationName(certification.getCertificationName())
                .issuingOrganization(certification.getIssuingOrganization())
                .description(certification.getDescription())
                .validYears(certification.getValidYears())
                .isActive(certification.getIsActive())
                .build();
    }
}
