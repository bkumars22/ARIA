package com.aria.curriculum;

import jakarta.persistence.*;

@Entity
@Table(name = "CURRICULUM_MODULE")
public class CurriculumModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String topic;

    @Column(name = "grade_level", nullable = false)
    private Integer gradeLevel;

    private String difficulty = "MEDIUM";
    private String description;

    @Column(name = "learning_goals")
    private String learningGoals;

    private String prerequisites;
    private String language = "en";

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Long getId()               { return id; }
    public String getSubject()        { return subject; }
    public void setSubject(String v)  { this.subject = v; }
    public String getTopic()          { return topic; }
    public void setTopic(String v)    { this.topic = v; }
    public Integer getGradeLevel()    { return gradeLevel; }
    public void setGradeLevel(Integer v) { this.gradeLevel = v; }
    public String getDifficulty()     { return difficulty; }
    public void setDifficulty(String v) { this.difficulty = v; }
    public String getDescription()    { return description; }
    public void setDescription(String v) { this.description = v; }
    public String getLearningGoals()  { return learningGoals; }
    public void setLearningGoals(String v) { this.learningGoals = v; }
    public String getLanguage()       { return language; }
    public void setLanguage(String v) { this.language = v; }
    public Boolean getIsActive()      { return isActive; }
}
