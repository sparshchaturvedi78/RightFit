package com.rightFit.service;

import com.rightFit.dto.DemandSupplyDtos.DemandSupplySummaryDTO;
import com.rightFit.dto.DemandSupplyDtos.SkillDemandSupplyDTO;
import com.rightFit.entity.Skill;
import com.rightFit.repository.EmployeeRepository;
import com.rightFit.repository.EmployeeSkillRepository;
import com.rightFit.repository.ProjectRequirementRepository;
import com.rightFit.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Demand & Supply Analytics (BRD 27, FR-050/051): per-skill open demand (published requirements
 * naming the skill in their free-text requiredSkills, the same way candidate search already matches
 * it - there's no structured FK from a requirement to the Skill catalog) versus supply (active
 * employees holding that skill). Surfaces "High Demand + Low Supply" shortages, per the BRD's own
 * phrasing, as the rows where demand exceeds supply, sorted worst-gap-first.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkforceIntelligenceService {

    private final SkillRepository skillRepository;
    private final ProjectRequirementRepository requirementRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final EmployeeRepository employeeRepository;

    public DemandSupplySummaryDTO demandSupply() {
        List<Skill> skills = skillRepository.findByIsActiveTrueOrderBySkillNameAsc();
        List<SkillDemandSupplyDTO> bySkill = skills.stream()
                .map(this::toSkillDTO)
                .sorted(Comparator.comparingLong(SkillDemandSupplyDTO::getGap).reversed())
                .toList();

        return DemandSupplySummaryDTO.builder()
                .openRequirements(requirementRepository.countByStatus("PUBLISHED"))
                .availableEmployees(employeeRepository.countByEmploymentStatusAndPoolStatus("ACTIVE", "IN_RESOURCE_POOL"))
                .bySkill(bySkill)
                .build();
    }

    private SkillDemandSupplyDTO toSkillDTO(Skill skill) {
        long demand = requirementRepository.countOpenDemandForSkill(skill.getSkillName());
        long supply = employeeSkillRepository.countActiveEmployeesWithSkill(skill.getId());
        return SkillDemandSupplyDTO.builder()
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .demand(demand)
                .supply(supply)
                .gap(demand - supply)
                .shortage(demand > supply)
                .build();
    }
}
