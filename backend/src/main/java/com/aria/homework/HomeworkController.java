package com.aria.homework;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

// ─── JPA Entity ──────────────────────────────────────────────

@Entity
@Table(name = "HOMEWORK_SESSION")
class HomeworkSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "session_code", unique = true, nullable = false)
    String sessionCode;

    @Column(name = "student_id")      Long    studentId;
    @Column                           String  subject;
    @Column(name = "topic_detected")  String  topicDetected;
    @Column                           String  board;
    @Column                           Integer grade;
    @Column                           String  language = "en";
    @Column(name = "student_level")   String  studentLevel = "AVERAGE";
    @Column(name = "original_question", columnDefinition = "TEXT") String originalQuestion;
    @Column(name = "document_name")   String  documentName;
    @Column(name = "document_type")   String  documentType;
    @Column(name = "has_document")    Boolean hasDocument = false;
    @Column(name = "board_reference") String  boardReference;
    @Column(name = "concept_explanation", columnDefinition = "TEXT") String conceptExplanation;
    @Column(name = "complete_solution",   columnDefinition = "TEXT") String completeSolution;
    @Column(name = "key_points",          columnDefinition = "TEXT") String keyPoints;
    @Column(name = "exam_tip",            columnDefinition = "TEXT") String examTip;
    @Column(name = "practice_problem",    columnDefinition = "TEXT") String practiceProblem;
    @Column(name = "verification",        columnDefinition = "TEXT") String verification;
    @Column(name = "answer_confidence")   BigDecimal answerConfidence;
    @Column(name = "total_followups")     Integer totalFollowups = 0;
    @Column(name = "created_at")      LocalDateTime createdAt    = LocalDateTime.now();
    @Column(name = "last_activity")   LocalDateTime lastActivity = LocalDateTime.now();
}

@Entity
@Table(name = "HOMEWORK_FOLLOWUP")
class HomeworkFollowup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "session_id")               Long      sessionId;
    @Column(columnDefinition = "TEXT")         String    question;
    @Column(columnDefinition = "TEXT")         String    answer;
    @Column(name = "created_at")               LocalDateTime createdAt = LocalDateTime.now();
}

// ─── Repositories ─────────────────────────────────────────────

interface HomeworkSessionRepository extends JpaRepository<HomeworkSession, Long> {
    Optional<HomeworkSession> findBySessionCode(String code);
    List<HomeworkSession> findByStudentId(Long studentId, Sort sort);
}

interface HomeworkFollowupRepository extends JpaRepository<HomeworkFollowup, Long> {
    List<HomeworkFollowup> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}

// ─── Controller ───────────────────────────────────────────────

@RestController
@RequestMapping("/api/homework")
@CrossOrigin(origins = {
    "https://bkumars22.github.io",
    "https://*.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001"
})
public class HomeworkController {

    private final HomeworkSessionRepository sessions;
    private final HomeworkFollowupRepository followups;
    private final ObjectMapper json = new ObjectMapper();

    private static final String AI_URL = System.getenv().getOrDefault(
        "AI_SERVICE_URL", "http://localhost:8000"
    );
    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME = Set.of(
        "application/pdf", "image/jpeg", "image/png", "image/webp"
    );

    public HomeworkController(HomeworkSessionRepository sessions,
                              HomeworkFollowupRepository followups) {
        this.sessions  = sessions;
        this.followups = followups;
    }

    // ── POST /api/homework/solve ───────────────────────────────

