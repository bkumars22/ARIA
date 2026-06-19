# ARIA AI Service — FastAPI
# Endpoints: /teach, /assess, /report, /voice/transcribe

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import slowapi
from agents.teaching_agent import run_teaching_turn

app = FastAPI(
    title="ARIA AI Service",
    description="Adaptive Real-time Intelligence for Anyone — AI Teaching Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


# ─── Request / Response Models ────────────────────────────────
class TeachRequest(BaseModel):
    student_id:           str
    session_id:           str
    student_name:         str
    grade:                int
    language:             str = "en"
    student_input:        str
    subject:              Optional[str] = None
    topic:                Optional[str] = None
    conversation_history: list = []
    understanding_score:  float = 50.0
    difficulty:           str = "MEDIUM"

class ReportRequest(BaseModel):
    student_name:        str
    grade:               int
    language:            str
    sessions_count:      int
    avg_score:           float
    strong_topics:       list[str]
    weak_topics:         list[str]
    parent_language:     str = "en"


# ─── /teach — Main teaching endpoint ─────────────────────────
@app.post("/teach")
async def teach(req: TeachRequest):
    """Run one turn of Socratic teaching through the 6-node LangGraph agent."""
    try:
        result = run_teaching_turn(
            student_id=req.student_id,
            session_id=req.session_id,
            student_name=req.student_name,
            grade=req.grade,
            language=req.language,
            student_input=req.student_input,
            subject=req.subject,
            topic=req.topic,
            conversation_history=req.conversation_history,
            understanding_score=req.understanding_score,
            difficulty=req.difficulty
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── /report — Generate parent report ────────────────────────
@app.post("/report")
async def generate_parent_report(req: ReportRequest):
    """Generate a warm, plain-language weekly report for parents."""
    lang_map = {
        "en": "English", "hi": "Hindi", "ta": "Tamil",
        "kn": "Kannada", "es": "Spanish", "ar": "Arabic", "sw": "Swahili"
    }
    parent_lang = lang_map.get(req.parent_language, "English")

    prompt = f"""Generate a warm, encouraging weekly learning report for parents.

Student: {req.student_name}, Grade {req.grade}
This week: {req.sessions_count} learning sessions
Average understanding score: {req.avg_score:.0f}/100
Strong topics: {', '.join(req.strong_topics) or 'Still exploring'}
Topics needing practice: {', '.join(req.weak_topics) or 'None identified yet'}

Write this report in {parent_lang} language.
Rules:
- Max 150 words
- Start with one genuine celebration
- Mention one specific strength
- Mention one area to practice at home (with a simple tip)
- End with encouragement
- Use simple words — parent may not be highly educated
- Warm, human tone — like a note from a caring teacher"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return {
        "success": True,
        "report": response.content[0].text
    }


# ─── /assess — Quick knowledge assessment ─────────────────────
@app.post("/assess")
async def assess_knowledge(
    student_name: str,
    grade: int,
    subject: str,
    topic: str,
    language: str = "en"
):
    """Generate 3 diagnostic questions to assess a student's starting level."""
    lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "kn": "Kannada"}
    lang_name = lang_map.get(language, "English")

    prompt = f"""Create 3 short diagnostic questions to assess a Grade {grade} student's
knowledge of {topic} in {subject}. Write in {lang_name}.

Return JSON only:
{{
  "questions": [
    {{"id": 1, "question": "...", "difficulty": "EASY",   "expected_concept": "..."}},
    {{"id": 2, "question": "...", "difficulty": "MEDIUM", "expected_concept": "..."}},
    {{"id": 3, "question": "...", "difficulty": "HARD",   "expected_concept": "..."}}
  ]
}}

Rules: Use language appropriate for age {grade + 5}. Be specific. Real-world examples."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )
    import json
    try:
        data = json.loads(response.content[0].text)
        return {"success": True, "data": data}
    except Exception:
        return {"success": True, "raw": response.content[0].text}


# ─── /voice/transcribe — Whisper voice input ─────────────────
@app.post("/voice/transcribe")
async def transcribe_voice(audio_base64: str, language: str = "en"):
    """Transcribe child's spoken input using OpenAI Whisper."""
    import base64, tempfile, os
    try:
        import openai
        audio_bytes = base64.b64decode(audio_base64)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        with open(tmp_path, "rb") as f:
            result = openai.Audio.transcribe("whisper-1", f, language=language)
        os.unlink(tmp_path)
        return {"success": True, "transcript": result["text"]}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─── /health ──────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ARIA AI Service", "version": "1.0.0"}
