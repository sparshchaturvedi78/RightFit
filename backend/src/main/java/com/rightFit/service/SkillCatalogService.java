package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.CreateSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.SkillDTO;
import com.rightFit.dto.AssociateProfileDtos.UpdateSkillRequest;
import com.rightFit.dto.SkillCatalogDtos.CreateSkillCategoryRequest;
import com.rightFit.dto.SkillCatalogDtos.HolderDTO;
import com.rightFit.dto.SkillCatalogDtos.SkillCategoryDTO;
import com.rightFit.dto.SkillCatalogDtos.SkillHoldersDTO;
import com.rightFit.dto.SkillCatalogDtos.UpdateSkillCategoryRequest;
import com.rightFit.entity.EmployeeSkill;
import com.rightFit.entity.Skill;
import com.rightFit.entity.SkillCategory;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeSkillRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.SkillCategoryRepository;
import com.rightFit.repository.SkillRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-managed skill catalog: categories, and the skills inside them. Nothing is deleted. A retired skill or
 * category is hidden from new picks, but people who already hold a skill keep it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SkillCatalogService {

    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final AuditLogService auditLogService;

    // ---- categories ---------------------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SkillCategoryDTO> listCategories() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : categoryRepository.countSkillsPerCategory()) {
            counts.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> toCategoryDTO(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    public SkillCategoryDTO createCategory(CreateSkillCategoryRequest request) {
        String name = requireName(request.getName());
        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new DuplicateEntityException("Skill category", "name", name);
        });
        SkillCategory saved = categoryRepository.save(SkillCategory.builder()
                .name(name)
                .description(blankToNull(request.getDescription()))
                .isActive(true)
                .build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_CATEGORY_CREATED", "SKILL_CATEGORY",
                saved.getId(), null, null, "Skill category created: " + saved.getName());
        return toCategoryDTO(saved, 0L);
    }

    public SkillCategoryDTO updateCategory(Long id, UpdateSkillCategoryRequest request) {
        SkillCategory category = findCategory(id);
        if (request.getName() != null) {
            String name = requireName(request.getName());
            categoryRepository.findByNameIgnoreCase(name)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new DuplicateEntityException("Skill category", "name", name);
                    });
            category.setName(name);
        }
        if (request.getDescription() != null) {
            category.setDescription(blankToNull(request.getDescription()));
        }
        SkillCategory saved = categoryRepository.save(category);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_CATEGORY_UPDATED", "SKILL_CATEGORY",
                saved.getId(), null, null, "Skill category updated: " + saved.getName());
        return toCategoryDTO(saved, skillsIn(saved.getId()));
    }

    public SkillCategoryDTO setCategoryActive(Long id, boolean active) {
        SkillCategory category = findCategory(id);
        category.setIsActive(active);
        SkillCategory saved = categoryRepository.save(category);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(),
                active ? "SKILL_CATEGORY_RESTORED" : "SKILL_CATEGORY_RETIRED", "SKILL_CATEGORY", saved.getId(),
                String.valueOf(!active), String.valueOf(active), "Skill category " + (active ? "restored" : "retired")
                        + ": " + saved.getName());
        return toCategoryDTO(saved, skillsIn(saved.getId()));
    }

    // ---- skills -------------------------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SkillDTO> list(boolean activeOnly) {
        List<Skill> skills = activeOnly
                ? skillRepository.findByIsActiveTrueOrderBySkillNameAsc()
                : skillRepository.findAllByOrderBySkillNameAsc();
        Map<Long, Long> holders = new HashMap<>();
        for (Object[] row : employeeSkillRepository.countActiveHoldersPerSkill()) {
            holders.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return skills.stream().map(s -> toDTO(s, holders.getOrDefault(s.getId(), 0L))).toList();
    }

    public SkillDTO create(CreateSkillRequest request) {
        skillRepository.findBySkillNameIgnoreCase(request.getSkillName()).ifPresent(existing -> {
            throw new DuplicateEntityException("Skill", "skillName", request.getSkillName());
        });
        SkillCategory category = requireActiveCategory(request.getCategoryId());
        Skill saved = skillRepository.save(Skill.builder()
                .skillName(request.getSkillName().trim())
                .category(category)
                .description(blankToNull(request.getDescription()))
                .isActive(true)
                .build());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_CREATED", "SKILL",
                saved.getId(), null, null, "Skill catalog entry created: " + saved.getSkillName());
        return toDTO(saved, 0L);
    }

    public SkillDTO update(Long id, UpdateSkillRequest request) {
        Skill skill = find(id);
        if (request.getSkillName() != null) {
            String name = request.getSkillName().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException("Skill name can't be empty");
            }
            skillRepository.findBySkillNameIgnoreCase(name)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new DuplicateEntityException("Skill", "skillName", name);
                    });
            skill.setSkillName(name);
        }
        if (request.getCategoryId() != null) {
            skill.setCategory(requireActiveCategory(request.getCategoryId()));
        }
        if (request.getDescription() != null) {
            skill.setDescription(blankToNull(request.getDescription()));
        }
        Skill saved = skillRepository.save(skill);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "SKILL_UPDATED", "SKILL",
                saved.getId(), null, null, "Skill catalog entry updated: " + saved.getSkillName());
        return toDTO(saved, holdersOf(saved.getId()));
    }

    public SkillDTO setSkillActive(Long id, boolean active) {
        Skill skill = find(id);
        skill.setIsActive(active);
        Skill saved = skillRepository.save(skill);
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(),
                active ? "SKILL_RESTORED" : "SKILL_RETIRED", "SKILL", saved.getId(),
                String.valueOf(!active), String.valueOf(active), "Skill " + (active ? "restored" : "retired")
                        + ": " + saved.getSkillName());
        return toDTO(saved, holdersOf(saved.getId()));
    }

    /** Kept for the existing endpoint. */
    public SkillDTO retire(Long id) {
        return setSkillActive(id, false);
    }

    /** One skill's active holders, optionally within a level band: HIGH 8-10, MEDIUM 5-7, LOW 1-4. */
    @Transactional(readOnly = true)
    public SkillHoldersDTO holders(Long skillId, String level, int page, int size) {
        Skill skill = find(skillId);
        Integer min = null;
        Integer max = null;
        if (level != null) {
            switch (level.trim().toUpperCase()) {
                case "HIGH" -> min = 8;
                case "MEDIUM" -> { min = 5; max = 7; }
                case "LOW" -> max = 4;
                default -> { }
            }
        }
        int safeSize = Math.max(1, Math.min(size, 100));
        Page<EmployeeSkill> rows = employeeSkillRepository.findActiveHolders(skillId, min, max,
                PageRequest.of(Math.max(0, page), safeSize));

        List<HolderDTO> content = new ArrayList<>();
        for (EmployeeSkill es : rows.getContent()) {
            content.add(HolderDTO.builder()
                    .id(es.getEmployee().getId())
                    .employeeId(es.getEmployee().getEmployeeId())
                    .name(es.getEmployee().getFirstName() + " " + es.getEmployee().getLastName())
                    .designation(es.getEmployee().getDesignation())
                    .proficiencyLevel(es.getProficiencyLevel())
                    .yearsOfExperience(es.getYearsOfExperience())
                    .lastUsedDate(es.getLastUsedDate())
                    .build());
        }
        long active = employeeSkillRepository.countActiveHoldersPerSkill().stream()
                .filter(row -> skillId.equals(row[0]))
                .mapToLong(row -> ((Number) row[1]).longValue())
                .findFirst().orElse(0L);
        return SkillHoldersDTO.builder()
                .skill(toDTO(skill, active))
                .activeHolders(active)
                .atLevelSevenOrAbove(employeeSkillRepository.countActiveHoldersAtLeast(skillId, 7))
                .openRequirements(requirementRepository.countOpenDemandForSkill(skill.getSkillName()))
                .content(content)
                .totalElements(rows.getTotalElements())
                .totalPages(rows.getTotalPages())
                .number(rows.getNumber())
                .size(safeSize)
                .build();
    }

    // ---- helpers ------------------------------------------------------------------------------------------------

    private Skill find(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", String.valueOf(id)));
    }

    private SkillCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill category", String.valueOf(id)));
    }

    private SkillCategory requireActiveCategory(Long categoryId) {
        if (categoryId == null) {
            throw new BusinessRuleException("Pick the category this skill belongs to");
        }
        SkillCategory category = findCategory(categoryId);
        if (!Boolean.TRUE.equals(category.getIsActive())) {
            throw new BusinessRuleException("'" + category.getName() + "' is retired. Restore it, or pick another category.");
        }
        return category;
    }

    private long skillsIn(Long categoryId) {
        return skillRepository.findAllByOrderBySkillNameAsc().stream()
                .filter(s -> categoryId.equals(s.getCategoryId()))
                .count();
    }

    private long holdersOf(Long skillId) {
        return employeeSkillRepository.countActiveHoldersPerSkill().stream()
                .filter(row -> skillId.equals(row[0]))
                .mapToLong(row -> ((Number) row[1]).longValue())
                .findFirst().orElse(0L);
    }

    private static String requireName(String raw) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) {
            throw new BusinessRuleException("Name can't be empty");
        }
        return name.length() > 100 ? name.substring(0, 100) : name;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private SkillCategoryDTO toCategoryDTO(SkillCategory c, long skillCount) {
        return SkillCategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .skillCount(skillCount)
                .build();
    }

    private SkillDTO toDTO(Skill skill, long holders) {
        return SkillDTO.builder()
                .id(skill.getId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .categoryId(skill.getCategoryId())
                .description(skill.getDescription())
                .isActive(skill.getIsActive())
                .holderCount(holders)
                .build();
    }
}