    @PostMapping("/solve")
    public ResponseEntity<?> solve(
        @RequestParam(required = false) MultipartFile file,
        @RequestParam(required = false) String  studentQuestion,
        @RequestParam(required = false) Integer grade,
        @RequestParam(required = false) String  board,
        @RequestParam(required = false) String  subject,
        @RequestParam(defaultValue = "en")       String  language,
        @RequestParam(defaultValue = "AVERAGE")  String  studentLevel,
        @RequestParam(defaultValue = "true")     Boolean wantFullAnswer,
        @RequestParam(defaultValue = "true")     Boolean wantStepByStep,
        @RequestParam(required = false) Long     studentId
    ) {
        try {
            // Validate file if provided
            String base64 = null;
            String docType = null;
            String docName = null;
            if (file != null && !file.isEmpty()) {
                if (file.getSize() > MAX_FILE_BYTES)
                    return error(400, "File too large. Max 10 MB allowed.");
                if (!ALLOWED_MIME.contains(file.getContentType()))
                    return error(400, "Unsupported file type. Use PDF, JPG, PNG, or WEBP.");
                base64  = Base64.getEncoder().encodeToString(file.getBytes());
                docType = file.getContentType().equals("application/pdf") ? "pdf" : "image";
                docName = file.getOriginalFilename();
            }

            // Build request to AI service
            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("document_base64",   base64 != null ? base64 : "");
            aiRequest.put("document_type",     docType != null ? docType : "none");
            aiRequest.put("student_question",  studentQuestion != null ? studentQuestion : "");
            aiRequest.put("student_name",      "Student");
            aiRequest.put("grade",             grade != null ? grade : 5);
            aiRequest.put("board",             board != null ? board : "CBSE");
            aiRequest.put("subject",           subject != null ? subject : "General");
            aiRequest.put("language",          language);
            aiRequest.put("student_level",     studentLevel);
            aiRequest.put("want_full_answer",  wantFullAnswer);
            aiRequest.put("want_step_by_step", wantStepByStep);

            // Call Python AI service
            WebClient client = WebClient.create(AI_URL);
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResp = client.post()
                .uri("/homework/solve")
                .header("Content-Type", "application/json")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            // Save session to DB
            HomeworkSession s = new HomeworkSession();
            s.sessionCode   = UUID.randomUUID().toString();
            s.studentId     = studentId;
            s.subject       = subject(aiResp, "subject_detected", subject);
            s.topicDetected = str(aiResp, "topic_detected");
            s.board         = board;
            s.grade         = grade;
            s.language      = language;
            s.studentLevel  = studentLevel;
            s.originalQuestion    = studentQuestion;
            s.documentName        = docName;
            s.documentType        = docType;
            s.hasDocument         = docType != null;
            s.boardReference      = str(aiResp, "board_reference");
            s.conceptExplanation  = str(aiResp, "concept_explanation");
            s.completeSolution    = str(aiResp, "complete_solution");
            s.keyPoints           = toJsonStr(aiResp.get("key_points"));
            s.examTip             = str(aiResp, "exam_tip");
            s.practiceProblem     = str(aiResp, "practice_problem");
            s.verification        = str(aiResp, "verification");
            Object conf = aiResp.get("answer_confidence");
            s.answerConfidence    = conf != null ? new BigDecimal(conf.toString()) : new BigDecimal("0.90");

            sessions.save(s);

            // Return AI response + session code
            Map<String, Object> resp = new HashMap<>(aiResp);
            resp.put("sessionCode", s.sessionCode);
            resp.put("sessionId",   s.id);
            return ResponseEntity.ok(Map.of("success", true, "data", resp));

        } catch (Exception e) {
            return error(500, "Failed to get answer: " + e.getMessage());
        }
    }

    // ── POST /api/homework/{sessionId}/followup ────────────────

