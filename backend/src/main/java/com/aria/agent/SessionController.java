package com.aria.agent;

import jakarta.persistence.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.*;

// ─── LearningSession Entity ───────────────────────────────────
@Entity
@Table(name = "LEARNING_SESSION")
class LearningSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_code", nullable = false, unique = true)
    private String sessionCode;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "module_id")
    private Long moduleId;

    private String subject;
    private String status = "ACTIVE"; // ACTIVE | COMPLETED | PAUSED

    @Column(name = "started_at")
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "total_messages")
    private Integer totalMessages = 0;

    @Column(name = "understanding_score")
    private Double understandingScore = 50.0;

    // Getters / Setters
    public Long getId()                             { return id; }
    public String getSessionCode()                  { return sessionCode; }
    public void setSessionCode(String v)            { this.sessionCode = v; }
    public Long getStudentId()                      { return studentId; }
    public void setStudentId(Long v)                { this.studentId = v; }
    public String getSubject()                      { return subject; }
    public void setSubject(String v)                { this.subject = v; }
    public String getStatus()                       { return status; }
    public void setStatus(String v)                 { this.status = v; }
    public LocalDateTime getStartedAt()             { return startedAt; }
    public LocalDateTime getEndedAt()               { return endedAt; }
    public void setEndedAt(LocalDateTime v)         { this.endedAt = v; }
    public Integer getTotalMessages()               { return totalMessages; }
    public void setTotalMessages(Integer v)         { this.totalMessages = v; }
    public Double getUnderstandingScore()           { return understandingScore; }
    public void setUnderstandingScore(Double v)     { this.understandingScore = v; }
}

// ─── SessionMessage Entity ────────────────────────────────────
@Entity
@Table(name = "SESSION_MESSAGE")
class SessionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private String role;    // student | aria

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "input_type")
    private String inputType = "TEXT"; // TEXT | VOICE

    private String language = "en";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters / Setters
    public Long getId()                 { return id; }
    public Long getSessionId()          { return sessionId; }
    public void setSessionId(Long v)    { this.sessionId = v; }
    public String getRole()             { return role; }
    public void setRole(String v)       { this.role = v; }
    public String getContent()          { return content; }
    public void setContent(String v)    { this.content = v; }
    public String getInputType()        { return inputType; }
    public void setInputType(String v)  { this.inputType = v; }
    public String getLanguage()         { return language; }
    public void setLanguage(String v)   { this.language = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

// ─── SessionController ────────────────────────────────────────
@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
class SessionController {

    private final SessionRepository sessionRepo;
    private final MessageRepository messageRepo;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    SessionController(SessionRepository sr, MessageRepository mr) {
        this.sessionRepo = sr;
        this.messageRepo = mr;
        this.restTemplate = new RestTemplate();
    }

    /** Start a new learning session */
    @PostMapping
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> body) {
        LearningSession session = new LearningSession();
        session.setSessionCode("SES-" + System.currentTimeMillis());
        session.setStudentId(Long.parseLong(body.get("studentId").toString()));
        session.setSubject((String) body.getOrDefault("subject", "Mathematics"));
        LearningSession saved = sessionRepo.save(session);
        return ResponseEntity.ok(Map.of("success", true, "data", saved));
    }

    /** Send a student message — proxies to AI service */
    @PostMapping("/{sessionId}/chat")
    public ResponseEntity<?> chat(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> body) {

        LearningSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        // Build AI service request
        Map<String, Object> aiRequest = new HashMap<>(body);
        aiRequest.put("session_id", sessionId.toString());
        aiRequest.put("understanding_score", session.getUnderstandingScore());

        // Call Python AI service
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(aiRequest, headers);

        ResponseEntity<Map> aiResponse = restTemplate.postForEntity(
            aiServiceUrl + "/teach", entity, Map.class
        );

        // Update session score
        Map<String, Object> aiData = (Map<String, Object>) aiResponse.getBody().get("data");
        if (aiData != null && aiData.get("understanding_score") != null) {
            session.setUnderstandingScore(((Number) aiData.get("understanding_score")).doubleValue());
            session.setTotalMessages(session.getTotalMessages() + 1);
            sessionRepo.save(session);
        }

        return ResponseEntity.ok(aiResponse.getBody());
    }

    /** Log a message from AI service callback */
    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<?> logMessage(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> body) {

        // Student message
        SessionMessage studentMsg = new SessionMessage();
        studentMsg.setSessionId(sessionId);
        studentMsg.setRole("student");
        studentMsg.setContent((String) body.getOrDefault("studentMessage", ""));
        messageRepo.save(studentMsg);

        // ARIA response
        SessionMessage ariaMsg = new SessionMessage();
        ariaMsg.setSessionId(sessionId);
        ariaMsg.setRole("aria");
        ariaMsg.setContent((String) body.getOrDefault("ariaResponse", ""));
        messageRepo.save(ariaMsg);

        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Get session history */
    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long sessionId) {
        List<SessionMessage> messages = messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return ResponseEntity.ok(Map.of("success", true, "data", messages));
    }

    /** End a session */
    @PutMapping("/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable Long sessionId) {
        LearningSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus("COMPLETED");
        session.setEndedAt(LocalDateTime.now());
        sessionRepo.save(session);
        return ResponseEntity.ok(Map.of("success", true, "message", "Session completed"));
    }
}
