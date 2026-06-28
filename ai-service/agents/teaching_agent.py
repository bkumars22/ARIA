# ARIA Adaptive Teaching Agent
# LangGraph 6-node StateGraph — the brain of ARIA
# Nodes: assess_level → select_curriculum → teach_socratically
#        → evaluate_response → adapt_or_advance → log_progress

import os
import json
import httpx
from groq import Groq
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

from langsmith_utils import trace_node

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

TEXT_MODEL   = "llama-3.3-70b-versatile"   # best quality, free
FAST_MODEL   = "llama-3.1-8b-instant"      # quick tasks
BACKEND_URL  = os.getenv("BACKEND_URL", "http://localhost:8089/aria")


def groq_text(system: str, user: str, model: str = TEXT_MODEL, max_tokens: int = 400) -> str:
    """Simple wrapper around Groq chat completion."""
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system",  "content": system},
            {"role": "user",    "content": user},
        ],
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return resp.choices[0].message.content.strip()


def groq_chat(system: str, messages: list, max_tokens: int = 400) -> str:
    """Chat completion with conversation history."""
    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=max_tokens,
        temperature=0.8,
    )
    return resp.choices[0].message.content.strip()


# ─── Agent State ──────────────────────────────────────────────
class TeachingState(TypedDict):
    student_id:           str
    session_id:           str
    student_name:         str
    grade:                int
    language:             str
    subject:              Optional[str]
    topic:                Optional[str]
    student_input:        str
    input_type:           str
    detected_level:       Optional[int]
    selected_module:      Optional[dict]
    rag_context:          Optional[str]   # textbook + prior Q&A context from ChromaDB
    aria_response:        Optional[str]
    is_correct:           Optional[bool]
    understanding_score:  float
    difficulty:           str
    conversation_history: list
    should_simplify:      bool
    should_advance:       bool
    log_entry:            Optional[dict]


SOCRATIC_SYSTEM_PROMPT = """You are ARIA — a warm, patient AI tutor for children aged 4–18.

TEACHING RULES (never break these):
1. NEVER just give the answer. Always guide with questions.
2. Use the Socratic method — ask "What do you think?", "Why?", "What happens if...?"
3. Celebrate effort, not just correct answers. "Great thinking!" "You're getting there!"
4. Use simple words appropriate for grade {grade}.
5. Respond in {language} language ONLY.
6. Keep responses SHORT — max 3 sentences for young children (grade 1-3), 5 for older.
7. If a child is wrong, don't say "Wrong!" — say "Hmm, interesting! Let's think again..."
8. Use real-world examples the child knows: food, games, family, nature.
9. End every response with ONE guiding question to keep the child thinking.
10. If the child seems frustrated (repeats wrong answer), simplify immediately.
11. If TEXTBOOK CONTENT is provided below, ground your explanation in it — use its examples and terminology.

CURRENT CONTEXT:
- Student: {student_name}, Grade {grade}
- Subject: {subject}, Topic: {topic}
- Difficulty: {difficulty}
- Understanding score so far: {understanding_score}/100
{rag_section}
Remember: You are the most patient, encouraging teacher this child may ever have."""


# ─── Node 1: Assess Level ─────────────────────────────────────
@trace_node("assess_level")
def assess_level(state: TeachingState) -> TeachingState:
    prompt = f"""A Grade {state['grade']} student said: "{state['student_input']}"

Return JSON only (no other text):
{{"detected_level": <1-12>, "shows_confusion": <true/false>}}"""
    try:
        raw   = groq_text("Return only valid JSON.", prompt, model=FAST_MODEL, max_tokens=60)
        data  = json.loads(raw)
        state['detected_level'] = data.get('detected_level', state['grade'])
        state['should_simplify'] = data.get('shows_confusion', False)
    except Exception:
        state['detected_level'] = state['grade']
        state['should_simplify'] = False
    return state


# ─── Node 2: Select Curriculum ────────────────────────────────
def select_curriculum(state: TeachingState) -> TeachingState:
    try:
        resp = httpx.get(
            f"{BACKEND_URL}/api/curriculum",
            params={"grade": state['detected_level'], "subject": state.get('subject', ''), "language": state['language']},
            timeout=4.0
        )
        modules = resp.json().get('data', [])
        if modules:
            target = 'EASY' if state['should_simplify'] else 'MEDIUM'
            best   = next((m for m in modules if m['difficulty'] == target), modules[0])
            state['selected_module'] = best
            state['subject']   = best.get('subject', state.get('subject'))
            state['topic']     = best.get('topic',   state.get('topic'))
            state['difficulty']= best.get('difficulty', 'MEDIUM')
    except Exception:
        state['selected_module'] = {'subject': state.get('subject', 'Mathematics'), 'topic': state.get('topic', 'General'), 'difficulty': state.get('difficulty', 'MEDIUM')}
    return state


# ─── Node 2.5: Retrieve Context (RAG) ────────────────────────
def retrieve_context(state: TeachingState) -> TeachingState:
    """Pull relevant textbook chunks and prior Q&A from ChromaDB."""
    student_id = state.get("student_id", "")
    question = state.get("student_input", "")
    if not student_id or not question:
        state["rag_context"] = ""
        return state

    try:
        from rag.retriever import retrieve_for_question, format_student_context
        hits = retrieve_for_question(student_id=student_id, question=question, top_k=3)
        state["rag_context"] = format_student_context(hits, question=question)
    except Exception:
        state["rag_context"] = ""
    return state


