package com.aria.curriculum;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/curriculum")
@CrossOrigin(origins = "*")
public class CurriculumController {

    private final CurriculumRepository repo;

    public CurriculumController(CurriculumRepository repo) { this.repo = repo; }

    @GetMapping
    public ResponseEntity<?> query(
            @RequestParam(required = false) Integer grade,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String language) {

        List<CurriculumModule> modules;

        if (grade != null && subject != null && difficulty != null) {
            modules = repo.findByGradeLevelAndSubjectAndDifficultyAndIsActiveTrue(grade, subject, difficulty);
        } else if (grade != null && subject != null) {
            modules = repo.findByGradeLevelAndSubjectAndIsActiveTrue(grade, subject);
        } else if (grade != null) {
            modules = repo.findByGradeLevelAndIsActiveTrue(grade);
        } else if (subject != null) {
            modules = repo.findBySubjectAndIsActiveTrue(subject);
        } else {
            modules = repo.findAll();
        }

        return ResponseEntity.ok(Map.of("success", true, "data", modules, "total", modules.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repo.findById(id)
            .map(m -> ResponseEntity.ok(Map.of("success", true, "data", m)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subjects")
    public ResponseEntity<?> getSubjects() {
        List<String> subjects = List.of("Mathematics", "Science", "English", "Coding", "Life Skills");
        return ResponseEntity.ok(Map.of("success", true, "data", subjects));
    }
}
