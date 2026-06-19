package com.aria.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressRepository extends JpaRepository<StudentProgress, Long> {
    List<StudentProgress> findByStudentId(Long studentId);
    Optional<StudentProgress> findByStudentIdAndModuleId(Long studentId, Long moduleId);

    @Query("SELECT AVG(p.score) FROM StudentProgress p WHERE p.studentId = :studentId")
    Double avgScoreByStudent(Long studentId);

    @Query("SELECT COUNT(p) FROM StudentProgress p WHERE p.studentId = :studentId AND p.masteryLevel = 'MASTERED'")
    Long masteredCountByStudent(Long studentId);
}
