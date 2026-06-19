package com.aria.student;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "STUDENT")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_code", nullable = false, unique = true)
    private String studentCode;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    private Integer grade;

    @Column(nullable = false)
    private String language = "en";

    @Column(nullable = false)
    private String board = "CBSE";   // CBSE | ICSE | IGCSE

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "teacher_id")
    private Long teacherId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters
    public Long getId()                      { return id; }
    public String getStudentCode()           { return studentCode; }
    public void setStudentCode(String v)     { this.studentCode = v; }
    public String getFullName()              { return fullName; }
    public void setFullName(String v)        { this.fullName = v; }
    public Integer getAge()                  { return age; }
    public void setAge(Integer v)            { this.age = v; }
    public Integer getGrade()                { return grade; }
    public void setGrade(Integer v)          { this.grade = v; }
    public String getLanguage()              { return language; }
    public void setLanguage(String v)        { this.language = v; }
    public String getBoard()                 { return board; }
    public void setBoard(String v)           { this.board = v; }
    public Long getParentId()                { return parentId; }
    public void setParentId(Long v)          { this.parentId = v; }
    public Long getTeacherId()               { return teacherId; }
    public void setTeacherId(Long v)         { this.teacherId = v; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
}
