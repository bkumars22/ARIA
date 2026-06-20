package com.aria.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class JwtFilter extends OncePerRequestFilter {

    // Loaded once at startup — immutable after JVM launch
    private static final String JWT_SECRET = System.getenv().getOrDefault(
        "JWT_SECRET", "aria-jwt-secret-min-32-chars-long-2026"
    );

    // Endpoints that do NOT require a token
    private static final Set<String> PUBLIC_PREFIXES = Set.of(
        "/api/auth/",
        "/health",
        "/actuator/",
        "/api-docs",
        "/swagger-ui",
        "/v3/api-docs"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = req.getServletPath();

        // Allow CORS preflight without a token
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        // Allow public paths
        for (String pub : PUBLIC_PREFIXES) {
            if (path.startsWith(pub)) {
                chain.doFilter(req, res);
                return;
            }
        }

        // ── Validate Bearer token ───────────────────────────
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            deny(res, 401, "No token provided. Please log in.");
            return;
        }

        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            deny(res, 401, "Empty token.");
            return;
        }

        try {
            var key    = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            // Attach claims to request for use in controllers
            req.setAttribute("jwt_username", claims.getSubject());
            req.setAttribute("jwt_role",     claims.get("role",   String.class));
            req.setAttribute("jwt_userId",   claims.get("userId", Long.class));

            chain.doFilter(req, res);

        } catch (ExpiredJwtException e) {
            deny(res, 401, "Session expired. Please log in again.");
        } catch (Exception e) {
            deny(res, 401, "Invalid token. Please log in again.");
        }
    }

    private void deny(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        // Security headers on every rejection
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.getWriter().write(
            "{\"success\":false,\"message\":\"" + message.replace("\"", "'") + "\"}"
        );
    }
}
