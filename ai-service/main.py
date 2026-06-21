# ARIA AI Service — FastAPI + Groq (free)
# Models: llama-3.3-70b-versatile (text) · llama-3.2-90b-vision-preview (images)

import os
import json
import re
import base64
import time
from collections import defaultdict
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

from agents.teaching_agent import run_teaching_turn

# ─── App setup ────────────────────────────────────────────────

app = FastAPI(
    title="ARIA AI Service",
    description="Free AI teaching engine powered by Groq + Llama",
    version="2.0.0"
)

ALLOWED_ORIGINS = [
    "https://bkumars22.github.io",
    "https://*.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8089",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]        = "DENY"
    return response

# ─── Groq client ──────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client       = Groq(api_key=GROQ_API_KEY)

TEXT_MODEL   = "llama-3.3-70b-versatile"       # best quality, free
VISION_MODEL = "llama-3.2-90b-vision-preview"  # reads images, free
FAST_MODEL   = "llama-3.1-8b-instant"          # quick / cheap tasks

# ─── Helpers ──────────────────────────────────────────────────

def chat(system: str, user_parts, model: str = TEXT_MODEL, max_tokens: int = 2000, temperature: float = 0.3) -> str:
    """Call Groq with text or vision content and return the response string."""
    if isinstance(user_parts, str):
        user_parts = [{"type": "text", "text": user_parts}]
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user_parts},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return resp.choices[0].message.content.strip()


def _fix_json_strings(s: str) -> str:
    """Escape literal newlines/tabs inside JSON string values (common LLM mistake)."""
    result = []
    in_string = False
    escaped   = False
    for ch in s:
        if escaped:
            result.append(ch)
            escaped = False
        elif ch == '\\' and in_string:
            result.append(ch)
            escaped = True
        elif ch == '"':
            in_string = not in_string
            result.append(ch)
        elif in_string and ch == '\n':
            result.append('\\n')
        elif in_string and ch == '\r':
            result.append('\\r')
        elif in_string and ch == '\t':
            result.append('\\t')
        else:
            result.append(ch)
    return ''.join(result)


def parse_json(raw: str) -> dict:
    """Robustly extract and parse JSON from an LLM response."""
    # 1. Strip markdown code fences
    cleaned = re.sub(r'```(?:json)?\s*', '', raw).strip()

    # 2. Direct parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 3. Fix literal newlines inside strings, then retry
    try:
        return json.loads(_fix_json_strings(cleaned))
    except Exception:
        pass

    # 4. Extract outermost { ... } block and try again
    m = re.search(r'\{[\s\S]+\}', cleaned)
    if m:
        candidate = m.group()
        try:
            return json.loads(candidate)
        except Exception:
            pass
        try:
            return json.loads(_fix_json_strings(candidate))
        except Exception:
            pass

    return {}


def pdf_to_text(b64: str) -> str:
    """Extract plain text from a base64-encoded PDF using PyMuPDF."""
    try:
        import fitz
        raw   = base64.b64decode(b64)
        doc   = fitz.open(stream=raw, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n\n".join(pages)[:8000]  # cap at 8k chars to stay within token limits
    except Exception as e:
        return f"[Could not extract PDF text: {e}]"


def build_vision_content(doc_b64: str, doc_type: str, question: str) -> tuple[list, str]:
    """
    Returns (user_content_list, model_to_use).
    Images → vision model with base64 inline.
    PDFs   → extract text, use text model.
    """
    parts = []
    model = TEXT_MODEL

    if doc_b64 and doc_b64.strip():
        if doc_type == "image":
            parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{doc_b64}"}
            })
            model = VISION_MODEL
        elif doc_type == "pdf":
            extracted = pdf_to_text(doc_b64)
            parts.append({"type": "text", "text": f"[Document content]\n{extracted}"})

    if question:
        parts.append({"type": "text", "text": question})
    elif not parts:
        parts.append({"type": "text", "text": "Please explain this."})

    return parts, model


# ─── Rate limiters ────────────────────────────────────────────

_rate_log: dict[str, list] = defaultdict(list)

def rate_check(ip: str, limit: int = 20, window: int = 60):
    now    = time.time()
    recent = [t for t in _rate_log[ip] if now - t < window]
    if len(recent) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit: {limit} requests per minute.")
    _rate_log[ip] = recent + [now]


# ─── Request models ───────────────────────────────────────────

