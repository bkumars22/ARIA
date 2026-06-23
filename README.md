# ARIA — Adaptive Real-time Intelligence for Anyone

> **Free AI-powered tutor for every child on Earth.**  
> Real teaching · Multi-language · Voice-enabled · No cost ever.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-667eea?style=for-the-badge&logo=github)](https://bkumars22.github.io/ARIA/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](https://github.com/bkumars22/ARIA/blob/main/LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Claude AI](https://img.shields.io/badge/AI-Claude%20Sonnet-ff6b35?style=for-the-badge)](https://anthropic.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io)

---

## Live Demo — Open Now

**https://bkumars22.github.io/ARIA/**

No installation. No sign-up. Just open and use.

| Role | Username | Password |
|------|----------|----------|
| Teacher | `teacher` | `Teacher@2026` |
| Admin | `admin` | `Admin@2026` |
| Parent 1 | `parent1` | `Parent@2026` |
| Parent 2 | `parent2` | `Parent@2026` |

---

## What Is ARIA?

ARIA is a free AI-powered tutor that teaches children using real explanations, step-by-step working, and voice interaction — in 35 languages including all major Indian languages.

| Feature | Description |
|---------|-------------|
| Smart Teaching | Explains concepts, gives examples, checks answers, corrects mistakes with full working |
| Voice Input | Student speaks their answer — mic converts to text |
| Voice Output | ARIA speaks back in the student's language (TTS) |
| 35 Languages | Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi + 26 more |
| Progress Tracking | Mastery levels per student per topic |
| Parent Reports | AI-written weekly reports for parents |
| Secure | JWT auth · Rate limiting · Session timeout · Role-based access |
| Free Forever | MIT open source, no cost |

---

## Who Can Use ARIA

| Role | Access |
|------|--------|
| Student | Chat with AI tutor, speak answers, learn Maths/Science/English/Coding/Life Skills |
| Teacher | Add/edit/remove students, view sessions, generate parent reports |
| Parent | View child's progress and reports |
| Admin | Manage all users and roles |

---

## Subjects and Lessons

| Subject | Topics Covered |
|---------|---------------|
| Mathematics | Addition, Multiplication, Division, Fractions, Algebra, Percentages |
| Science | Photosynthesis, States of Matter, Solar System, Water Cycle, Force and Motion |
| English | Nouns, Verbs, Adjectives, Reading Comprehension, Writing |
| Coding | What is Programming, If/Else, Loops, Functions, Python basics |
| Life Skills | Problem Solving, Empathy, Teamwork, Critical Thinking |

---

## Languages Supported (35)

**Indian Languages:**
Hindi · Tamil · Telugu · Kannada · Malayalam · Marathi · Gujarati · Bengali · Punjabi · Odia · Assamese · Urdu · Kashmiri · Sindhi · Nepali · Sanskrit

**World Languages:**
English · Spanish · French · Arabic · Portuguese · Russian · Chinese · German · Japanese · Korean · Indonesian · Malay · Turkish · Swahili · Vietnamese · Thai · Italian · Dutch

---

## Security

- JWT tokens (24-hour expiry)
- Login locked for 5 min after 5 failed attempts
- Auto-logout after 30 min inactivity
- Role-based page access (Admin/Teacher/Parent see different data)
- XSS input sanitisation
- BCrypt password hashing
- HTTPS in production

---

## Architecture

```
+-----------------------------------------------------+
|                    ARIA Platform                     |
+----------------+------------------+-----------------+
|   Frontend     |    Backend       |   AI Service    |
|  React 18      |  Spring Boot 3   |  FastAPI        |
|  Vite 5        |  Java 17         |  Python 3.11    |
|  Port 3001     |  Port 8089       |  Port 8001      |
+----------------+------------------+-----------------+
|              PostgreSQL 16 Database                  |
|  Users · Students · Sessions · Messages · Progress  |
+-----------------------------------------------------+
```

---

## Database Tables

| Table | Stores |
|-------|--------|
| `ARIA_USER` | Teachers, parents, admins |
| `STUDENT` | Student profiles |
| `LEARNING_SESSION` | Every tutoring session |
| `SESSION_MESSAGE` | Every chat message |
| `STUDENT_PROGRESS` | Mastery per student per topic |
| `CURRICULUM_MODULE` | 25 learning modules |
| `ASSESSMENT` | AI feedback per question |

---

## Run Locally

### Option 1 — Demo (no setup, works now)
```bash
git clone https://github.com/bkumars22/ARIA.git
cd ARIA/frontend
npm install
npm run dev
# Open http://localhost:3001
```

### Option 2 — Full Stack with Real AI (Docker)
```bash
git clone https://github.com/bkumars22/ARIA.git
cd ARIA
cp .env.example .env
# Edit .env — add your GROQ_API_KEY
docker-compose up
# Open http://localhost:3001
```

---

## Repository Structure

```
ARIA/
+-- .github/workflows/deploy.yml   <- Auto-deploy to GitHub Pages
+-- frontend/                       <- React 18 + Vite 5
|   +-- src/pages/                  <- Login, Dashboard, Students, Tutor, Reports, Users
|   +-- src/components/Sidebar.jsx  <- Role-aware navigation
|   +-- src/services/api.js         <- Real API + demo mode
+-- backend/                        <- Spring Boot 3 / Java 17
|   +-- src/main/resources/db/      <- Flyway SQL migrations (V1 schema + V2 seed)
+-- ai-service/                     <- FastAPI + LangGraph + Groq Llama
+-- tests/                          <- Playwright E2E tests
+-- docker-compose.yml              <- 5-service production stack
+-- USAGE.md                        <- Full usage guide for all roles
+-- .env.example                    <- Config template
```

---

## Production Deployment

**GitHub Pages (demo — free, auto-deploys):**
Every push to `main` triggers GitHub Actions — builds — publishes to GitHub Pages.

**Full production (unlimited students, real AI):**
```bash
# On any Linux server / cloud VM
git clone https://github.com/bkumars22/ARIA.git
cd ARIA && cp .env.example .env
# Add: GROQ_API_KEY=gsk_...
docker-compose up -d
```

---

## Contributing

Social service project — contributions welcome!

1. Fork — feature branch — PR
2. Priority: more languages, more subjects, mobile improvements, accessibility

---

## Built By

**Kumar Swamy** ([@bkumars22](https://github.com/bkumars22))

*"Quality AI education for every child on Earth — free, forever."*

---

MIT License — free to use, modify, and distribute.

---

## Diagrams

### 1. System Architecture

How the three services connect — browser calls both the Spring Boot backend (for data) and the FastAPI AI service (for real AI answers) directly.

```mermaid
graph TD
    Browser["Browser - GitHub Pages"]

    subgraph Frontend ["Frontend — React 18 + Vite"]
        Login["Login"]
        Dashboard["Dashboard"]
        Tutor["AI Tutor"]
        Homework["Homework Helper"]
        Documents["Document Teacher"]
        Reports["Reports"]
        Students["Students"]
    end

    subgraph Backend ["Backend — Spring Boot 3 · Java 17"]
        AuthAPI["Auth API /api/auth/**"]
        StudentAPI["Students API /api/students/**"]
        SessionAPI["Sessions API /api/sessions/**"]
        ProgressAPI["Progress API /api/progress/**"]
        JWTFilter["JWT Filter (every request)"]
    end

    subgraph AIService ["AI Service — FastAPI · Python 3.11"]
        TeachNode["/teach - LangGraph Agent"]
        DocNode["/document/explain /document/followup"]
        HWNode["/homework/solve /homework/detect"]
        ReportNode["/report - Parent Reports"]
        GroqAPI["Groq API - Llama-3.3-70b"]
    end

    subgraph DB ["Database — PostgreSQL"]
        DBUser[("ARIA_USER")]
        DBStudent[("STUDENT")]
        DBSession[("LEARNING_SESSION SESSION_MESSAGE")]
        DBProgress[("STUDENT_PROGRESS CURRICULUM_MODULE")]
        DBHomework[("HOMEWORK_SESSION HOMEWORK_FOLLOWUP")]
    end

    Browser --> Login
    Login --> Dashboard
    Dashboard --- Tutor
    Dashboard --- Homework
    Dashboard --- Documents
    Dashboard --- Reports
    Dashboard --- Students

    Tutor --> TeachNode
    Homework --> HWNode
    Documents --> DocNode
    Reports --> ReportNode
    Students --> StudentAPI
    Tutor --> SessionAPI

    JWTFilter --> AuthAPI
    JWTFilter --> StudentAPI
    JWTFilter --> SessionAPI
    JWTFilter --> ProgressAPI

    AuthAPI --> DBUser
    StudentAPI --> DBStudent
    SessionAPI --> DBSession
    ProgressAPI --> DBProgress
    HWNode --> DBHomework

    TeachNode --> GroqAPI
    DocNode --> GroqAPI
    HWNode --> GroqAPI
    ReportNode --> GroqAPI
```

---

### 2. AI Teaching Session — Step by Step

What happens from the moment a student types a question to the moment ARIA speaks back.

```mermaid
sequenceDiagram
    participant S  as Student
    participant FE as React Frontend
    participant BE as Spring Boot
    participant AI as FastAPI AI Service
    participant G  as Groq LLM

    S->>FE: Types or speaks a question
    FE->>BE: POST /api/sessions/{id}/teach (JWT)
    BE->>BE: Validate JWT token
    BE->>AI: Forward to /teach

    rect rgb(235, 245, 255)
        note over AI: LangGraph — 6 nodes
        AI->>AI: assess_level (detect grade)
        AI->>AI: select_curriculum (pick module)
        AI->>G:  Socratic teaching prompt
        G-->>AI: Llama 3.3 response
        AI->>AI: evaluate_response (score 0-100)
        AI->>AI: adapt_or_advance (EASY/MEDIUM/HARD)
        AI->>BE: log_progress (understanding score)
    end

    AI-->>FE: response + score + difficulty
    FE-->>S: Display answer
    FE-->>S: Speak answer (TTS — 35 languages)
```

---

### 3. Homework Helper — How It Works

```mermaid
flowchart TD
    A([Student opens Homework Helper]) --> B{How to submit?}

    B -->|Upload image| C["Camera or file upload - Auto-detect subject via /homework/detect"]
    B -->|Upload PDF| D["PDF upload - PyMuPDF extracts text - Auto-detect subject"]
    B -->|Type question| E["Type question - Select subject manually"]

    C --> F[Set grade · board · level · language]
    D --> F
    E --> F

    F --> G[Click Solve]

    G --> H{Document type?}
    H -->|Image| I["Groq Vision - Llama-3.2-90b-vision-preview - temperature 0.1"]
    H -->|PDF text| J["Groq Text - Llama-3.3-70b-versatile - temperature 0.1"]
    H -->|Text only| J

    I --> K[Parse structured JSON answer]
    J --> K

    K --> L["Display answer cards: Concept / Solution / Verification / Key Points / Exam Tip / Practice"]

    L --> M{What next?}
    M -->|Ask follow-up| G
    M -->|Listen| N["Text-to-Speech — Green to Listen, Red pulsing to Stop"]
    M -->|Finish| O([Session saved to Homework History])
```

---

### 4. Role-Based Access Map

```mermaid
graph LR
    subgraph Users
        Admin["Admin"]
        Teacher["Teacher"]
        Parent["Parent"]
    end

    subgraph Pages
        UserMgmt["User Management"]
        StudentMgmt["Student Management"]
        TutorPage["AI Tutor Chat"]
        HWPage["Homework Helper"]
        DocPage["Document Teacher"]
        ReportsPage["Parent Reports"]
        ProgressPage["Progress View"]
        HistoryPage["Document History"]
    end

    Admin --> UserMgmt
    Admin --> StudentMgmt
    Admin --> ReportsPage
    Admin --> ProgressPage

    Teacher --> StudentMgmt
    Teacher --> TutorPage
    Teacher --> HWPage
    Teacher --> DocPage
    Teacher --> ReportsPage
    Teacher --> HistoryPage

    Parent --> ProgressPage
    Parent --> ReportsPage
```

---

### 5. Security Layers

```mermaid
flowchart TD
    Req["Incoming HTTP Request"]

    Req --> L1

    subgraph L1 ["Layer 1 — JWT Validation"]
        JWT{"Bearer token valid and not expired?"}
        JWT -->|No| R1["401 Unauthorized - JSON error, no stack trace"]
        JWT -->|Yes| L2
    end

    subgraph L2 ["Layer 2 — CORS"]
        CORS{"Origin allowed? github.io · onrender.com · localhost"}
        CORS -->|Blocked| R2["403 CORS Rejected"]
        CORS -->|Allowed| L3
    end

    subgraph L3 ["Layer 3 — Rate Limiting"]
        Rate{"Under limit? 15 req/min document - 20 req/min homework"}
        Rate -->|Over| R3["429 Too Many Requests"]
        Rate -->|Under| L4
    end

    subgraph L4 ["Layer 4 — Password Security"]
        BCrypt["BCrypt cost-12 hashing - Auto-logout 30 min idle - 5 failed attempts locks for 5 min"]
    end

    L4 --> Resp["Secure Response with Security Headers (X-Frame-Options DENY, X-Content-Type-Options)"]
```

---

ARIA — Because every child deserves a great teacher

[Open Live Demo](https://bkumars22.github.io/ARIA/)
