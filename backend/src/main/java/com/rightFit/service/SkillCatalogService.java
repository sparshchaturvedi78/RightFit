package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.CreateSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.SkillDTO;
import com.rightFit.dto.AssociateProfileDtos.UpdateSkillRequest;
import com.rightFit.entity.Skill;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.SkillRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Admin-managed skill catalog (BRD 18). Retired, not deleted - existing employee_skills rows must
 * keep working regardless of catalog changes. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SkillCatalogService {

    private final SkillRepository skillRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SkillDTO> list(boolean activeOnly) {
        List<Skill> skills = activeOnly
                ? skillRepository.findByIsActiveTrueOrderBySkillNameAsc()
                : skillRepository.findAllByOrderBySkillNameAsc();
        return skills.stream().map(this::toDTO).toList();
    }

    public SkillDTO create(CreateSkillRequest request) {
        skillRepository.findBySkillNameIgnoreCase(request.getSkillName()).ifPresent(existing -> {
            throw new DuplicateEntityException("Skill", "skillName", request.getSkillName());
        });
        Skill saved = skillRepository.save(Skill.builder()
                .skillName(request.getSkillName())
                .category(request.getCategory())
                .description(request.getDescription())
                .isActive(true)
                .build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_CREATED", "SKILL",
                saved.getId(), null, null, "Skill catalog entry created: " + saved.getSkillName());
        return toDTO(saved);
    }

    public SkillDTO update(Long id, UpdateSkillRequest request) {
        Skill skill = find(id);
        if (request.getSkillName() != null) {
            skill.setSkillName(request.getSkillName());
        }
        if (request.getCategory() != null) {
            skill.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            skill.setDescription(request.getDescription());
        }
        Skill saved = skillRepository.save(skill);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_UPDATED", "SKILL",
                saved.getId(), null, null, "Skill catalog entry updated: " + saved.getSkillName());
        return toDTO(saved);
    }

    public SkillDTO retire(Long id) {
        Skill skill = find(id);
        skill.setIsActive(false);
        Skill saved = skillRepository.save(skill);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_RETIRED", "SKILL",
                saved.getId(), "true", "false", "Skill retired: " + saved.getSkillName());
        return toDTO(saved);
    }

    private Skill find(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", String.valueOf(id)));
    }

    private SkillDTO toDTO(Skill skill) {
        return SkillDTO.builder()
                .id(skill.getId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .description(skill.getDescription())
                .isActive(skill.getIsActive())
                .build();
    }
}
