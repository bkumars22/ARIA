# 🧠 ARIA — Adaptive Real-time Intelligence for Anyone

> **Free AI-powered tutor for every child on Earth.**  
> Socratic teaching · Multi-language · Voice-enabled · No cost ever.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-667eea?style=for-the-badge&logo=github)](https://bkumars22.github.io/ARIA/)
[![Deploy](https://github.com/bkumars22/ARIA/actions/workflows/deploy.yml/badge.svg)](https://github.com/bkumars22/ARIA/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Made with React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Powered by Claude](https://img.shields.io/badge/AI-Claude%20Sonnet-orange?style=for-the-badge)](https://anthropic.com)

---

## 🌍 Live URL

**▶ [https://bkumars22.github.io/ARIA/](https://bkumars22.github.io/ARIA/)**

Anyone in the world can open this link — no installation, no account needed.  
Log in with a demo account and start learning immediately.

---

## 📸 Screenshots

| Login | Dashboard | AI Tutor Chat |
|-------|-----------|---------------|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Tutor](docs/screenshots/tutor.png) |

| Students Management | Reports | User Management |
|--------------------|---------|-----------------|
| ![Students](docs/screenshots/students.png) | ![Reports](docs/screenshots/reports.png) | ![Users](docs/screenshots/users.png) |

---

## ✨ What Makes ARIA Special

| Feature | Description |
|---------|-------------|
| 🤖 **Socratic AI** | Never gives answers directly — guides children to discover them |
| 🎤 **Voice Input** | Children speak their answers using the microphone |
| 🔊 **Voice Output** | ARIA speaks back in the child's language |
| 🌍 **Multi-language** | English, Hindi, Tamil, Kannada, Spanish, Arabic, Swahili |
| 📊 **Real Progress** | Mastery tracking across 25 curriculum modules |
| 📝 **Parent Reports** | AI-written weekly reports sent to parents |
| 🔐 **Secure** | JWT auth, rate limiting, session timeout, role-based access |
| 📱 **Responsive** | Works on mobile, tablet, and desktop |
| 🆓 **Free Forever** | Open source, MIT license, no cost |

---

## 👥 Who Can Use ARIA

| Role | What They Can Do |
|------|-----------------|
| 🎓 **Student** | Chat with AI tutor, speak answers via mic, learn any subject |
| 👨‍🏫 **Teacher** | Manage students, view progress, generate parent reports |
| 👪 **Parent** | View child's progress and receive AI-written weekly reports |
| 🛡️ **Admin** | Manage all users, students, roles, and system settings |

---

## 📚 Subjects Covered

- 🔢 **Mathematics** — Arithmetic, Algebra, Geometry, Fractions
- 🔬 **Science** — Physics, Chemistry, Biology, Environment
- 📖 **English** — Grammar, Reading, Writing, Comprehension
- 💻 **Coding** — Scratch logic, Python basics, computational thinking
- 🌱 **Life Skills** — Critical thinking, empathy, teamwork

---

## 🚀 Quick Start (Demo — No Setup Needed)

1. Open **[https://bkumars22.github.io/ARIA/](https://bkumars22.github.io/ARIA/)**
2. Log in with any demo account:

| Username | Password | Role |
|----------|----------|------|
| `teacher` | `Teacher@2026` | Teacher — manage students + reports |
| `admin` | `Admin@2026` | Admin — full user management |
| `parent1` | `Parent@2026` | Parent — view child progress |
| `parent2` | `Parent@2026` | Parent — view child progress |

3. Navigate to **Students → click Tutor → pick a subject → start chatting!**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  ARIA Platform                   │
├──────────────┬───────────────┬───────────────────┤
│   Frontend   │   Backend     │   AI Service      │
│  React 18    │  Spring Boot  │  FastAPI + Claude │
│  Vite 5      │  Java 17      │  Python 3.11      │
│  Port 3001   │  Port 8089    │  Port 8001        │
├──────────────┴───────────────┴───────────────────┤
│              PostgreSQL 16 Database              │
│    (Users · Students · Sessions · Progress)      │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

- ✅ **JWT Authentication** — Signed tokens, 24-hour expiry
- ✅ **Login Rate Limiting** — Account locked for 5 min after 5 failed attempts
- ✅ **Session Timeout** — Auto-logout after 30 minutes of inactivity
- ✅ **Role-Based Access Control** — ADMIN / TEACHER / PARENT see different data
- ✅ **Input Sanitization** — XSS protection on all inputs
- ✅ **BCrypt Passwords** — Salted hash, never stored as plain text
- ✅ **HTTPS Only** — All production traffic TLS-encrypted
- ✅ **CORS Configured** — Only allowed origins accepted by backend

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ · Java 17+ · Docker Desktop

### Frontend Only (Demo Mode)
```bash
git clone https://github.com/bkumars22/ARIA.git
cd ARIA/frontend
npm install
npm run dev
# Open: http://localhost:3001
```

### Full Stack with Docker (Real AI responses)
```bash
git clone https://github.com/bkumars22/ARIA.git
cd ARIA
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
docker-compose up
# Open: http://localhost:3001
```

---

## 📦 Project Structure

```
ARIA/
├── frontend/               # React 18 + Vite 5
│   ├── src/pages/          # All pages with role guards
│   ├── src/components/     # Sidebar with role-aware nav
│   └── src/services/       # api.js + mockData.js
├── backend/                # Spring Boot 3 / Java 17
│   └── src/main/java/com/aria/
│       ├── auth/           # JWT login + BCrypt
│       ├── student/        # Student CRUD
│       ├── agent/          # Session management
│       └── progress/       # Mastery tracking
├── ai-service/             # FastAPI + LangGraph + Claude Sonnet
├── tests/                  # Playwright E2E (60 tests)
├── docker-compose.yml
└── .github/workflows/      # Auto-deploy to GitHub Pages on push
```

---

## 🧠 AI Teaching Engine

Uses **LangGraph** with **Claude Sonnet** in a 6-node Socratic loop:

```
assess_level → select_curriculum → teach_socratically
     ↑                                      ↓
log_progress ← adapt_or_advance ← evaluate_response
```

**Principle:** ARIA *never* gives the answer. It asks guiding questions until the child discovers the answer themselves.

---

## 🌐 Production Deployment

### GitHub Pages (Frontend Demo — free, instant)
Automatically deployed on every push to `main` via GitHub Actions.  
URL: `https://bkumars22.github.io/ARIA/`

### Full Production (all features, unlimited users)
```bash
# On any Ubuntu 22.04 server or cloud VM
git clone https://github.com/bkumars22/ARIA.git
cd ARIA && cp .env.example .env
# Fill ANTHROPIC_API_KEY, DB credentials in .env
docker-compose up -d
```
Then point your domain's DNS to the server — ARIA is live for unlimited students.

---

## 🤝 Contributing

This is a **social service project** — help welcome!

1. Fork → feature branch → PR
2. Priority: new language translations, new subjects, accessibility, mobile UX

---

## 👨‍💻 Built By

**Kumar Swamy** ([@bkumars22](https://github.com/bkumars22))  
*"Quality education for every child on Earth, regardless of geography or background."*

---

## 📄 License

MIT — free to use, modify, distribute.

---

<div align="center">
  <strong>🧠 ARIA — Because every child deserves a great teacher.</strong><br/><br/>
  <a href="https://bkumars22.github.io/ARIA/"><strong>▶ Try it now — free, forever</strong></a>
</div>