# ─── Node 3: Teach Socratically ───────────────────────────────
@trace_node("teach_socratically")
def teach_socratically(state: TeachingState) -> TeachingState:
    rag_ctx = state.get("rag_context") or ""
    rag_section = f"\nTEXTBOOK CONTENT FOR THIS LESSON:\n{rag_ctx}\n" if rag_ctx else ""

    system = SOCRATIC_SYSTEM_PROMPT.format(
        grade=state['grade'],
        language=state['language'],
        student_name=state['student_name'],
        subject=state.get('subject', 'General'),
        topic=state.get('topic', 'General'),
        difficulty=state.get('difficulty', 'MEDIUM'),
        understanding_score=state['understanding_score'],
        rag_section=rag_section,
    )
    messages = state['conversation_history'] + [{"role": "user", "content": state['student_input']}]
    state['aria_response'] = groq_chat(system, messages, max_tokens=300)
    state['conversation_history'].append({"role": "user",      "content": state['student_input']})
    state['conversation_history'].append({"role": "assistant", "content": state['aria_response']})

    # Auto-store this Q&A turn in the student's learning memory
    try:
        from rag.chroma_store import save_qa_turn
        save_qa_turn(
            student_id=state.get("student_id", ""),
            question=state["student_input"],
            answer=state["aria_response"],
            subject=state.get("subject", ""),
            language=state.get("language", "English"),
        )
    except Exception:
        pass
    return state


# ─── Node 4: Evaluate Response ────────────────────────────────
@trace_node("evaluate_response")
def evaluate_response(state: TeachingState) -> TeachingState:
    prompt = f"""Grade {state['grade']} student studying {state.get('topic','general')} said:
"{state['student_input']}"
Return JSON only: {{"score": <0-100>, "is_correct": <true/false/null>}}"""
    try:
        raw  = groq_text("Return only valid JSON.", prompt, model=FAST_MODEL, max_tokens=50)
        data = json.loads(raw)
        new_score = data.get('score', 50)
        state['understanding_score'] = (state['understanding_score'] * 0.6) + (new_score * 0.4)
        state['is_correct'] = data.get('is_correct')
    except Exception:
        pass
    return state


# ─── Node 5: Adapt or Advance ─────────────────────────────────
def adapt_or_advance(state: TeachingState) -> TeachingState:
    score = state['understanding_score']
    if score >= 80:
        state['should_advance']  = True
        state['should_simplify'] = False
        state['difficulty'] = 'HARD' if state['difficulty'] == 'MEDIUM' else 'MEDIUM'
    elif score <= 35:
        state['should_simplify'] = True
        state['should_advance']  = False
        state['difficulty'] = 'EASY'
    else:
        state['should_simplify'] = False
        state['should_advance']  = False
    return state


# ─── Node 6: Log Progress ─────────────────────────────────────
@trace_node("log_progress")
def log_progress(state: TeachingState) -> TeachingState:
    log = {
        "sessionId": state['session_id'], "studentId": state['student_id'],
        "studentMessage": state['student_input'], "ariaResponse": state['aria_response'],
        "understandingScore": round(state['understanding_score'], 2),
        "isCorrect": state['is_correct'], "shouldAdvance": state['should_advance'],
        "topic": state.get('topic'), "difficulty": state['difficulty']
    }
    try:
        httpx.post(f"{BACKEND_URL}/api/sessions/{state['session_id']}/messages", json=log, timeout=4.0)
    except Exception:
        pass
    state['log_entry'] = log
    return state


# ─── Build LangGraph ──────────────────────────────────────────
workflow = StateGraph(TeachingState)
workflow.add_node("assess_level",      assess_level)
workflow.add_node("select_curriculum", select_curriculum)
workflow.add_node("retrieve_context",  retrieve_context)
workflow.add_node("teach_socratically",teach_socratically)
workflow.add_node("evaluate_response", evaluate_response)
workflow.add_node("adapt_or_advance",  adapt_or_advance)
workflow.add_node("log_progress",      log_progress)

workflow.set_entry_point("assess_level")
workflow.add_edge("assess_level",       "select_curriculum")
workflow.add_edge("select_curriculum",  "retrieve_context")
workflow.add_edge("retrieve_context",   "teach_socratically")
workflow.add_edge("teach_socratically", "evaluate_response")
workflow.add_edge("evaluate_response",  "adapt_or_advance")
workflow.add_edge("adapt_or_advance",   "log_progress")
workflow.add_edge("log_progress",       END)

aria_agent = workflow.compile()


def run_teaching_turn(student_id, session_id, student_name, grade, language,
                       student_input, subject=None, topic=None,
                       conversation_history=None, understanding_score=50.0, difficulty="MEDIUM"):
    result = aria_agent.invoke(TeachingState(
        student_id=student_id, session_id=session_id, student_name=student_name,
        grade=grade, language=language, subject=subject, topic=topic,
        student_input=student_input, input_type="TEXT", detected_level=grade,
        selected_module=None, rag_context=None, aria_response=None, is_correct=None,
        understanding_score=understanding_score, difficulty=difficulty,
        conversation_history=conversation_history or [],
        should_simplify=False, should_advance=False, log_entry=None
    ))
    return {
        "response":             result['aria_response'],
        "understanding_score":  result['understanding_score'],
        "should_advance":       result['should_advance'],
        "should_simplify":      result['should_simplify'],
        "difficulty":           result['difficulty'],
        "topic":                result.get('topic'),
        "conversation_history": result['conversation_history']
    }
