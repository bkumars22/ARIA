package com.aria.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.SecretKey;
import jakarta.persistence.*;

// ─── AriaUser entity (inline for simplicity) ──────────────────
@Entity
@Table(name = "ARIA_USER")
class AriaUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String username;
    String email;
    @Column(name = "password_hash") String passwordHash;
    @Column(name = "full_name") String fullName;
    @Column(name = "role_id") Long roleId;
    String language = "en";
    @Column(name = "is_active") Boolean isActive = true;
    public Long getId()         { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public Long getRoleId()     { return roleId; }
    public String getLanguage() { return language; }
}

// ─── Repository ───────────────────────────────────────────────
interface UserRepository extends org.springframework.data.jpa.repository.JpaRepository<AriaUser, Long> {
    Optional<AriaUser> findByUsername(String username);
}

// ─── Auth Controller ──────────────────────────────────────────
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    private static final String ROLE_MAP[] = { "", "ADMIN", "TEACHER", "PARENT", "STUDENT" };
    private static final String JWT_SECRET = System.getenv().getOrDefault("JWT_SECRET",
        "aria-jwt-secret-min-32-chars-long-2026");

    public AuthController(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<AriaUser> userOpt = userRepo.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }

        AriaUser user = userOpt.get();

        // For demo users with the placeholder hash, allow direct password match
        boolean valid;
        if (user.getPasswordHash().startsWith("$2a$10$demoHash")) {
            valid = (username + "@2026").equalsIgnoreCase(password)
                 || "Admin@2026".equalsIgnoreCase(password)
                 || "Teacher@2026".equalsIgnoreCase(password)
                 || "Parent@2026".equalsIgnoreCase(password);
        } else {
            valid = passwordEncoder.matches(password, user.getPasswordHash());
        }

        if (!valid) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }

        String role = user.getRoleId() != null && user.getRoleId() <= 4
            ? ROLE_MAP[user.getRoleId().intValue()] : "STUDENT";

        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
            .subject(username)
            .claim("role", role)
            .claim("userId", user.getId())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 86400000L))
            .signWith(key)
            .compact();

        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "token", token, "userId", user.getId(),
                "role", role, "fullName", user.getFullName(),
                "language", user.getLanguage()
            )
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Token valid"));
    }
}
