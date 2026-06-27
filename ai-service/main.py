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
from model_router import get_router
from cost_tracker import record as track_cost, dashboard as cost_dashboard

_router = get_router("ARIA")

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

def chat(
    system: str,
    user_parts,
    model: str = TEXT_MODEL,
    max_tokens: int = 2000,
    temperature: float = 0.3,
    task_type: str = "auto",
) -> str:
    """Call Groq with text or vision content, model routing, and cost tracking."""
    if isinstance(user_parts, str):
        user_parts = [{"type": "text", "text": user_parts}]

    # Use ModelRouter to select optimal model unless caller forces a specific one
    has_image = any(p.get("type") == "image_url" for p in user_parts if isinstance(p, dict))
    if model in (TEXT_MODEL, FAST_MODEL):   # only auto-route for non-forced calls
        prompt_text = " ".join(p.get("text", "") for p in user_parts if isinstance(p, dict) and p.get("type") == "text")
        decision = _router.route(task_type=task_type, prompt=prompt_text, has_image=has_image)
        model = decision.model_spec.model_id

    t0 = time.time()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user_parts},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    latency_ms = int((time.time() - t0) * 1000)

    usage = resp.usage
    track_cost(
        project="ARIA",
        task_type=task_type,
        model_id=model,
        prompt_tokens=usage.prompt_tokens if usage else 0,
        completion_tokens=usage.completion_tokens if usage else 0,
        latency_ms=latency_ms,
    )
    return resp.choices[0].message.content.strip()


def _fix_json_strings(s: str) -> str:
    # Fix two common LLM JSON mistakes inside string values:
    # 1. Literal newlines/tabs -> proper escape sequences
    # 2. Invalid escapes like \( \[ (LaTeX) -> doubled \\ so json.loads accepts them
    result = []
    in_string = False
    i = 0
    while i < len(s):
        ch = s[i]
        if not in_string:
            result.append(ch)
            if ch == '"':
                in_string = True
            i += 1
        else:
            if ch == '\\' and i + 1 < len(s):
                nxt = s[i + 1]
                # Only treat as valid JSON escape if it's a non-ambiguous sequence.
                # We intentionally exclude \b \f \t because in math content they are
                # almost always LaTeX commands (\beta, \frac, \theta) not JSON control chars.
                if nxt in ('"', '\\', '/', 'n', 'r'):
                    # Unambiguously valid JSON escape — pass through
                    result.append(ch); result.append(nxt)
                    i += 2
                elif nxt == 'u' and i + 5 < len(s) and all(c in '0123456789abcdefABCDEF' for c in s[i+2:i+6]):
                    # Valid Unicode escape \uXXXX — pass through
                    result.append(ch); result.append(nxt)
                    i += 2
                else:
                    # Invalid or ambiguous escape (\( \[ \frac \beta \theta etc.)
                    # Double the backslash so json.loads accepts it
                    result.append('\\\\')
                    i += 1   # leave nxt to be processed next iteration
            elif ch == '"':
                in_string = False
                result.append(ch)
                i += 1
            elif ch == '\n':
                result.append('\\n')
                i += 1
            elif ch == '\r':
                result.append('\\r')
                i += 1
            elif ch == '\t':
                result.append('\\t')
                i += 1
            else:
                result.append(ch)
                i += 1
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