LANG_NAMES = {
    "en":"English","hi":"Hindi","te":"Telugu","ta":"Tamil","kn":"Kannada",
    "ml":"Malayalam","mr":"Marathi","gu":"Gujarati","bn":"Bengali","pa":"Punjabi",
    "ur":"Urdu","fr":"French","de":"German","es":"Spanish","ar":"Arabic",
    "zh":"Chinese","ja":"Japanese","ko":"Korean","ru":"Russian","tr":"Turkish",
    "vi":"Vietnamese","id":"Indonesian","th":"Thai","sw":"Swahili","ne":"Nepali",
}

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
    student_name:    str
    grade:           int
    language:        str
    sessions_count:  int
    avg_score:       float
    strong_topics:   list[str]
    weak_topics:     list[str]
    parent_language: str = "en"

class DocumentRequest(BaseModel):
    document_base64:   str = ""
    document_type:     str = "image"   # pdf | image
    student_name:      str = "Student"
    grade:             int = 5
    level:             str = "INTERMEDIATE"
    language:          str = "en"
    specific_question: Optional[str] = None
    board:             str = "CBSE"
    prior_explanation: Optional[str] = None
    topic:             Optional[str] = None
    subject:           Optional[str] = None

class HomeworkRequest(BaseModel):
    document_base64:   str = ""
    document_type:     str = "none"
    student_question:  str = ""
    student_name:      str = "Student"
    grade:             int = 5
    board:             str = "CBSE"
    subject:           str = "General"
    language:          str = "en"
    student_level:     str = "AVERAGE"
    want_full_answer:  bool = True
    want_step_by_step: bool = True
    prior_context:     Optional[str] = None

class DetectRequest(BaseModel):
    document_base64: str = ""
    document_type:   str = "none"
    question:        str = ""


# ─── /teach ───────────────────────────────────────────────────

