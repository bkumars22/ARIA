# ARIA — Adaptive Real-time Intelligence for Anyone

> **Free AI-powered tutor for every child on Earth.**
> Real teaching · Multi-language · Voice-enabled · Textbook RAG · No cost ever.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-667eea?style=for-the-badge&logo=github)](https://bkumars22.github.io/ARIA/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](https://github.com/bkumars22/ARIA/blob/main/LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Claude AI](https://img.shields.io/badge/AI-Claude%20Sonnet-ff6b35?style=for-the-badge)](https://anthropic.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io)
[![RAG](https://img.shields.io/badge/RAG-ChromaDB%20%2B%20sentence--transformers-8b5cf6?style=for-the-badge)](https://github.com/bkumars22/ARIA)

---

## Live Demo — Open Now

**https://bkumars22.github.io/ARIA/**

No installation. No sign-up. Just open and use.

| Role | Username | Password |
|------|----------|----------|
| Teacher | `teacher` | `Teacher@2026` |
| Admin | `admin` | `Admin@2026` |
| Parent 1 | `parent1` | `Parent@2026` |

---

## All Live Projects

| Platform | Description | Live URL |
|----------|-------------|---------|
| **ARIA** | Free AI Tutor (35 languages) | **https://bkumars22.github.io/ARIA** |
| **QAIP** | QA Intelligent Platform | https://bkumars22.github.io/QA-Intelligent-Platform |
| **SCIP** | Supply Chain Intelligence | https://bkumars22.github.io/SupplyChainPlatformProject |
| **ZENTRAVIX** | Org Intelligence Platform | https://bkumars22.github.io/ZENTRAVIX |

---

## What Is ARIA?

ARIA is a **Socratic AI tutor** that teaches children aged 4–18 using the Socratic method — it never gives direct answers but guides every child to discover the answer themselves.

### What's New — RAG Textbook Memory

ARIA now **teaches from the student's own uploaded textbook**:

1. Student uploads a PDF chapter
2. ARIA chunks, embeds, and stores it in ChromaDB (per-student collection)
3. Every question is answered using content **from their actual book** — not generic AI knowledge
4. Every Q&A turn is stored as learning memory so ARIA remembers what the student already knows

```
Student uploads Chapter 5 Chemistry PDF
              ↓
[/document/ingest-pdf] — PyMuPDF extracts text, ChromaDB stores 384-dim embeddings
              ↓
Student asks: "What is photosynthesis?"
              ↓
[retrieve_context node] — finds relevant textbook passages
              ↓
Socratic teaching using THEIR book + learning history
              ↓
Answer stored as Q&A memory for next session
```

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Socratic Teaching** | Never gives answers — guides discovery with questions |
| **35 Languages** | Hindi, Tamil, Telugu, Bengali, Kannada + 30 more |
| **Textbook RAG** | Upload your PDF → ARIA teaches from it |
| **Learning Memory** | Remembers what each student knows and struggled with |
| **Voice Support** | Ask questions by voice in any language |
| **Grade Adaptation** | Adjusts complexity for Grade 1 to Grade 12 |
| **Subject Coverage** | Maths, Science, English, History, Physics, Chemistry, Geography |
| **Progress Tracking** | Visualise understanding score per subject per session |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ARIA System                          │
│                                                         │
│  React + Vite Frontend ──► Spring Boot Backend          │
│     (GitHub Pages)            (Railway)                 │
│                                  │                      │
│                         PostgreSQL (Railway)            │
│                                  │                      │
│                         Python AI Engine                │
│                     FastAPI + LangGraph 6-node          │
│                                  │                      │
│              ┌───────────────────┼────────────┐         │
│         Groq API           ChromaDB RAG   Anthropic     │
│    (Llama-3.3-70b-versatile)  (per-student)  (Claude)  │
└─────────────────────────────────────────────────────────┘
```

### LangGraph Teaching Pipeline (7 nodes)

```
assess_level        ← detects grade and confusion signals
     │
select_curriculum   ← fetches EASY/MEDIUM/HARD module from backend
     │
retrieve_context    ← NEW: ChromaDB RAG — textbook chunks + prior Q&A
     │
teach_socratically  ← Groq Llama with textbook context injected
     │
evaluate_response   ← scores student understanding 0–100
     │
adapt_or_advance    ← simplify or move to next difficulty
     │
log_progress        ← saves to backend + stores Q&A in RAG memory
```

---

## RAG API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/document/ingest-pdf` | POST | Upload PDF textbook — extracted & stored in ChromaDB |
| `/document/ingest` | POST | Ingest plain text directly |
| `/student/memory/retrieve` | POST | NL retrieval from student's knowledge store |
| `/student/memory/save` | POST | Store a Q&A turn as learning memory |
| `/student/{id}/sources` | GET | List all uploaded documents for a student |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Spring Boot 3.3, Java 17, JWT auth |
| AI Engine | Python 3.11, FastAPI, LangGraph |
| LLM (text) | Groq — Llama-3.3-70b-versatile (free) |
| LLM (vision) | Groq — Llama-3.2-90b-vision-preview |
| RAG | ChromaDB (persistent, per-student) + sentence-transformers all-MiniLM-L6-v2 |
| PDF parsing | PyMuPDF (fitz) |
| Database | PostgreSQL 15 (Railway) |
| CI/CD | GitHub Actions → Railway + GitHub Pages |

---

## Environment Variables

```env
GROQ_API_KEY=gsk_...              # Free at console.groq.com
ANTHROPIC_API_KEY=sk-ant-...      # Claude for advanced teaching
BACKEND_URL=https://...           # Spring Boot API on Railway
ARIA_RAG_DIR=./rag_data           # ChromaDB persistent storage path
EMBED_MODEL=all-MiniLM-L6-v2     # sentence-transformers model
```

---

## Local Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && ./mvnw spring-boot:run

# AI Engine
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## MCP Servers

```json
{
  "mcpServers": {
    "aria": {
      "command": "npx",
      "args": ["@aria/mcp-server"],
      "env": { "ARIA_API_URL": "https://aria-production.up.railway.app" }
    }
  }
}
```
