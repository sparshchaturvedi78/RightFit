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
}
