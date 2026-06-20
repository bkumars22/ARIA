# ARIA AI Service — FastAPI
# Endpoints: /teach, /assess, /report, /voice/transcribe

import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
from agents.teaching_agent import run_teaching_turn

app = FastAPI(
    title="ARIA AI Service",
    description="Adaptive Real-time Intelligence for Anyone — AI Teaching Engine",
    version="1.0.0"
)

ALLOWED_ORIGINS = [
    "https://bkumars22.github.io",
    "https://aria-backend.onrender.com",
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

# ── Security: AI service must not be reachable from the public internet.
#    It should only receive requests from the Spring Boot backend (internal).
#    The INTERNAL_SECRET env var provides an extra layer of defence-in-depth.
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]         = "DENY"
    response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
    return response

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


# ─── /document/explain — Document Teacher ────────────────────

import base64
import time
from collections import defaultdict

# Simple in-memory rate limiter: max 10 requests/min per IP
_doc_rate_log: dict[str, list] = defaultdict(list)

class DocumentExplainRequest(BaseModel):
    document_base64:   str
    document_type:     str            # "pdf" | "image"
    student_name:      str = "Student"
    grade:             int = 5
    level:             str = "INTERMEDIATE"  # BEGINNER|INTERMEDIATE|ADVANCED|EXPERT
    language:          str = "en"
    specific_question: Optional[str] = None
    board:             str = "CBSE"
    prior_explanation: Optional[str] = None  # for follow-up context
    topic:             Optional[str] = None
    subject:           Optional[str] = None

LEVEL_INSTRUCTIONS = {
    "BEGINNER": (
        "Use very simple words a 6-year-old understands. "
        "Use short sentences, real-life stories, emojis, and fun comparisons. "
        "Avoid all jargon. Make it feel like a bedtime story about the topic."
    ),
    "INTERMEDIATE": (
        "Use clear, step-by-step explanations with concrete examples. "
        "Introduce proper terms but always explain them. "
        "Use analogies from daily life. Keep it engaging and structured."
    ),
    "ADVANCED": (
        "Provide full concept explanation with formulas, methods, and underlying theory. "
        "Include worked examples. Add exam tips and common mistakes to avoid. "
        "Use appropriate subject vocabulary."
    ),
    "EXPERT": (
        "Board exam level explanation. Reference mark schemes and examiner expectations. "
        "Show model answers and explain marking criteria. "
        "Include common student errors and how to avoid them. "
        "For CBSE reference NCERT; for ICSE reference Selina; for IGCSE reference Cambridge syllabus. "
        "Include past paper style questions."
    ),
}

BOARD_REFS = {
    "CBSE":  "This is CBSE curriculum — reference NCERT textbooks and CBSE pattern.",
    "ICSE":  "This is ICSE curriculum — reference Selina and Frank publishers.",
    "IGCSE": "This is Cambridge IGCSE — reference the Cambridge syllabus and mark schemes.",
}

LANG_NAMES = {
    "en":"English","hi":"Hindi","te":"Telugu","ta":"Tamil","kn":"Kannada",
    "ml":"Malayalam","mr":"Marathi","gu":"Gujarati","bn":"Bengali","pa":"Punjabi",
    "ur":"Urdu","fr":"French","de":"German","es":"Spanish","ar":"Arabic",
    "zh":"Chinese","ja":"Japanese","ko":"Korean","ru":"Russian","tr":"Turkish",
}

