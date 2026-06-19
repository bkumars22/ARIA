# ARIA — Adaptive Real-time Intelligence for Anyone

> AI tutor that teaches any subject, in any language, to any child on Earth — for free.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://github.com/bkumars22/ARIA)
[![Tests](https://img.shields.io/badge/Tests-Playwright-green)](https://github.com/bkumars22/ARIA)
[![AI](https://img.shields.io/badge/AI-Claude%20%2B%20LangGraph-purple)](https://anthropic.com)
[![Impact](https://img.shields.io/badge/Impact-1.6B%20Children-orange)](https://github.com/bkumars22/ARIA)

---

## The Problem

1.6 billion children on Earth. Only a fraction have access to a quality teacher.
- Rural India: 1 teacher for 60+ students across multiple grades
- Africa: 300 million kids with no qualified teacher
- Private tutoring: $50–$200/hour — only for the wealthy

**ARIA is the patient, personalised, always-available teacher every child deserves.**

---

## What ARIA Does

- 🧠 **Adaptive learning** — detects struggle, simplifies, advances when ready
- 🌍 **Multi-language** — English, Hindi, Tamil, Kannada, Swahili, Spanish, Arabic
- 🎤 **Voice input** — children who can't type yet can speak
- 📊 **Parent dashboard** — real-time progress every parent can understand
- 🏫 **Teacher dashboard** — class-wide analytics for educators
- 📱 **Works on ₹3,000 Android phones with 2G internet**
- ✅ **Free, forever** — open source, NGO-ready

---

## Architecture

```
React 18 (Teacher/Parent Dashboard)    React Native (Child Tutor App)
                    ↕ JWT Auth
              Spring Boot 4 API
              90+ REST Endpoints
                    ↕
           Python FastAPI AI Service
    LangGraph 6-node Adaptive Agent
    Claude AI Socratic Teaching Engine
    Whisper Voice Recognition
                    ↕
    PostgreSQL + Flyway Migrations
    Student Progress · Curriculum · Sessions
```

---

## LangGraph 6-Node Teaching Agent

```
Student Input
     ↓
[Node 1] assess_level       — Detect grade/knowledge level
     ↓
[Node 2] select_curriculum  — Choose right lesson module
     ↓
[Node 3] teach_socratically — Ask guiding questions, not answers
     ↓
[Node 4] evaluate_response  — Did they understand?
     ↓
[Node 5] adapt_or_advance   — Simplify OR move to next concept
     ↓
[Node 6] log_progress       — Save to PostgreSQL, update dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 4, JWT, RBAC, JPA, Flyway |
| Frontend | React 18, React Router, Web Speech API |
| Mobile | React Native + Expo (Android + iOS) |
| AI | Python FastAPI, Claude AI, LangGraph, Whisper |
| Testing | Playwright TypeScript, pytest, 100% coverage |
| DevOps | Docker Compose, GitHub Actions, Railway, GitHub Pages |
| Database | PostgreSQL 16, H2 (testing), 5 Flyway migrations |

---

## Curriculum Scope

- **Mathematics** — Grade 1–10 (arithmetic → algebra → geometry)
- **Science** — Physics, Chemistry, Biology
- **Languages** — English reading, writing, comprehension
- **Coding** — Intro programming concepts for kids
- **Life Skills** — Financial literacy, health, critical thinking

---

## Quick Start

```bash
git clone https://github.com/bkumars22/ARIA.git
cd ARIA
docker-compose up
# Frontend: http://localhost:3000
# API:      http://localhost:8089/aria
# Swagger:  http://localhost:8089/aria/swagger-ui.html
# AI:       http://localhost:8001/docs
# Login:    teacher@aria.ai / Teacher@2026
```

---

## Run Tests

```bash
cd tests
npx playwright test
npx playwright show-report
```

---

## Impact

> "Every child deserves a patient, brilliant teacher available 24/7 in their language.
> ARIA makes that possible — for free." — Kumara Swamy B, Builder

Built by **Kumara Swamy B** — Staff SDET & AI Architect · [LinkedIn](https://linkedin.com/in/kumaraswamy7731b020) · [GitHub](https://github.com/bkumars22)