HOMEWORK_SYSTEM = r"""You are ARIA — a world-class teacher. Produce answers like a top CBSE/ICSE textbook solution book.

CRITICAL RULES:
1. Read the question carefully. Every question is DIFFERENT. Never give a generic answer.
2. Verify every calculation before writing it. Mathematics must be 100% correct.
3. Use LaTeX math notation: \(...\) for inline math, \[...\] for display equations.
4. Never fabricate facts, dates, or formulas.

ANSWER STYLE — Match this textbook format exactly:

For Mathematics:
  - State the relevant identity/formula/theorem first
  - Substitute known values step by step, showing every line
  - Use \( \) for all expressions: \(a^2+b^2+c^2 = 83\), \(\frac{62}{100} \times 50\)
  - Use \[ \] for display equations: \[a^3+b^3+c^3-3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)\]
  - End with "Therefore: " or "∴ Answer: " followed by the final value

For Science (Chemistry / Physics / Biology):
  - State the law or principle first (e.g. "By law of conservation of energy...")
  - Formula → substitute values with units → simplify → boxed answer with units
  - For ratio/proportion: show the fraction clearly \(\frac{62}{100} \times 50 = 31 \text{ g}\)

For English:
  - Complete model answer with proper format (letter, essay, comprehension)
  - For comprehension: quote the passage directly in "quotation marks"

For History/Geography:
  - Point → Explanation → Example (PEE) structure
  - Include specific dates, names, places

For Coding:
  - Complete working code with comments
  - Show expected output clearly

LEVEL RULES:
WEAK: Explain from absolute scratch. Define every symbol. Use emojis for warmth. Show tiny steps.
AVERAGE: Brief concept intro. Clean numbered steps. Highlight one common mistake to avoid.
STRONG: Expert answer with full working + alternative method. Board exam format with marks per step.

ANSWER FORMAT — Return ONLY raw JSON. No markdown fences. No extra text before or after:
{
  "subject_detected": "<actual subject of THIS question>",
  "topic_detected": "<actual topic of THIS question>",
  "difficulty_level": "Grade X",
  "board_reference": "<e.g. NCERT Class 9 Mathematics Chapter 2 — Polynomials>",
  "concept_explanation": "<2-3 sentences stating what this specific concept/identity/law is>",
  "complete_solution": "<Full textbook-quality answer. State formula first. Then substitute step by step. Use \\(...\\) for every mathematical expression. Number every step. End with ∴ Answer: ...>",
  "key_points": ["<key point 1 for this exact topic>", "<key point 2>", "<key point 3>"],
  "exam_tip": "<Specific tip for this question type in board exams>",
  "practice_problem": "<One similar problem with different values — do NOT repeat the same question>",
  "verification": "<Show verification working using LaTeX notation>",
  "further_reading": [
    {"board": "CBSE", "description": "<NCERT chapter + exercise number for this exact topic>"},
    {"board": "ICSE", "description": "<Selina or Frank chapter for this exact topic>"},
    {"board": "General", "description": "<Type of practice problems to look for to master this topic>"}
  ],
  "answer_confidence": 0.97,
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
            "further_reading":     [],
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


# ─── RAG endpoints ───────────────────────────────────────────

class DocumentIngestRequest(BaseModel):
    student_id: str
    text: str
    source_id: str
    source_type: str = "textbook"
    metadata: dict = {}


class StudentQueryRequest(BaseModel):
    student_id: str
    question: str
    top_k: int = 4


class MemoryStoreRequest(BaseModel):
    student_id: str
    question: str
    answer: str
    subject: str = ""
    language: str = "English"


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages_text = []
        for page in doc:
            text = page.get_text()
            if text.strip():
                pages_text.append(text)
        doc.close()
        return "\n".join(pages_text)
    except ImportError:
        return ""
    except Exception:
        return ""


@app.post("/document/ingest")
async def document_ingest(payload: DocumentIngestRequest):
    """Ingest plain text into a student's ChromaDB collection."""
    try:
        from rag.chroma_store import ingest_document
        chunks = ingest_document(
            student_id=payload.student_id,
            text=payload.text,
            source_id=payload.source_id,
            source_type=payload.source_type,
            metadata=payload.metadata,
        )
        return {"status": "ok", "chunks_stored": chunks}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


from fastapi import UploadFile, File, Form as FormField


@app.post("/document/ingest-pdf")
async def document_ingest_pdf(
    file: UploadFile = File(...),
    student_id: str = FormField(...),
    subject: str = FormField(default="General"),
    grade: int = FormField(default=8),
    language: str = FormField(default="English"),
):
    """Upload a PDF textbook page; text is extracted and stored in ChromaDB."""
    pdf_bytes = await file.read()
    text = _extract_pdf_text(pdf_bytes)
    if not text.strip():
        raise HTTPException(status_code=422, detail="No text found in PDF")

    try:
        from rag.chroma_store import ingest_document
        chunks = ingest_document(
            student_id=student_id,
            text=text,
            source_id=file.filename or "uploaded_pdf",
            source_type="textbook",
            metadata={"subject": subject, "grade": grade, "language": language, "filename": file.filename},
        )
        return {
            "status": "ok",
            "chunks_stored": chunks,
            "subject": subject,
            "grade": grade,
            "message": f"Ready to answer questions about your {subject} textbook",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/student/memory/save")
async def memory_save(payload: MemoryStoreRequest):
    """Store a Q&A turn in the student's learning memory."""
    try:
        from rag.chroma_store import save_qa_turn
        ok = save_qa_turn(
            student_id=payload.student_id,
            question=payload.question,
            answer=payload.answer,
            subject=payload.subject,
            language=payload.language,
        )
        return {"status": "ok" if ok else "failed"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/student/memory/retrieve")
async def memory_retrieve(payload: StudentQueryRequest):
    """Retrieve relevant chunks from the student's learning memory."""
    try:
        from rag.retriever import retrieve_for_question, format_student_context
        hits = retrieve_for_question(
            student_id=payload.student_id,
            question=payload.question,
            top_k=payload.top_k,
        )
        return {
            "results": hits,
            "context": format_student_context(hits, question=payload.question),
            "count": len(hits),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/student/{student_id}/sources")
async def student_sources(student_id: str):
    """List all documents a student has uploaded."""
    try:
        from rag.chroma_store import list_sources
        return {"sources": list_sources(student_id)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── /health ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": "ARIA AI Service",
        "version": "2.0.0",
        "engine":  "Groq + Llama 3.3 (free)",
        "rag":     "ChromaDB + sentence-transformers",
        "models": {
            "text":   TEXT_MODEL,
            "vision": VISION_MODEL,
            "fast":   FAST_MODEL,
        }
    }