    @PostMapping("/{sessionId}/followup")
    public ResponseEntity<?> followup(
        @PathVariable Long sessionId,
        @RequestBody  Map<String, String> body
    ) {
        try {
            HomeworkSession s = sessions.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
            String question = body.getOrDefault("question", "");
            if (question.isBlank()) return error(400, "Question is required.");

            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("document_base64",   "");
            aiRequest.put("document_type",     "none");
            aiRequest.put("student_question",  question);
            aiRequest.put("student_name",      "Student");
            aiRequest.put("grade",             s.grade != null ? s.grade : 5);
            aiRequest.put("board",             s.board != null ? s.board : "CBSE");
            aiRequest.put("subject",           s.subject != null ? s.subject : "General");
            aiRequest.put("language",          s.language);
            aiRequest.put("student_level",     s.studentLevel);
            aiRequest.put("prior_context",     s.completeSolution != null ? s.completeSolution.substring(0, Math.min(800, s.completeSolution.length())) : "");
            aiRequest.put("want_full_answer",  true);
            aiRequest.put("want_step_by_step", true);

            WebClient client = WebClient.create(AI_URL);
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResp = client.post()
                .uri("/homework/solve")
                .header("Content-Type", "application/json")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            HomeworkFollowup fu = new HomeworkFollowup();
            fu.sessionId = sessionId;
            fu.question  = question;
            fu.answer    = str(aiResp, "complete_solution");
            followups.save(fu);

            s.totalFollowups = (s.totalFollowups == null ? 0 : s.totalFollowups) + 1;
            s.lastActivity   = LocalDateTime.now();
            sessions.save(s);

            return ResponseEntity.ok(Map.of("success", true, "data", aiResp));
        } catch (Exception e) {
            return error(500, "Followup failed: " + e.getMessage());
        }
    }

    // ── GET /api/homework/history/{studentId} ──────────────────

    @GetMapping("/history/{studentId}")
    public ResponseEntity<?> history(@PathVariable Long studentId,
                                     @RequestParam(defaultValue = "0")  int page,
                                     @RequestParam(defaultValue = "20") int size) {
        try {
            List<HomeworkSession> list = sessions.findByStudentId(
                studentId, Sort.by(Sort.Direction.DESC, "createdAt")
            );
            int start = Math.min(page * size, list.size());
            int end   = Math.min(start + size, list.size());
            List<Map<String, Object>> cards = new ArrayList<>();
            for (HomeworkSession s : list.subList(start, end)) {
                Map<String, Object> card = new LinkedHashMap<>();
                card.put("id",            s.id);
                card.put("sessionCode",   s.sessionCode);
                card.put("subject",       s.subject);
                card.put("topicDetected", s.topicDetected);
                card.put("grade",         s.grade);
                card.put("board",         s.board);
                card.put("language",      s.language);
                card.put("studentLevel",  s.studentLevel);
                card.put("originalQuestion", s.originalQuestion);
                card.put("hasDocument",   s.hasDocument);
                card.put("boardReference",s.boardReference);
                card.put("examTip",       s.examTip);
                card.put("totalFollowups",s.totalFollowups);
                card.put("createdAt",     s.createdAt != null ? s.createdAt.toString() : null);
                cards.add(card);
            }
            return ResponseEntity.ok(Map.of("success", true, "data", cards, "total", list.size()));
        } catch (Exception e) {
            return error(500, e.getMessage());
        }
    }

