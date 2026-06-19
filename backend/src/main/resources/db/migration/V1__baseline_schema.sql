-- V1__baseline_schema.sql
-- ARIA — Adaptive Real-time Intelligence for Anyone
-- Baseline schema: roles, users, students, curriculum, sessions

-- ─── Roles ───────────────────────────────────────────────────
CREATE TABLE ARIA_ROLE (
    id          BIGSERIAL PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE  -- ADMIN, TEACHER, PARENT, STUDENT
);

-- ─── Users (Teachers, Parents, Admins) ───────────────────────
CREATE TABLE ARIA_USER (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200),
    role_id         BIGINT REFERENCES ARIA_ROLE(id),
    language        VARCHAR(20)  DEFAULT 'en',  -- en, hi, ta, kn, sw, es, ar
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Students ────────────────────────────────────────────────
CREATE TABLE STUDENT (
    id              BIGSERIAL PRIMARY KEY,
    student_code    VARCHAR(50)  NOT NULL UNIQUE,  -- e.g. STU-001
    full_name       VARCHAR(200) NOT NULL,
    age             INTEGER      CHECK (age BETWEEN 4 AND 18),
    grade           INTEGER      CHECK (grade BETWEEN 1 AND 12),
    language        VARCHAR(20)  DEFAULT 'en',
    parent_id       BIGINT       REFERENCES ARIA_USER(id),
    teacher_id      BIGINT       REFERENCES ARIA_USER(id),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Curriculum Modules ───────────────────────────────────────
CREATE TABLE CURRICULUM_MODULE (
    id              BIGSERIAL PRIMARY KEY,
    subject         VARCHAR(100) NOT NULL,   -- Mathematics, Science, English, Coding, Life Skills
    topic           VARCHAR(200) NOT NULL,   -- e.g. "Fractions", "Photosynthesis"
    grade_level     INTEGER      NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    difficulty      VARCHAR(20)  DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD
    description     TEXT,
    learning_goals  TEXT,        -- Pipe-separated list of goals
    prerequisites   TEXT,        -- Pipe-separated module IDs
    language        VARCHAR(20)  DEFAULT 'en',
    is_active       BOOLEAN      DEFAULT TRUE
);

-- ─── Learning Sessions ────────────────────────────────────────
CREATE TABLE LEARNING_SESSION (
    id              BIGSERIAL PRIMARY KEY,
    session_code    VARCHAR(50)  NOT NULL UNIQUE,
    student_id      BIGINT       NOT NULL REFERENCES STUDENT(id),
    module_id       BIGINT       REFERENCES CURRICULUM_MODULE(id),
    subject         VARCHAR(100),
    status          VARCHAR(20)  DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, PAUSED
    started_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ended_at        TIMESTAMP,
    total_messages  INTEGER      DEFAULT 0,
    understanding_score DECIMAL(5,2) -- 0-100, computed by AI
);

-- ─── Chat Messages ────────────────────────────────────────────
CREATE TABLE SESSION_MESSAGE (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES LEARNING_SESSION(id) ON DELETE CASCADE,
    role            VARCHAR(20)  NOT NULL,  -- student | aria
    content         TEXT         NOT NULL,
    input_type      VARCHAR(20)  DEFAULT 'TEXT', -- TEXT, VOICE
    language        VARCHAR(20)  DEFAULT 'en',
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Student Progress ─────────────────────────────────────────
CREATE TABLE STUDENT_PROGRESS (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT       NOT NULL REFERENCES STUDENT(id),
    module_id       BIGINT       NOT NULL REFERENCES CURRICULUM_MODULE(id),
    mastery_level   VARCHAR(20)  DEFAULT 'NOT_STARTED', -- NOT_STARTED, LEARNING, PRACTISING, MASTERED
    score           DECIMAL(5,2) DEFAULT 0,  -- 0-100
    attempts        INTEGER      DEFAULT 0,
    last_studied_at TIMESTAMP,
    mastered_at     TIMESTAMP,
    UNIQUE(student_id, module_id)
);

-- ─── Assessments ─────────────────────────────────────────────
CREATE TABLE ASSESSMENT (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES LEARNING_SESSION(id),
    student_id      BIGINT       NOT NULL REFERENCES STUDENT(id),
    module_id       BIGINT       REFERENCES CURRICULUM_MODULE(id),
    question        TEXT         NOT NULL,
    student_answer  TEXT,
    correct         BOOLEAN,
    ai_feedback     TEXT,        -- Claude AI personalised feedback
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_session_student  ON LEARNING_SESSION(student_id);
CREATE INDEX idx_session_status   ON LEARNING_SESSION(status);
CREATE INDEX idx_message_session  ON SESSION_MESSAGE(session_id);
CREATE INDEX idx_progress_student ON STUDENT_PROGRESS(student_id);
CREATE INDEX idx_assessment_student ON ASSESSMENT(student_id);
CREATE INDEX idx_curriculum_grade ON CURRICULUM_MODULE(grade_level, subject);