@app.post("/document/explain")
async def explain_document(req: DocumentExplainRequest, request: Request):
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = [t for t in _doc_rate_log[client_ip] if now - t < 60]
    if len(window) >= 10:
        raise HTTPException(status_code=429, detail="Rate limit: max 10 document requests per minute.")
    _doc_rate_log[client_ip] = window + [now]

    # Validate document type
    if req.document_type not in ("pdf", "image"):
        raise HTTPException(status_code=400, detail="document_type must be 'pdf' or 'image'.")

    level_key  = req.level.upper() if req.level.upper() in LEVEL_INSTRUCTIONS else "INTERMEDIATE"
    level_inst = LEVEL_INSTRUCTIONS[level_key]
    board_ref  = BOARD_REFS.get(req.board, "")
    lang_name  = LANG_NAMES.get(req.language, "English")
    grade      = max(1, min(12, req.grade))

    # Build system prompt
    system_prompt = f"""You are ARIA — a world-class AI teacher for students aged 4–18.

A student has uploaded a document for you to explain.

YOUR TASK:
1. Read and understand the ENTIRE document carefully.
2. Identify: subject area, topic, and approximate grade/difficulty level.
3. Explain it as a brilliant teacher — from basics to depth, never assuming prior knowledge.

STUDENT PROFILE:
- Name: {req.student_name}
- Grade: {grade}
- Board: {req.board}
- Explanation Level Requested: {level_key}

EXPLANATION STYLE FOR {level_key}:
{level_inst}

BOARD CONTEXT:
{board_ref}

LANGUAGE: Respond ENTIRELY in {lang_name}. Every word of your explanation must be in {lang_name}.

STRUCTURE YOUR RESPONSE AS JSON with these exact keys:
{{
  "subject_detected": "Mathematics",
  "topic_detected": "Quadratic Equations",
  "grade_detected": 9,
  "explanation": "Your full teaching explanation here (can be long, use markdown: **bold**, ## headers, • bullets)",
  "practice_questions": ["Question 1", "Question 2", "Question 3"],
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "difficulty_rating": 3
}}

RULES:
- explanation must be thorough — minimum 300 words for BEGINNER, 500 for ADVANCED/EXPERT
- Always start from BASICS even for Expert level
- practice_questions: exactly 3 questions appropriate for {level_key} level
- key_points: 3-5 most important concepts to remember
- difficulty_rating: 1 (very easy) to 5 (very hard)
- If a specific_question is asked, prioritise answering it in the explanation
- End the explanation with encouragement appropriate for the student's age
- Return ONLY valid JSON — no text before or after the JSON"""

    # Build user message content
    user_content: list = []

    if req.specific_question:
        user_content.append({
            "type": "text",
            "text": f"Specific question from student: {req.specific_question}\n\nPlease explain this document:"
        })
    else:
        user_content.append({
            "type": "text",
            "text": "Please read and explain this document as my teacher:"
        })

    # Attach document
    if req.document_base64 and req.document_base64.strip():
        if req.document_type == "image":
            user_content.append({
                "type": "image",
                "source": {
                    "type":       "base64",
                    "media_type": "image/jpeg",
                    "data":       req.document_base64,
                }
            })
        elif req.document_type == "pdf":
            user_content.append({
                "type": "document",
                "source": {
                    "type":       "base64",
                    "media_type": "application/pdf",
                    "data":       req.document_base64,
                }
            })
    else:
        # Follow-up: use prior context instead of re-uploading the document
        if req.prior_explanation:
            user_content.append({
                "type": "text",
                "text": f"Prior topic: {req.subject or ''} — {req.topic or ''}\n\nPrior explanation summary:\n{req.prior_explanation[:1000]}"
            })

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}]
    )

    raw = response.content[0].text.strip()

    # Parse JSON from Claude's response
    import json, re
    try:
        data = json.loads(raw)
    except Exception:
        # Try to extract JSON block if Claude added surrounding text
        m = re.search(r'\{[\s\S]+\}', raw)
        if m:
            try:
                data = json.loads(m.group())
            except Exception:
                data = {
                    "subject_detected": req.subject or "General",
                    "topic_detected":   req.topic or "Document",
                    "grade_detected":   grade,
                    "explanation":      raw,
                    "practice_questions": [],
                    "key_points":       [],
                    "difficulty_rating": 3,
                }
        else:
            data = {
                "subject_detected": req.subject or "General",
                "topic_detected":   req.topic or "Document",
                "grade_detected":   grade,
                "explanation":      raw,
                "practice_questions": [],
                "key_points":       [],
                "difficulty_rating": 3,
            }

    return data


# ─── /document/followup — Follow-up question on same document ─

