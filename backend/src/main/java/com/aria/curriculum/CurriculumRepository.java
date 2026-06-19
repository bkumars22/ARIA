package com.aria.curriculum;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CurriculumRepository extends JpaRepository<CurriculumModule, Long> {
    List<CurriculumModule> findByGradeLevelAndSubjectAndIsActiveTrue(Integer grade, String subject);
    List<CurriculumModule> findByGradeLevelAndIsActiveTrue(Integer grade);
    List<CurriculumModule> findBySubjectAndIsActiveTrue(String subject);
    List<CurriculumModule> findByGradeLevelAndSubjectAndDifficultyAndIsActiveTrue(
        Integer grade, String subject, String difficulty);
}