@app.post("/teach")
async def teach(req: TeachRequest):
    try:
        result = run_teaching_turn(
            student_id=req.student_id, session_id=req.session_id,
            student_name=req.student_name, grade=req.grade, language=req.language,
            student_input=req.student_input, subject=req.subject, topic=req.topic,
            conversation_history=req.conversation_history,
            understanding_score=req.understanding_score, difficulty=req.difficulty
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── /report ──────────────────────────────────────────────────

@app.post("/report")
async def generate_report(req: ReportRequest):
    parent_lang = LANG_NAMES.get(req.parent_language, "English")
    prompt = f"""Write a warm weekly learning report for parents in {parent_lang}.

Student: {req.student_name}, Grade {req.grade}
Sessions this week: {req.sessions_count}
Average score: {req.avg_score:.0f}/100
Strong topics: {', '.join(req.strong_topics) or 'Still exploring'}
Topics needing practice: {', '.join(req.weak_topics) or 'None yet'}

Rules:
- Max 120 words
- Start with one genuine celebration
- Mention one strength and one area to practice (with a simple home tip)
- End with encouragement
- Simple language — parent may not be highly educated
- Warm, human tone like a caring teacher's note"""

    response = chat("You write warm, encouraging school reports for parents.", prompt, max_tokens=250)
    return {"success": True, "report": response}


# ─── /assess ──────────────────────────────────────────────────

@app.post("/assess")
async def assess(student_name: str, grade: int, subject: str, topic: str, language: str = "en"):
    lang = LANG_NAMES.get(language, "English")
    prompt = f"""Create 3 short diagnostic questions to assess a Grade {grade} student's knowledge of {topic} in {subject}. Write in {lang}.

Return JSON only:
{{
  "questions": [
    {{"id": 1, "question": "...", "difficulty": "EASY",   "expected_concept": "..."}},
    {{"id": 2, "question": "...", "difficulty": "MEDIUM", "expected_concept": "..."}},
    {{"id": 3, "question": "...", "difficulty": "HARD",   "expected_concept": "..."}}
  ]
}}"""
    raw = chat("Return only valid JSON.", prompt, model=FAST_MODEL, max_tokens=400)
    data = parse_json(raw)
    return {"success": True, "data": data}


# ─── /document/explain ────────────────────────────────────────

LEVEL_INSTRUCTIONS = {
    "BEGINNER":     "Use very simple words a 6-year-old understands. Short sentences, real-life stories, emojis. Avoid jargon.",
    "INTERMEDIATE": "Clear step-by-step explanations with concrete examples. Introduce proper terms but always explain them.",
    "ADVANCED":     "Full concept explanation with formulas, methods, and underlying theory. Include exam tips.",
    "EXPERT":       "Board exam level. Reference mark schemes. Show model answers. Include common student errors.",
}

BOARD_REFS = {
    "CBSE":  "CBSE curriculum — reference NCERT textbooks.",
    "ICSE":  "ICSE curriculum — reference Selina publishers.",
    "IGCSE": "Cambridge IGCSE — reference the Cambridge syllabus.",
}

@app.post("/document/explain")
async def explain_document(req: DocumentRequest, request: Request):
    rate_check(request.client.host if request.client else "unknown", limit=15)

    lang_name  = LANG_NAMES.get(req.language, "English")
    level_key  = req.level.upper() if req.level.upper() in LEVEL_INSTRUCTIONS else "INTERMEDIATE"
    level_inst = LEVEL_INSTRUCTIONS[level_key]
    board_ref  = BOARD_REFS.get(req.board, "")
    grade      = max(1, min(12, req.grade))

    system_prompt = f"""You are ARIA — a world-class AI teacher for students aged 4–18.

A student has uploaded a document. Read it carefully and explain it as a brilliant, caring teacher.

STUDENT: {req.student_name}, Grade {grade}, Board: {req.board}
EXPLANATION LEVEL ({level_key}): {level_inst}
BOARD CONTEXT: {board_ref}
LANGUAGE: Respond ENTIRELY in {lang_name}.

Return ONLY valid JSON:
{{
  "subject_detected": "Mathematics",
  "topic_detected": "Quadratic Equations",
  "grade_detected": 9,
  "explanation": "Full explanation here (use **bold**, ## headers, • bullets for structure)",
  "practice_questions": ["Q1", "Q2", "Q3"],
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "difficulty_rating": 3
}}

Rules:
- explanation must be at least 200 words
- If a specific question is asked, answer it in the explanation
- practice_questions: exactly 3 questions at {level_key} level
- difficulty_rating: 1 (easy) to 5 (hard)
- Return ONLY raw JSON — no markdown, no code blocks, no ```json```"""

    user_parts, model = build_vision_content(req.document_base64, req.document_type,
        req.specific_question or "Please read and explain this document as my teacher.")

    raw  = chat(system_prompt, user_parts, model=model, max_tokens=2500, temperature=0.1)
    data = parse_json(raw)

    if not data:
        data = {
            "subject_detected": req.subject or "General",
            "topic_detected":   req.topic   or "Document",
            "grade_detected":   grade,
            "explanation":      raw,
            "practice_questions": [],
            "key_points":         [],
            "difficulty_rating":  3,
        }
    return data


# ─── /document/followup ───────────────────────────────────────

@app.post("/document/followup")
async def document_followup(req: DocumentRequest):
    lang_name = LANG_NAMES.get(req.language, "English")
    level_key = req.level.upper() if req.level.upper() in LEVEL_INSTRUCTIONS else "INTERMEDIATE"

    prompt = f"""You previously explained {req.subject or 'a topic'} — {req.topic or 'a document'} to a Grade {req.grade} student.

Prior explanation summary:
{(req.prior_explanation or '')[:800]}

The student now asks: "{req.specific_question}"

Answer clearly in {lang_name}. {LEVEL_INSTRUCTIONS[level_key]}

Return JSON: {{"explanation": "your answer", "practice_questions": [], "key_points": []}}"""

    raw  = chat("You are ARIA, a helpful AI teacher. Return only valid JSON.", prompt, max_tokens=800)
    data = parse_json(raw)
    return data if data else {"explanation": raw, "practice_questions": [], "key_points": []}


# ─── /homework/solve ──────────────────────────────────────────

HOMEWORK_SYSTEM = """You are ARIA — a world-class AI teacher. A student needs genuine, accurate homework help.

CRITICAL RULES — NEVER BREAK:
1. READ THE ACTUAL QUESTION OR IMAGE CAREFULLY before answering. Every question is different.
2. Your answer must match EXACTLY what is asked — do not give a generic or repeated answer.
3. For Mathematics/Science: verify every calculation independently before writing it.
4. NEVER make up facts. If unsure, say so clearly.

LEVEL RULES:
WEAK: Start from absolute basics. Simple language. Real-life examples. Show every tiny step. Emojis welcome 🌟
AVERAGE: Brief concept recap first. Clear numbered steps. Highlight common mistakes. Exam tip at end.
STRONG: Full expert answer with complete working. Alternative methods where possible. Board exam format with marks per step.

SUBJECT-SPECIFIC RULES:
Mathematics: Write the formula first, then substitute values, then simplify step by step. Verify the answer by plugging back in.
Science: State the law/principle. Write formula → substitute → calculate → include units.
English: Complete model answer. For comprehension, quote directly from the passage with quote marks.
History/Geography: Factual answers with specific dates, names, events. Point → Explanation → Example structure.
Coding: Write complete, runnable code. Add comments. Show expected output.
General Knowledge: Give precise, factual answers. Cite the specific fact, not vague descriptions.

ANSWER FORMAT — Return ONLY raw JSON. No markdown. No code blocks. No ```json. No text before or after the JSON:
{
  "subject_detected": "<actual subject of THIS question>",
  "topic_detected": "<actual topic of THIS question>",
  "difficulty_level": "Grade X",
  "board_reference": "<e.g. NCERT Class X Chapter Y>",
  "concept_explanation": "<2-3 sentences explaining what THIS specific concept is>",
  "complete_solution": "<Full step-by-step solution to THIS specific question with ALL working shown>",
  "key_points": ["<key point 1 for THIS topic>", "<key point 2>", "<key point 3>"],
  "exam_tip": "<One specific exam tip for THIS question type>",
  "practice_problem": "<One similar but different problem for the student to try>",
  "verification": "<How to verify THIS specific answer is correct>",
  "answer_confidence": 0.95,
  "language_used": "en"
}"""

_hw_rate: dict[str, list] = defaultdict(list)

@app.post("/homework/solve")
async def homework_solve(req: HomeworkRequest, request: Request):
    rate_check(request.client.host if request.client else "unknown", limit=20)

    lang_name = LANG_NAMES.get(req.language, "English")
    has_doc   = req.document_base64 and req.document_base64.strip() and req.document_type != "none"

    # Question comes FIRST so the model focuses on the actual problem
    actual_q = req.student_question.strip() or "Solve all questions shown in the uploaded image/document."
    question_text = (
        f"QUESTION TO SOLVE:\n{actual_q}\n\n"
        f"STUDENT CONTEXT:\n"
        f"- Name: {req.student_name}, Grade {req.grade}, Board: {req.board}\n"
        f"- Subject: {req.subject}, Level: {req.student_level}\n"
        f"- Answer language: {lang_name}\n"
        f"- Show full step-by-step working: {req.want_step_by_step}\n"
    )

    if req.prior_context:
        question_text += f"\nPRIOR CONTEXT:\n{req.prior_context[:600]}\n"

    question_text += "\nIMPORTANT: Solve specifically what is asked above — not a generic example."

    if has_doc:
        user_parts, model = build_vision_content(req.document_base64, req.document_type, question_text)
    else:
        user_parts = question_text
        model      = TEXT_MODEL

    # temperature=0.1 for factual accuracy (math, science, etc.)
    raw  = chat(HOMEWORK_SYSTEM, user_parts, model=model, max_tokens=3000, temperature=0.1)
    data = parse_json(raw)

    if not data:
        data = {
            "subject_detected":    req.subject,
            "topic_detected":      "Your question",
            "concept_explanation": "",
            "complete_solution":   raw,
            "key_points":          [],
            "exam_tip":            "",
            "practice_problem":    "",
            "verification":        "",
            "answer_confidence":   0.85,
            "language_used":       req.language,
        }
    return data


# ─── /homework/detect ────────────────────────────────────────

@app.post("/homework/detect")
async def homework_detect(req: DetectRequest):
    has_doc = req.document_base64.strip() and req.document_type != "none"

    detect_q = (req.question or "") + "\n\nAnalyze this and return ONLY valid JSON:\n" + """{
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "chapter": "Chapter 4",
  "estimated_grade": 9,
  "board_detected": "CBSE",
  "ncert_reference": "NCERT Class 9 Mathematics Chapter 4",
  "question_type": "CALCULATION",
  "estimated_marks": 3,
  "difficulty": "MEDIUM",
  "keywords_found": ["quadratic", "equation", "roots"]
}
question_type: CALCULATION|THEORY|MCQ|FILL_BLANK|SHORT_ANSWER|LONG_ANSWER|DIAGRAM|PROBLEM_SOLVING"""

    if has_doc:
        user_parts, model = build_vision_content(req.document_base64, req.document_type, detect_q)
    else:
        user_parts = detect_q
        model      = FAST_MODEL

    raw  = chat("Return only valid JSON. No explanation.", user_parts, model=model, max_tokens=300)
    data = parse_json(raw)
    return data if data else {"subject": "General", "estimated_grade": 5}


# ─── /health ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": "ARIA AI Service",
        "version": "2.0.0",
        "engine":  "Groq + Llama 3.3 (free)",
        "models": {
            "text":   TEXT_MODEL,
            "vision": VISION_MODEL,
            "fast":   FAST_MODEL,
        }
    }