@app.post("/document/followup")
async def document_followup(req: DocumentExplainRequest):
    """Answer a follow-up question using prior explanation context (no re-upload needed)."""
    lang_name  = LANG_NAMES.get(req.language, "English")
    level_key  = req.level.upper() if req.level.upper() in LEVEL_INSTRUCTIONS else "INTERMEDIATE"

    prompt = f"""You previously explained {req.subject or 'a topic'} — specifically {req.topic or 'a document'} to a Grade {req.grade} student.

Prior explanation summary:
{(req.prior_explanation or '')[:800]}

The student now asks: "{req.specific_question}"

Answer this follow-up question clearly in {lang_name}.
{LEVEL_INSTRUCTIONS[level_key]}

Return JSON: {{"explanation": "your answer here", "practice_questions": [], "key_points": []}}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.content[0].text.strip()
    import json, re
    try:
        return json.loads(raw)
    except Exception:
        return {"explanation": raw, "practice_questions": [], "key_points": []}


# ─── /homework/solve — Genuine homework answers ────────────────

import json as _json

_hw_rate_log: dict[str, list] = defaultdict(list)

HOMEWORK_SYSTEM_PROMPT = """You are ARIA — the most powerful, genuine, caring teacher in the world.
A student has come to you for real help with their studies.

YOUR CORE MISSION:
- Give 100% correct, genuine academic answers
- Teach the concept so deeply the student truly understands it
- Help them finish their homework with proper working shown
- Make sure they can answer similar questions in their exam

TEACHING RULES BY STUDENT LEVEL:
If student_level = WEAK:
  - Start from absolute basics — assume zero prior knowledge
  - Use very simple language, mother tongue words mixed in if needed
  - Use real life examples they know (cricket, food, family, animals)
  - Show every single step — no skipping
  - Use emojis to make it friendly 🌟
  - End with: "Now you try this similar problem: [give one easy problem]"

If student_level = AVERAGE:
  - Brief concept recap first
  - Show clear step-by-step working with explanation of each step
  - Give one similar example after solving
  - Point out common mistakes students make
  - End with exam tip

If student_level = STRONG:
  - Give complete expert answer with full working
  - Explain the deeper concept behind the answer
  - Show alternative methods if they exist
  - Give board exam style answer format
  - Point out marks allocation for each step
  - Challenge them with a harder variant question

SUBJECT-SPECIFIC RULES:
Mathematics:
  - Always show complete working — every step numbered
  - State the formula used before applying it
  - Show units in every step
  - Verify the answer at the end
  - For CBSE: follow NCERT method exactly
  - For IGCSE: show working as Cambridge mark scheme expects

Science (Physics/Chemistry/Biology):
  - State the law or principle being used
  - Show formula, substitution, calculation separately
  - Include units always
  - For experiments: state observation and conclusion

English:
  - For comprehension: answer in complete sentences, quote from passage
  - For grammar: explain the rule, then apply it
  - For essay/letter: give complete model answer with format

History/Geography/Social Studies:
  - Give factual, accurate answers with dates and names
  - Structure: Point → Explanation → Example
  - For CBSE: follow NCERT facts exactly

Coding/Computer Science:
  - Give complete working code
  - Add comments to every line explaining what it does
  - Explain the logic before the code
  - Show expected output clearly

ANSWER FORMAT — Return JSON with EXACTLY these keys:
{
  "subject_detected": "Mathematics",
  "topic_detected": "Quadratic Equations",
  "difficulty_level": "Grade 9",
  "board_reference": "NCERT Class 9 Chapter 4",
  "concept_explanation": "Brief what-is-this explanation (2-3 sentences)",
  "complete_solution": "Full step-by-step solution with ALL working shown",
  "key_points": ["point1", "point2", "point3"],
  "exam_tip": "One specific tip for this type of question in exams",
  "practice_problem": "One similar problem for the student to try",
  "verification": "How to check the answer is correct",
  "answer_confidence": 0.95,
  "language_used": "en"
}