    // ── GET /api/homework/{sessionId} ─────────────────────────

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSession(@PathVariable Long sessionId) {
        try {
            HomeworkSession s = sessions.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

            List<HomeworkFollowup> fus = followups.findBySessionIdOrderByCreatedAtAsc(sessionId);
            List<Map<String, Object>> fuList = new ArrayList<>();
            for (HomeworkFollowup fu : fus) {
                fuList.add(Map.of(
                    "id",        fu.id,
                    "question",  fu.question,
                    "answer",    fu.answer,
                    "createdAt", fu.createdAt != null ? fu.createdAt.toString() : ""
                ));
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id",                 s.id);
            data.put("sessionCode",        s.sessionCode);
            data.put("subject",            s.subject);
            data.put("topicDetected",      s.topicDetected);
            data.put("boardReference",     s.boardReference);
            data.put("conceptExplanation", s.conceptExplanation);
            data.put("completeSolution",   s.completeSolution);
            data.put("keyPoints",          parseJsonList(s.keyPoints));
            data.put("examTip",            s.examTip);
            data.put("practiceProblem",    s.practiceProblem);
            data.put("verification",       s.verification);
            data.put("answerConfidence",   s.answerConfidence);
            data.put("originalQuestion",   s.originalQuestion);
            data.put("followups",          fuList);

            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception e) {
            return error(500, e.getMessage());
        }
    }

    // ── POST /api/homework/{sessionId}/verify-attempt ──────────

    @PostMapping("/{sessionId}/verify-attempt")
    public ResponseEntity<?> verifyAttempt(
        @PathVariable Long sessionId,
        @RequestBody  Map<String, String> body
    ) {
        try {
            HomeworkSession s = sessions.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
            String studentAnswer = body.getOrDefault("studentAnswer", "");
            if (studentAnswer.isBlank()) return error(400, "Student answer required.");

            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("document_base64",  "");
            aiRequest.put("document_type",    "none");
            aiRequest.put("student_question",
                "The practice problem is: " + s.practiceProblem +
                "\nThe student's answer is: " + studentAnswer +
                "\nIs this correct? Explain briefly and give the correct answer if wrong.");
            aiRequest.put("student_name",     "Student");
            aiRequest.put("grade",            s.grade != null ? s.grade : 5);
            aiRequest.put("board",            s.board != null ? s.board : "CBSE");
            aiRequest.put("subject",          s.subject != null ? s.subject : "General");
            aiRequest.put("language",         s.language);
            aiRequest.put("student_level",    s.studentLevel);
            aiRequest.put("want_full_answer", true);
            aiRequest.put("want_step_by_step",false);

            WebClient client = WebClient.create(AI_URL);
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResp = client.post()
                .uri("/homework/solve")
                .header("Content-Type", "application/json")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            String feedback = str(aiResp, "complete_solution");
            boolean correct = feedback != null &&
                (feedback.toLowerCase().contains("correct") || feedback.toLowerCase().contains("right"));

            return ResponseEntity.ok(Map.of(
                "success",       true,
                "correct",       correct,
                "feedback",      feedback,
                "correctAnswer", s.practiceProblem
            ));
        } catch (Exception e) {
            return error(500, e.getMessage());
        }
    }

    // ── POST /api/homework/detect ──────────────────────────────

    @PostMapping("/detect")
    public ResponseEntity<?> detect(
        @RequestParam(required = false) MultipartFile file,
        @RequestParam(required = false) String question
    ) {
        try {
            String base64  = null;
            String docType = null;
            if (file != null && !file.isEmpty()) {
                base64  = Base64.getEncoder().encodeToString(file.getBytes());
                docType = file.getContentType().equals("application/pdf") ? "pdf" : "image";
            }

            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("document_base64", base64 != null ? base64 : "");
            aiRequest.put("document_type",   docType != null ? docType : "none");
            aiRequest.put("question",        question != null ? question : "");

            WebClient client = WebClient.create(AI_URL);
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResp = client.post()
                .uri("/homework/detect")
                .header("Content-Type", "application/json")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            return ResponseEntity.ok(Map.of("success", true, "data", aiResp));
        } catch (Exception e) {
            return error(500, e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> error(int status, String msg) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", msg));
    }

    private String str(Map<String, Object> m, String key) {
        return m != null && m.get(key) != null ? m.get(key).toString() : null;
    }

    private String subject(Map<String, Object> m, String aiKey, String fallback) {
        String v = str(m, aiKey);
        return v != null && !v.isBlank() ? v : fallback;
    }

    private String toJsonStr(Object o) {
        if (o == null) return "[]";
        try { return json.writeValueAsString(o); } catch (Exception e) { return "[]"; }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonList(String s) {
        if (s == null || s.isBlank()) return List.of();
        try { return json.readValue(s, List.class); } catch (Exception e) { return List.of(s); }
    }
}
