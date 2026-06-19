package com.aria.progress;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressRepository repo;

    public ProgressController(ProgressRepository repo) { this.repo = repo; }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable Long studentId) {
        List<StudentProgress> list = repo.findByStudentId(studentId);
        Double avg = repo.avgScoreByStudent(studentId);
        Long mastered = repo.masteredCountByStudent(studentId);
        return ResponseEntity.ok(Map.of(
            "success", true, "data", list,
            "avgScore", avg != null ? Math.round(avg) : 0,
            "masteredModules", mastered
        ));
    }

    @PostMapping("/update")
    public ResponseEntity<?> update(@RequestBody Map<String, Object> body) {
        Long studentId = Long.parseLong(body.get("studentId").toString());
        Long moduleId  = Long.parseLong(body.get("moduleId").toString());
        Double score   = Double.parseDouble(body.get("score").toString());

        StudentProgress progress = repo.findByStudentIdAndModuleId(studentId, moduleId)
            .orElseGet(() -> {
                StudentProgress p = new StudentProgress();
                p.setStudentId(studentId);
                p.setModuleId(moduleId);
                return p;
            });

        progress.setScore(score);
        progress.setAttempts(progress.getAttempts() + 1);
        progress.setLastStudiedAt(LocalDateTime.now());

        if (score >= 80)      progress.setMasteryLevel("MASTERED");
        else if (score >= 60) progress.setMasteryLevel("PRACTISING");
        else                  progress.setMasteryLevel("LEARNING");

        if ("MASTERED".equals(progress.getMasteryLevel()) && progress.getMasteredAt() == null) {
            progress.setMasteredAt(LocalDateTime.now());
        }

        return ResponseEntity.ok(Map.of("success", true, "data", repo.save(progress)));
    }
}
