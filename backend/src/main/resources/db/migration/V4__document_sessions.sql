-- V4__document_sessions.sql
-- Document Teacher: stores every document explanation session

CREATE TABLE IF NOT EXISTS DOCUMENT_SESSION (
    id                  BIGSERIAL PRIMARY KEY,
    session_code        VARCHAR(50)  UNIQUE NOT NULL,
    student_id          BIGINT       REFERENCES STUDENT(id),
    document_name       VARCHAR(500),
    document_type       VARCHAR(20),
    subject_detected    VARCHAR(100),
    topic_detected      VARCHAR(200),
    grade_detected      INTEGER,
    explanation_level   VARCHAR(20),
    language            VARCHAR(20),
    board               VARCHAR(20),
    explanation         TEXT,
    practice_questions  TEXT,       -- JSON array stored as text
    key_points          TEXT,       -- JSON array stored as text
    specific_question   TEXT,
    difficulty_rating   INTEGER,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_docsess_student ON DOCUMENT_SESSION(student_id);
CREATE INDEX IF NOT EXISTS idx_docsess_created  ON DOCUMENT_SESSION(created_at DESC);
