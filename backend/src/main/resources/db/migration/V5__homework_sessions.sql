-- Homework Helper sessions — stores every question ARIA answers for a student

CREATE TABLE IF NOT EXISTS HOMEWORK_SESSION (
    id               BIGSERIAL PRIMARY KEY,
    session_code     VARCHAR(50)  UNIQUE NOT NULL,
    student_id       BIGINT REFERENCES STUDENT(id) ON DELETE SET NULL,
    subject          VARCHAR(100),
    topic_detected   VARCHAR(200),
    board            VARCHAR(20),
    grade            INTEGER,
    language         VARCHAR(20)  DEFAULT 'en',
    student_level    VARCHAR(20)  DEFAULT 'AVERAGE',
    original_question TEXT,
    document_name    VARCHAR(500),
    document_type    VARCHAR(20),
    has_document     BOOLEAN      DEFAULT FALSE,
    board_reference  VARCHAR(200),
    concept_explanation TEXT,
    complete_solution   TEXT,
    key_points       TEXT,        -- JSON array stored as text
    exam_tip         TEXT,
    practice_problem TEXT,
    verification     TEXT,
    answer_confidence DECIMAL(4,2) DEFAULT 0.90,
    total_followups  INTEGER      DEFAULT 0,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_activity    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS HOMEWORK_FOLLOWUP (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES HOMEWORK_SESSION(id) ON DELETE CASCADE,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hw_student  ON HOMEWORK_SESSION(student_id);
CREATE INDEX IF NOT EXISTS idx_hw_subject  ON HOMEWORK_SESSION(subject);
CREATE INDEX IF NOT EXISTS idx_hw_date     ON HOMEWORK_SESSION(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hw_followup ON HOMEWORK_FOLLOWUP(session_id);
