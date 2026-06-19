# 🧠 ARIA — Adaptive Real-time Intelligence for Anyone

> **Free AI-powered tutor for every child on Earth.**  
> Real teaching · Multi-language · Voice-enabled · No cost ever.

[![Live Demo](https://img.shields.io/badge/▶%20Live%20Demo-Click%20Here-667eea?style=for-the-badge&logo=github)](https://bkumars22.github.io/ARIA/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](https://github.com/bkumars22/ARIA/blob/main/LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Claude AI](https://img.shields.io/badge/AI-Claude%20Sonnet-ff6b35?style=for-the-badge)](https://anthropic.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io)

---

## 🌐 Live Demo — Open Now

### 👉 [https://bkumars22.github.io/ARIA/](https://bkumars22.github.io/ARIA/)

No installation. No sign-up. Just open and use.

| Role | Username | Password |
|------|----------|----------|
| 👨‍🏫 Teacher | `teacher` | `Teacher@2026` |
| 🛡️ Admin | `admin` | `Admin@2026` |
| 👪 Parent 1 | `parent1` | `Parent@2026` |
| 👪 Parent 2 | `parent2` | `Parent@2026` |

---

## ✨ What Is ARIA?

ARIA is a free AI-powered tutor that teaches children using real explanations, step-by-step working, and voice interaction — in 35 languages including all major Indian languages.

| Feature | Description |
|---------|-------------|
| 🤖 **Smart Teaching** | Explains concepts, gives examples, checks answers, corrects mistakes with full working |
| 🎤 **Voice Input** | Student speaks their answer — mic converts to text |
| 🔊 **Voice Output** | ARIA speaks back in the student's language (TTS) |
| 🌍 **35 Languages** | Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi + 26 more |
| 📊 **Progress Tracking** | Mastery levels per student per topic |
| 📝 **Parent Reports** | AI-written weekly reports for parents |
| 🔐 **Secure** | JWT auth · Rate limiting · Session timeout · Role-based access |
| 🆓 **Free Forever** | MIT open source, no cost |

---

## 👥 Who Can Use ARIA

| Role | Access |
|------|--------|
| 🎓 **Student** | Chat with AI tutor, speak answers, learn Maths/Science/English/Coding/Life Skills |
| 👨‍🏫 **Teacher** | Add/edit/remove students, view sessions, generate parent reports |
| 👪 **Parent** | View child's progress and reports |
| 🛡️ **Admin** | Manage all users and roles |

---

## 📚 Subjects & Lessons

| Subject | Topics Covered |
|---------|---------------|
| 🔢 **Mathematics** | Addition, Multiplication, Division, Fractions, Algebra, Percentages |
| 🔬 **Science** | Photosynthesis, States of Matter, Solar System, Water Cycle, Force & Motion |
| 📖 **English** | Nouns, Verbs, Adjectives, Reading Comprehension, Writing |
| 💻 **Coding** | What is Programming, If/Else, Loops, Functions, Python basics |
| 🌱 **Life Skills** | Problem Solving, Empathy, Teamwork, Critical Thinking |

---

## 🌍 Languages Supported (35)

**Indian Languages:**
Hindi · Tamil · Telugu · Kannada · Malayalam · Marathi · Gujarati · Bengali · Punjabi · Odia · Assamese · Urdu · Kashmiri · Sindhi · Nepali · Sanskrit

**World Languages:**
English · Spanish · French · Arabic · Portuguese · Russian · Chinese · German · Japanese · Korean · Indonesian · Malay · Turkish · Swahili · Vietnamese · Thai · Italian · Dutch

---

## 🔐 Security

- ✅ JWT tokens (24-hour expiry)
- ✅ Login locked for 5 min after 5 failed attempts
- ✅ Auto-logout after 30 min inactivity
- ✅ Role-based page access (Admin/Teacher/Parent see different data)
- ✅ XSS input sanitisation
- ✅ BCrypt password hashing
- ✅ HTTPS in production

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ARIA Platform                     │
├────────────────┬──────────────────┬─────────────────┤
│   Frontend     │    Backend       │   AI Service    │
│  React 18      │  Spring Boot 3   │  FastAPI        │
│  Vite 5        │  Java 17         │  Python 3.11    │
│  Port 3001     │  Port 8089       │  Port 8001      │
├────────────────┴──────────────────┴─────────────────┤
│              PostgreSQL 16 Database                  │
│  Users · Students · Sessions · Messages · Progress  │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Tables

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

## 🚀 Run Locally

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
# Edit .env — add your ANTHROPIC_API_KEY
docker-compose up
# Open http://localhost:3001
```

---

## 📦 Repository Structure

```
ARIA/
├── .github/workflows/deploy.yml   ← Auto-deploy to GitHub Pages
├── frontend/                       ← React 18 + Vite 5
│   ├── src/pages/                  ← Login, Dashboard, Students, Tutor, Reports, Users
│   ├── src/components/Sidebar.jsx  ← Role-aware navigation
│   └── src/services/api.js         ← Real API + demo mode
├── backend/                        ← Spring Boot 3 / Java 17
│   └── src/main/resources/db/      ← Flyway SQL migrations (V1 schema + V2 seed)
├── ai-service/                     ← FastAPI + LangGraph + Claude Sonnet
├── tests/                          ← Playwright E2E tests
├── docker-compose.yml              ← 5-service production stack
├── USAGE.md                        ← Full usage guide for all roles
└── .env.example                    ← Config template
```

---

## 🌐 Production Deployment

**GitHub Pages (demo — free, auto-deploys):**
Every push to `main` triggers GitHub Actions → builds → publishes to GitHub Pages.

**Full production (unlimited students, real AI):**
```bash
# On any Linux server / cloud VM
git clone https://github.com/bkumars22/ARIA.git
cd ARIA && cp .env.example .env
# Add: ANTHROPIC_API_KEY=sk-ant-...
docker-compose up -d
```

---

## 🤝 Contributing

Social service project — contributions welcome!

1. Fork → feature branch → PR
2. Priority: more languages, more subjects, mobile improvements, accessibility

---

## 👨‍💻 Built By

**Kumar Swamy** ([@bkumars22](https://github.com/bkumars22))

*"Quality AI education for every child on Earth — free, forever."*

---

**📄 MIT License** — free to use, modify, and distribute.

---

<div align="center">
<h3>🧠 ARIA — Because every child deserves a great teacher</h3>
<a href="https://bkumars22.github.io/ARIA/"><strong>▶ Open Live Demo</strong></a>
</div>
