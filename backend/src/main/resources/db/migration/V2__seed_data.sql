-- V2__seed_data.sql
-- Demo roles, users, students, curriculum modules

-- Roles
INSERT INTO ARIA_ROLE (role_name) VALUES ('ADMIN'), ('TEACHER'), ('PARENT'), ('STUDENT');

-- Demo users (passwords are BCrypt of visible value)
INSERT INTO ARIA_USER (username, email, password_hash, full_name, role_id, language) VALUES
('admin',   'admin@aria.ai',   '$2a$10$demoHashAdminARIA2026xx', 'ARIA Admin',      1, 'en'),
('teacher', 'teacher@aria.ai', '$2a$10$demoHashTeachARIA2026xx', 'Priya Sharma',    2, 'en'),
('parent1', 'parent1@aria.ai', '$2a$10$demoHashParntARIA2026xx', 'Ravi Kumar',      3, 'hi'),
('parent2', 'parent2@aria.ai', '$2a$10$demoHashPar2ARIA2026xx',  'Sarah Johnson',   3, 'en');

-- Demo students
INSERT INTO STUDENT (student_code, full_name, age, grade, language, parent_id, teacher_id) VALUES
('STU-001', 'Ananya Kumar',   9,  3, 'hi', 3, 2),
('STU-002', 'Rahul Sharma',  12,  6, 'en', 3, 2),
('STU-003', 'Emma Johnson',  15,  9, 'en', 4, 2),
('STU-004', 'Fatima Hassan',  7,  2, 'en', 4, 2);

-- Curriculum — Mathematics Grade 1-3
INSERT INTO CURRICULUM_MODULE (subject, topic, grade_level, difficulty, description, learning_goals) VALUES
('Mathematics', 'Counting to 100',          1, 'EASY',   'Learn to count forward and backward to 100', 'Count to 100|Skip count by 2s, 5s, 10s'),
('Mathematics', 'Addition within 20',       1, 'EASY',   'Add single digit numbers', 'Add numbers up to 20|Understand plus symbol'),
('Mathematics', 'Subtraction within 20',    1, 'EASY',   'Subtract single digit numbers', 'Subtract numbers up to 20|Understand minus symbol'),
('Mathematics', 'Place Value Tens & Ones',  2, 'MEDIUM', 'Understand tens and ones place', 'Identify tens and ones|Compare 2-digit numbers'),
('Mathematics', 'Multiplication Basics',    3, 'MEDIUM', 'Introduction to multiplication', 'Understand multiplication as repeated addition|Times tables 1-5'),
('Mathematics', 'Fractions Introduction',   3, 'MEDIUM', 'Introduction to fractions', 'Identify half, quarter, third|Compare simple fractions'),

-- Mathematics Grade 4-6
('Mathematics', 'Long Division',            4, 'MEDIUM', 'Divide 3-digit by 1-digit numbers', 'Long division steps|Check with multiplication'),
('Mathematics', 'Decimals',                 5, 'MEDIUM', 'Understand and operate decimals', 'Read/write decimals|Add and subtract decimals'),
('Mathematics', 'Percentages',              6, 'HARD',   'Convert fractions to percentages', 'Fraction to percent|Percent of a number'),
('Mathematics', 'Introduction to Algebra',  6, 'HARD',   'Solve simple equations', 'Variable concepts|Solve one-step equations'),

-- Science Grade 2-6
('Science', 'Living vs Non-living Things',  2, 'EASY',   'Distinguish living from non-living', 'Characteristics of living things|Examples of each'),
('Science', 'The Water Cycle',              4, 'MEDIUM', 'Evaporation, condensation, precipitation', 'Label water cycle stages|Explain each process'),
('Science', 'Photosynthesis',               6, 'MEDIUM', 'How plants make food', 'Chlorophyll role|Photosynthesis equation'),
('Science', 'Force and Motion',             5, 'MEDIUM', 'Newtons laws of motion basics', 'Push and pull|Speed and direction'),

-- English Grade 1-6
('English', 'Alphabet and Phonics',         1, 'EASY',   'Letter sounds and blending', 'Recognise all 26 letters|Simple phonics blending'),
('English', 'Sight Words',                  2, 'EASY',   'Common high-frequency words', 'Read 100 sight words|Use in sentences'),
('English', 'Reading Comprehension',        4, 'MEDIUM', 'Understand and analyse text', 'Identify main idea|Answer who/what/where/when/why'),
('English', 'Essay Writing Basics',         6, 'HARD',   'Structure a simple essay', 'Introduction body conclusion|Topic sentences'),

-- Coding
('Coding', 'What is a Computer?',           3, 'EASY',   'Basics of how computers work', 'Input output storage|Basic computer parts'),
('Coding', 'Sequences and Algorithms',      4, 'EASY',   'Step-by-step instructions', 'Write a simple algorithm|Sequence of steps'),
('Coding', 'Loops and Conditions',          5, 'MEDIUM', 'Repetition and decisions in code', 'If-else concepts|Repeat loops'),

-- Life Skills
('Life Skills', 'Saving Money Basics',       4, 'EASY',   'Why and how to save money', 'Needs vs wants|Simple savings goal'),
('Life Skills', 'Healthy Eating',            3, 'EASY',   'Nutrition and food groups', 'Food groups|Balanced meal'),
('Life Skills', 'Critical Thinking',         6, 'MEDIUM', 'Analyse information and make decisions', 'Identify facts vs opinions|Simple problem solving');
