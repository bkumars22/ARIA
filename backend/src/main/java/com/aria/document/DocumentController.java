package com.aria.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

// ─── Entity ────────────────────────────────────────────────────

@Entity
@Table(name = "DOCUMENT_SESSION")
class DocumentSession {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;

    @Column(name = "session_code", unique = true, nullable = false)
    String sessionCode;

    @Column(name = "student_id")       Long   studentId;
    @Column(name = "document_name")    String documentName;
    @Column(name = "document_type")    String documentType;
    @Column(name = "subject_detected") String subjectDetected;
    @Column(name = "topic_detected")   String topicDetected;
    @Column(name = "grade_detected")   Integer gradeDetected;
    @Column(name = "explanation_level") String explanationLevel;
    String language;
    String board;
    @Column(columnDefinition = "TEXT") String explanation;
    @Column(name = "practice_questions", columnDefinition = "TEXT") String practiceQuestions;
    @Column(name = "key_points",         columnDefinition = "TEXT") String keyPoints;
    @Column(name = "specific_question",  columnDefinition = "TEXT") String specificQuestion;
    @Column(name = "difficulty_rating")  Integer difficultyRating;
    @Column(name = "created_at")         LocalDateTime createdAt = LocalDateTime.now();

    // Getters
    public Long    getId()               { return id; }
    public String  getSessionCode()      { return sessionCode; }
    public Long    getStudentId()        { return studentId; }
    public String  getDocumentName()     { return documentName; }
    public String  getDocumentType()     { return documentType; }
    public String  getSubjectDetected()  { return subjectDetected; }
    public String  getTopicDetected()    { return topicDetected; }
    public Integer getGradeDetected()    { return gradeDetected; }
    public String  getExplanationLevel() { return explanationLevel; }
    public String  getLanguage()         { return language; }
    public String  getBoard()            { return board; }
    public String  getExplanation()      { return explanation; }
    public String  getPracticeQuestions(){ return practiceQuestions; }
    public String  getKeyPoints()        { return keyPoints; }
    public String  getSpecificQuestion() { return specificQuestion; }
    public Integer getDifficultyRating() { return difficultyRating; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
}

// ─── Repository ────────────────────────────────────────────────

interface DocumentSessionRepository extends JpaRepository<DocumentSession, Long> {
    Optional<DocumentSession> findBySessionCode(String sessionCode);
    Page<DocumentSession> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);
    List<DocumentSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}

