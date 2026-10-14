package com.rightFit.repository;

import com.rightFit.entity.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillCategoryRepository extends JpaRepository<SkillCategory, Long> {

    List<SkillCategory> findAllByOrderByNameAsc();

    List<SkillCategory> findByIsActiveTrueOrderByNameAsc();

    Optional<SkillCategory> findByNameIgnoreCase(String name);

    /** [category id, number of skills in it] for every category (categories with none are absent). */
    @Query("SELECT s.category.id, COUNT(s) FROM Skill s WHERE s.category IS NOT NULL GROUP BY s.category.id")
    List<Object[]> countSkillsPerCategory();
}
