package com.aria.agent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<LearningSession, Long> {
    List<LearningSession> findByStudentIdOrderByStartedAtDesc(Long studentId);

    @Query("SELECT s FROM LearningSession s WHERE s.studentId = :studentId AND s.status = 'ACTIVE'")
    List<LearningSession> findActiveByStudentId(Long studentId);
}
