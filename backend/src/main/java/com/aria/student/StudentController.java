package com.aria.student;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentRepository repo;

    public StudentController(StudentRepository repo) { this.repo = repo; }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Map.of("success", true, "data", repo.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repo.findById(id)
            .map(s -> ResponseEntity.ok(Map.of("success", true, "data", s)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getByTeacher(@PathVariable Long teacherId) {
        List<Student> students = repo.findByTeacherId(teacherId);
        return ResponseEntity.ok(Map.of("success", true, "data", students, "total", students.size()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Student student) {
        if (student.getStudentCode() == null) {
            student.setStudentCode("STU-" + System.currentTimeMillis());
        }
        Student saved = repo.save(student);
        return ResponseEntity.ok(Map.of("success", true, "data", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Student update) {
        return repo.findById(id).map(s -> {
            if (update.getFullName()  != null) s.setFullName(update.getFullName());
            if (update.getGrade()     != null) s.setGrade(update.getGrade());
            if (update.getLanguage()  != null) s.setLanguage(update.getLanguage());
            return ResponseEntity.ok(Map.of("success", true, "data", repo.save(s)));
        }).orElse(ResponseEntity.notFound().build());
    }
}
