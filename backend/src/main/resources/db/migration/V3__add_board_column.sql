-- V3__add_board_column.sql
-- Add board (CBSE | ICSE | IGCSE) to STUDENT table

ALTER TABLE STUDENT
  ADD COLUMN IF NOT EXISTS board VARCHAR(20) NOT NULL DEFAULT 'CBSE';

-- Update existing demo students
UPDATE STUDENT SET board = 'IGCSE' WHERE student_code = 'STU-003';
