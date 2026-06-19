package com.aria.progress;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "STUDENT_PROGRESS",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "module_id"}))
public class StudentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "module_id", nullable = false)
    private Long moduleId;

    @Column(name = "mastery_level")
    private String masteryLevel = "NOT_STARTED"; // NOT_STARTED, LEARNING, PRACTISING, MASTERED

    private Double score = 0.0;
    private Integer attempts = 0;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;

    @Column(name = "mastered_at")
    private LocalDateTime masteredAt;

    public Long getId()                            { return id; }
    public Long getStudentId()                     { return studentId; }
    public void setStudentId(Long v)               { this.studentId = v; }
    public Long getModuleId()                      { return moduleId; }
    public void setModuleId(Long v)                { this.moduleId = v; }
    public String getMasteryLevel()                { return masteryLevel; }
    public void setMasteryLevel(String v)          { this.masteryLevel = v; }
    public Double getScore()                       { return score; }
    public void setScore(Double v)                 { this.score = v; }
    public Integer getAttempts()                   { return attempts; }
    public void setAttempts(Integer v)             { this.attempts = v; }
    public LocalDateTime getLastStudiedAt()        { return lastStudiedAt; }
    public void setLastStudiedAt(LocalDateTime v)  { this.lastStudiedAt = v; }
    public LocalDateTime getMasteredAt()           { return masteredAt; }
    public void setMasteredAt(LocalDateTime v)     { this.masteredAt = v; }
}
