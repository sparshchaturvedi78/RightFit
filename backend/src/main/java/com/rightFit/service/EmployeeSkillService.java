package com.rightFit.service;

import com.rightFit.dto.AssociateProfileDtos.AddEmployeeSkillRequest;
import com.rightFit.dto.AssociateProfileDtos.EmployeeSkillDTO;
import com.rightFit.dto.AssociateProfileDtos.UpdateEmployeeSkillRequest;
import com.rightFit.entity.Employee;
import com.rightFit.entity.EmployeeSkill;
import com.rightFit.entity.Skill;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.exception.DuplicateEntityException;
import com.rightFit.exception.ResourceNotFoundException;
import com.rightFit.repository.EmployeeSkillRepository;
import com.rightFit.repository.SkillRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Associate Phase: self-service skills (BRD 18). Removing a skill only unlinks it from the
 * employee - the shared catalog entry is never touched. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeSkillService {

    private final EmployeeSkillRepository employeeSkillRepository;
    private final SkillRepository skillRepository;
    private final RequirementAccessGuard accessGuard;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EmployeeSkillDTO> listMine() {
        Employee employee = accessGuard.currentEmployee();
        return employeeSkillRepository.findByEmployeeIdOrderBySkillSkillNameAsc(employee.getId()).stream()
                .map(this::toDTO).toList();
    }

    public EmployeeSkillDTO addMine(AddEmployeeSkillRequest request) {
        Employee employee = accessGuard.currentEmployee();
        Skill skill = skillRepository.findBySkillNameIgnoreCase(request.getSkillName())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", request.getSkillName()));
        if (!Boolean.TRUE.equals(skill.getIsActive())) {
            throw new BusinessRuleException("'" + skill.getSkillName() + "' has been retired and is no longer available for new selections");
        }

        if (employeeSkillRepository.findByEmployeeIdAndSkillId(employee.getId(), skill.getId()).isPresent()) {
            throw new DuplicateEntityException("EmployeeSkill", "skill", skill.getSkillName());
        }

        EmployeeSkill saved = employeeSkillRepository.save(EmployeeSkill.builder()
                .employee(employee)
                .skill(skill)
                .proficiencyLevel(request.getProficiencyLevel())
                .yearsOfExperience(request.getYearsOfExperience())
                .lastUsedDate(request.getLastUsedDate())
                .build());

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_SKILL_ADDED", "EMPLOYEE_SKILL",
                saved.getId(), null, null, employee.getEmployeeId() + " added skill " + skill.getSkillName());
        return toDTO(saved);
    }

    public EmployeeSkillDTO updateMine(String skillName, UpdateEmployeeSkillRequest request) {
        Employee employee = accessGuard.currentEmployee();
        EmployeeSkill employeeSkill = findMine(employee, skillName);

        if (request.getProficiencyLevel() != null) {
            employeeSkill.setProficiencyLevel(request.getProficiencyLevel());
        }
        if (request.getYearsOfExperience() != null) {
            employeeSkill.setYearsOfExperience(request.getYearsOfExperience());
        }
        if (request.getLastUsedDate() != null) {
            employeeSkill.setLastUsedDate(request.getLastUsedDate());
        }
        EmployeeSkill saved = employeeSkillRepository.save(employeeSkill);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_SKILL_UPDATED", "EMPLOYEE_SKILL",
                saved.getId(), null, null,
                employee.getEmployeeId() + " updated skill " + saved.getSkill().getSkillName());
        return toDTO(saved);
    }

    public void removeMine(String skillName) {
        Employee employee = accessGuard.currentEmployee();
        EmployeeSkill employeeSkill = findMine(employee, skillName);
        Long employeeSkillId = employeeSkill.getId();
        employeeSkillRepository.delete(employeeSkill);

        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "EMPLOYEE_SKILL_REMOVED", "EMPLOYEE_SKILL",
                employeeSkillId, employeeSkill.getSkill().getSkillName(), null,
                employee.getEmployeeId() + " removed skill " + employeeSkill.getSkill().getSkillName());
    }

    /** An employee has at most one row per skill (DB-enforced unique constraint), so the skill name
     * alone is already unambiguous for their own record - no internal row id needed in the URL. */
    private EmployeeSkill findMine(Employee employee, String skillName) {
        return employeeSkillRepository.findByEmployeeIdAndSkill_SkillNameIgnoreCase(employee.getId(), skillName)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeSkill", skillName));
    }

    private EmployeeSkillDTO toDTO(EmployeeSkill employeeSkill) {
        Skill skill = employeeSkill.getSkill();
        return EmployeeSkillDTO.builder()
                .id(employeeSkill.getId())
                .skillId(skill.getId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .proficiencyLevel(employeeSkill.getProficiencyLevel())
                .yearsOfExperience(employeeSkill.getYearsOfExperience())
                .lastUsedDate(employeeSkill.getLastUsedDate())
                .build();
    }
}
