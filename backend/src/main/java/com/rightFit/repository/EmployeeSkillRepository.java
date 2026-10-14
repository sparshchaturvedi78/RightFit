package com.rightFit.repository;

import com.rightFit.entity.EmployeeSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Long> {

    List<EmployeeSkill> findByEmployeeIdOrderBySkillSkillNameAsc(Long employeeId);

    Optional<EmployeeSkill> findByEmployeeIdAndSkillId(Long employeeId, Long skillId);

    /** Update/remove address a skill by name, not the internal row id - an employee has at most one
     * row per skill (DB-enforced), so the name alone is already unambiguous for their own record. */
    Optional<EmployeeSkill> findByEmployeeIdAndSkill_SkillNameIgnoreCase(Long employeeId, String skillName);

    /** Demand & Supply Analytics (BRD 27): active employees who hold a given catalog skill. */
    @Query("SELECT COUNT(es) FROM EmployeeSkill es WHERE es.skill.id = :skillId AND es.employee.employmentStatus = 'ACTIVE'")
    long countActiveEmployeesWithSkill(@Param("skillId") Long skillId);

    /** People with this skill who are ACTIVE, optionally within a proficiency range (null = no limit). */
    @Query(value = "SELECT es FROM EmployeeSkill es JOIN FETCH es.employee e " +
            "WHERE es.skill.id = :skillId AND e.employmentStatus = 'ACTIVE' " +
            "AND (CAST(:min AS integer) IS NULL OR es.proficiencyLevel >= :min) " +
            "AND (CAST(:max AS integer) IS NULL OR es.proficiencyLevel <= :max) " +
            "ORDER BY es.proficiencyLevel DESC, e.employeeId",
            countQuery = "SELECT COUNT(es) FROM EmployeeSkill es WHERE es.skill.id = :skillId " +
            "AND es.employee.employmentStatus = 'ACTIVE' " +
            "AND (CAST(:min AS integer) IS NULL OR es.proficiencyLevel >= :min) " +
            "AND (CAST(:max AS integer) IS NULL OR es.proficiencyLevel <= :max)")
    org.springframework.data.domain.Page<EmployeeSkill> findActiveHolders(
            @Param("skillId") Long skillId, @Param("min") Integer min, @Param("max") Integer max,
            org.springframework.data.domain.Pageable pageable);

    /** [skill id, number of ACTIVE people holding it] for every skill that has any holder. */
    @Query("SELECT es.skill.id, COUNT(es) FROM EmployeeSkill es WHERE es.employee.employmentStatus = 'ACTIVE' " +
            "GROUP BY es.skill.id")
    java.util.List<Object[]> countActiveHoldersPerSkill();

    /** Active people holding the skill at this level or above. */
    @Query("SELECT COUNT(es) FROM EmployeeSkill es WHERE es.skill.id = :skillId AND es.employee.employmentStatus = 'ACTIVE' " +
            "AND es.proficiencyLevel >= :level")
    long countActiveHoldersAtLeast(@Param("skillId") Long skillId, @Param("level") int level);
}