// ─── Controller ────────────────────────────────────────────────

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private static final long   MAX_FILE_BYTES  = 10L * 1024 * 1024;  // 10 MB
    private static final Set<String> ALLOWED_MIME = Set.of(
        "application/pdf", "image/jpeg", "image/png", "image/webp"
    );

    private final DocumentSessionRepository repo;
    private final WebClient                 aiClient;
    private final ObjectMapper              mapper = new ObjectMapper();

    private static final String AI_URL = System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8001");

    public DocumentController(DocumentSessionRepository repo) {
        this.repo     = repo;
        this.aiClient = WebClient.create(AI_URL);
    }

    // ── POST /api/documents/explain ──────────────────────────

    @PostMapping(value = "/explain", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> explain(
        @RequestParam("file")              MultipartFile file,
        @RequestParam("grade")             int           grade,
        @RequestParam("level")             String        level,
        @RequestParam("language")          String        language,
        @RequestParam("board")             String        board,
        @RequestParam(value = "studentId", required = false) Long studentId,
        @RequestParam(value = "question",  required = false) String question
    ) {
        // Validate file
        if (file == null || file.isEmpty())
            return error(400, "No file uploaded.");
        if (file.getSize() > MAX_FILE_BYTES)
            return error(413, "File too large. Maximum size is 10 MB.");
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_MIME.contains(mime))
            return error(415, "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP.");

        try {
            // Convert file to base64
            byte[] bytes  = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String docType = mime.equals("application/pdf") ? "pdf" : "image";

            // Build AI request payload
            Map<String, Object> aiPayload = new HashMap<>();
            aiPayload.put("document_base64",  base64);
            aiPayload.put("document_type",    docType);
            aiPayload.put("student_name",     "Student");
            aiPayload.put("grade",            grade);
            aiPayload.put("level",            level);
            aiPayload.put("language",         language);
            aiPayload.put("board",            board);
            if (question != null && !question.isBlank()) aiPayload.put("specific_question", question);

            // Call Python AI service
            Map<?, ?> aiResponse = aiClient.post()
                .uri("/document/explain")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(aiPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (aiResponse == null)
                return error(502, "AI service returned no response.");

            // Persist document session
            DocumentSession session = new DocumentSession();
            session.sessionCode     = "DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            session.studentId       = studentId;
            session.documentName    = file.getOriginalFilename();
            session.documentType    = docType;
            session.subjectDetected = str(aiResponse, "subject_detected");
            session.topicDetected   = str(aiResponse, "topic_detected");
            session.gradeDetected   = num(aiResponse, "grade_detected");
            session.explanationLevel= level;
            session.language        = language;
            session.board           = board;
            session.explanation     = str(aiResponse, "explanation");
            session.practiceQuestions = toJson(aiResponse.get("practice_questions"));
            session.keyPoints       = toJson(aiResponse.get("key_points"));
            session.specificQuestion = question;
            session.difficultyRating = num(aiResponse, "difficulty_rating");
            repo.save(session);

            // Return AI response enriched with session id
            Map<String, Object> result = new LinkedHashMap<>(aiResponse);
            result.put("sessionId",   session.id);
            result.put("sessionCode", session.sessionCode);
            return ResponseEntity.ok(Map.of("success", true, "data", result));

        } catch (Exception e) {
            return error(500, "Explanation failed: " + e.getMessage());
        }
    }

    // ── GET /api/documents/history/{studentId} ───────────────

    @GetMapping("/history/{studentId}")
    public ResponseEntity<?> history(
        @PathVariable Long studentId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<DocumentSession> pg = repo.findByStudentIdOrderByCreatedAtDesc(
            studentId, PageRequest.of(page, size)
        );
        List<Map<String, Object>> items = pg.getContent().stream()
            .map(this::toMap)
            .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data",    items,
            "total",   pg.getTotalElements(),
            "pages",   pg.getTotalPages()
        ));
    }

    // ── GET /api/documents/{sessionId} ───────────────────────

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getOne(@PathVariable Long sessionId) {
        return repo.findById(sessionId)
            .map(s -> ResponseEntity.ok(Map.of("success", true, "data", toMap(s))))
            .orElse(ResponseEntity.notFound().build());
    }

    // ── POST /api/documents/{sessionId}/followup ─────────────

    @PostMapping("/{sessionId}/followup")
    public ResponseEntity<?> followup(
        @PathVariable Long sessionId,
        @RequestBody  Map<String, String> body
    ) {
        String followQuestion = body.getOrDefault("question", "").trim();
        if (followQuestion.isEmpty()) return error(400, "Question is required.");

        DocumentSession session = repo.findById(sessionId).orElse(null);
        if (session == null) return error(404, "Session not found.");

        try {
            Map<String, Object> aiPayload = new HashMap<>();
            aiPayload.put("document_base64",   "");   // no doc re-upload for follow-up
            aiPayload.put("document_type",     session.documentType);
            aiPayload.put("student_name",      "Student");
            aiPayload.put("grade",             session.gradeDetected != null ? session.gradeDetected : 5);
            aiPayload.put("level",             session.explanationLevel);
            aiPayload.put("language",          session.language);
            aiPayload.put("board",             session.board);
            aiPayload.put("specific_question", followQuestion);
            aiPayload.put("prior_explanation", session.explanation);
            aiPayload.put("topic",             session.topicDetected);
            aiPayload.put("subject",           session.subjectDetected);

            Map<?, ?> aiResponse = aiClient.post()
                .uri("/document/followup")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(aiPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            return ResponseEntity.ok(Map.of("success", true, "data",
                aiResponse != null ? aiResponse : Map.of("explanation", "Follow-up processed.")));

        } catch (Exception e) {
            return error(500, "Follow-up failed: " + e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    private Map<String, Object> toMap(DocumentSession s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                s.id);
        m.put("session_code",      s.sessionCode);
        m.put("student_id",        s.studentId);
        m.put("document_name",     s.documentName);
        m.put("document_type",     s.documentType);
        m.put("subject_detected",  s.subjectDetected);
        m.put("topic_detected",    s.topicDetected);
        m.put("grade_detected",    s.gradeDetected);
        m.put("explanation_level", s.explanationLevel);
        m.put("language",          s.language);
        m.put("board",             s.board);
        m.put("explanation",       s.explanation);
        m.put("practice_questions", parseJsonList(s.practiceQuestions));
        m.put("key_points",         parseJsonList(s.keyPoints));
        m.put("specific_question",  s.specificQuestion);
        m.put("difficulty_rating",  s.difficultyRating);
        m.put("created_at",         s.createdAt != null ? s.createdAt.toString() : null);
        return m;
    }

    private ResponseEntity<Map<String, Object>> error(int status, String msg) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", msg));
    }

    private String str(Map<?, ?> m, String key) {
        Object v = m.get(key); return v != null ? v.toString() : null;
    }

    private Integer num(Map<?, ?> m, String key) {
        Object v = m.get(key);
        if (v instanceof Integer i) return i;
        if (v instanceof Number  n) return n.intValue();
        return null;
    }

    private String toJson(Object obj) {
        try { return obj != null ? mapper.writeValueAsString(obj) : null; }
        catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return mapper.readValue(json, List.class); }
        catch (Exception e) { return List.of(); }
    }
}