ACCURACY RULE: Your answer must be 100% correct.
For Mathematics: verify calculations before responding.
Return ONLY valid JSON — no text before or after."""

class HomeworkRequest(BaseModel):
    document_base64:  str = ""
    document_type:    str = "none"   # pdf | image | none
    student_question: str = ""
    student_name:     str = "Student"
    grade:            int = 5
    board:            str = "CBSE"
    subject:          str = "General"
    language:         str = "en"
    student_level:    str = "AVERAGE"   # WEAK | AVERAGE | STRONG
    want_full_answer: bool = True
    want_step_by_step: bool = True
    prior_context:    Optional[str] = None  # for follow-ups

@app.post("/homework/solve")
async def homework_solve(req: HomeworkRequest, request: Request):
    # Rate limit: 20 requests/min per IP
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = [t for t in _hw_rate_log[ip] if now - t < 60]
    if len(window) >= 20:
        raise HTTPException(status_code=429, detail="Rate limit: 20 homework requests per minute.")
    _hw_rate_log[ip] = window + [now]

    lang_name = LANG_NAMES.get(req.language, "English")

    # Build the user message
    user_parts: list = []

    # Document (if provided)
    if req.document_base64 and req.document_base64.strip():
        if req.document_type == "image":
            user_parts.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": req.document_base64}
            })
        elif req.document_type == "pdf":
            user_parts.append({
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": req.document_base64}
            })

    # Prior context for follow-ups
    if req.prior_context:
        user_parts.append({"type": "text", "text": f"Previous explanation context:\n{req.prior_context[:800]}"})

    # The actual question text
    question_text = (
        f"Student: {req.student_name}, Grade {req.grade}, Board: {req.board}\n"
        f"Subject: {req.subject}\n"
        f"Student level: {req.student_level}\n"
        f"Language to answer in: {lang_name}\n"
        f"Show step-by-step: {req.want_step_by_step}\n"
        f"Question: {req.student_question if req.student_question.strip() else 'Please read and solve all questions in the uploaded document.'}"
    )
    user_parts.append({"type": "text", "text": question_text})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=HOMEWORK_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_parts}]
    )

    raw = response.content[0].text.strip()

    # Parse JSON
    try:
        data = _json.loads(raw)
    except Exception:
        m = __import__('re').search(r'\{[\s\S]+\}', raw)
        data = _json.loads(m.group()) if m else {
            "subject_detected": req.subject,
            "topic_detected": "Your question",
            "concept_explanation": "",
            "complete_solution": raw,
            "key_points": [],
            "exam_tip": "",
            "practice_problem": "",
            "verification": "",
            "answer_confidence": 0.85,
            "language_used": req.language
        }

    return data


# ─── /homework/detect — Auto-detect subject/topic/grade ────────

class DetectRequest(BaseModel):
    document_base64: str = ""
    document_type:   str = "none"
    question:        str = ""

@app.post("/homework/detect")
async def homework_detect(req: DetectRequest):
    user_parts: list = []

    if req.document_base64.strip():
        if req.document_type == "image":
            user_parts.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": req.document_base64}
            })
        elif req.document_type == "pdf":
            user_parts.append({
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": req.document_base64}
            })

    if req.question.strip():
        user_parts.append({"type": "text", "text": f"Question text: {req.question}"})

    if not user_parts:
        raise HTTPException(status_code=400, detail="Provide a document or question text.")

    user_parts.append({"type": "text", "text": """Analyze this document/question and return ONLY valid JSON:
{
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
question_type must be one of: CALCULATION | THEORY | MCQ | FILL_BLANK | SHORT_ANSWER | LONG_ANSWER | DIAGRAM | PROBLEM_SOLVING
Return ONLY the JSON."""})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        messages=[{"role": "user", "content": user_parts}]
    )

    raw = response.content[0].text.strip()
    try:
        return _json.loads(raw)
    except Exception:
        m = __import__('re').search(r'\{[\s\S]+\}', raw)
        return _json.loads(m.group()) if m else {"subject": "General", "estimated_grade": 5}


# ─── /health ──────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ARIA AI Service", "version": "1.0.0"}
