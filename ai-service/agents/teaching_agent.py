# ARIA Adaptive Teaching Agent
# LangGraph 6-node StateGraph — the brain of ARIA
# Nodes: assess_level → select_curriculum → teach_socratically
#        → evaluate_response → adapt_or_advance → log_progress

import anthropic
import json
import httpx
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

client = anthropic.Anthropic()

# ─── Agent State ──────────────────────────────────────────────
class TeachingState(TypedDict):
    student_id:         str
    session_id:         str
    student_name:       str
    grade:              int
    language:           str
    subject:            Optional[str]
    topic:              Optional[str]
    student_input:      str
    input_type:         str           # TEXT or VOICE
    detected_level:     Optional[int] # Detected grade level
    selected_module:    Optional[dict]
    aria_response:      Optional[str]
    is_correct:         Optional[bool]
    understanding_score: float        # 0-100
    difficulty:         str           # EASY | MEDIUM | HARD
    conversation_history: list
    should_simplify:    bool
    should_advance:     bool
    log_entry:          Optional[dict]


# ─── SOCRATIC PROMPT TEMPLATE ─────────────────────────────────
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

CURRENT CONTEXT:
- Student: {student_name}, Grade {grade}
- Subject: {subject}, Topic: {topic}
- Difficulty: {difficulty}
- Understanding score so far: {understanding_score}/100

Remember: You are the most patient, encouraging teacher this child may ever have."""


# ─── Node 1: Assess Level ─────────────────────────────────────
def assess_level(state: TeachingState) -> TeachingState:
    """Detect the child's actual knowledge level from their input."""
    prompt = f"""A Grade {state['grade']} student said: "{state['student_input']}"

Analyse this response and return JSON only:
{{
  "detected_level": <1-12 integer, their apparent level>,
  "confidence": <0.0-1.0>,
  "shows_confusion": <true/false>,
  "key_concepts_shown": ["concept1", "concept2"]
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    try:
        data = json.loads(response.content[0].text)
        state['detected_level'] = data.get('detected_level', state['grade'])
        state['should_simplify'] = data.get('shows_confusion', False)
    except Exception:
        state['detected_level'] = state['grade']
        state['should_simplify'] = False
    return state


# ─── Node 2: Select Curriculum ────────────────────────────────
def select_curriculum(state: TeachingState) -> TeachingState:
    """Pick the right module from the curriculum database."""
    try:
        resp = httpx.get(
            f"{BACKEND_URL}/api/curriculum",
            params={
                "grade": state['detected_level'],
                "subject": state.get('subject', ''),
                "language": state['language']
            },
            timeout=5.0
        )
        modules = resp.json().get('data', [])
        if modules:
            # Pick by difficulty — simplify if confused
            target_diff = 'EASY' if state['should_simplify'] else 'MEDIUM'
            best = next((m for m in modules if m['difficulty'] == target_diff), modules[0])
            state['selected_module'] = best
            state['subject'] = best.get('subject', state.get('subject'))
            state['topic'] = best.get('topic', state.get('topic'))
            state['difficulty'] = best.get('difficulty', 'MEDIUM')
    except Exception:
        # Fallback: use whatever subject/topic is already set
        state['selected_module'] = {
            'subject': state.get('subject', 'Mathematics'),
            'topic': state.get('topic', 'General'),
            'difficulty': state.get('difficulty', 'MEDIUM')
        }
    return state


# ─── Node 3: Teach Socratically ───────────────────────────────
def teach_socratically(state: TeachingState) -> TeachingState:
    """Generate a Socratic teaching response using Claude AI."""
    system = SOCRATIC_SYSTEM_PROMPT.format(
        grade=state['grade'],
        language=state['language'],
        student_name=state['student_name'],
        subject=state.get('subject', 'General'),
        topic=state.get('topic', 'General'),
        difficulty=state.get('difficulty', 'MEDIUM'),
        understanding_score=state['understanding_score']
    )

    messages = state['conversation_history'] + [
        {"role": "user", "content": state['student_input']}
    ]

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=system,
        messages=messages
    )

    state['aria_response'] = response.content[0].text
    state['conversation_history'].append(
        {"role": "user",    "content": state['student_input']}
    )
    state['conversation_history'].append(
        {"role": "assistant", "content": state['aria_response']}
    )
    return state


# ─── Node 4: Evaluate Response ────────────────────────────────
def evaluate_response(state: TeachingState) -> TeachingState:
    """Assess how well the child understood — update score."""
    prompt = f"""A Grade {state['grade']} student studying {state.get('topic', 'general')} said:
"{state['student_input']}"

Rate their understanding from 0-100 and return JSON only:
{{
  "score": <0-100>,
  "is_correct": <true/false/null if not assessable>,
  "misconception": "<brief description or null>",
  "feedback_hint": "<one encouraging word or phrase>"
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )
    try:
        data = json.loads(response.content[0].text)
        new_score = data.get('score', 50)
        # Weighted running average — recent answers matter more
        state['understanding_score'] = (state['understanding_score'] * 0.6) + (new_score * 0.4)
        state['is_correct'] = data.get('is_correct')
    except Exception:
        pass
    return state


# ─── Node 5: Adapt or Advance ─────────────────────────────────
def adapt_or_advance(state: TeachingState) -> TeachingState:
    """Decide to simplify, stay, or advance based on understanding score."""
    score = state['understanding_score']

    if score >= 80:
        # Child is doing great — advance to next topic
        state['should_advance'] = True
        state['should_simplify'] = False
        state['difficulty'] = 'HARD' if state['difficulty'] == 'MEDIUM' else 'MEDIUM'
    elif score <= 35:
        # Child is struggling — simplify
        state['should_simplify'] = True
        state['should_advance'] = False
        state['difficulty'] = 'EASY'
    else:
        # Keep going at same level
        state['should_simplify'] = False
        state['should_advance'] = False

    return state


# ─── Node 6: Log Progress ─────────────────────────────────────
def log_progress(state: TeachingState) -> TeachingState:
    """Persist session message and progress to Spring Boot backend."""
    log = {
        "sessionId":        state['session_id'],
        "studentId":        state['student_id'],
        "studentMessage":   state['student_input'],
        "ariaResponse":     state['aria_response'],
        "understandingScore": round(state['understanding_score'], 2),
        "isCorrect":        state['is_correct'],
        "shouldAdvance":    state['should_advance'],
        "topic":            state.get('topic'),
        "difficulty":       state['difficulty']
    }
    try:
        httpx.post(
            f"{BACKEND_URL}/api/sessions/{state['session_id']}/messages",
            json=log,
            timeout=5.0
        )
    except Exception as e:
        pass  # Never crash the teaching loop on log failure
    state['log_entry'] = log
    return state


# ─── Build the LangGraph ──────────────────────────────────────
import os
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8089/aria")

workflow = StateGraph(TeachingState)
workflow.add_node("assess_level",        assess_level)
workflow.add_node("select_curriculum",   select_curriculum)
workflow.add_node("teach_socratically",  teach_socratically)
workflow.add_node("evaluate_response",   evaluate_response)
workflow.add_node("adapt_or_advance",    adapt_or_advance)
workflow.add_node("log_progress",        log_progress)

workflow.set_entry_point("assess_level")
workflow.add_edge("assess_level",       "select_curriculum")
workflow.add_edge("select_curriculum",  "teach_socratically")
workflow.add_edge("teach_socratically", "evaluate_response")
workflow.add_edge("evaluate_response",  "adapt_or_advance")
workflow.add_edge("adapt_or_advance",   "log_progress")
workflow.add_edge("log_progress",       END)

aria_agent = workflow.compile()


def run_teaching_turn(
    student_id: str,
    session_id: str,
    student_name: str,
    grade: int,
    language: str,
    student_input: str,
    subject: str = None,
    topic: str = None,
    conversation_history: list = None,
    understanding_score: float = 50.0,
    difficulty: str = "MEDIUM"
) -> dict:
    """Run one teaching turn through the 6-node agent."""
    initial_state = TeachingState(
        student_id=student_id,
        session_id=session_id,
        student_name=student_name,
        grade=grade,
        language=language,
        subject=subject,
        topic=topic,
        student_input=student_input,
        input_type="TEXT",
        detected_level=grade,
        selected_module=None,
        aria_response=None,
        is_correct=None,
        understanding_score=understanding_score,
        difficulty=difficulty,
        conversation_history=conversation_history or [],
        should_simplify=False,
        should_advance=False,
        log_entry=None
    )
    result = aria_agent.invoke(initial_state)
    return {
        "response":           result['aria_response'],
        "understanding_score": result['understanding_score'],
        "should_advance":     result['should_advance'],
        "should_simplify":    result['should_simplify'],
        "difficulty":         result['difficulty'],
        "topic":              result.get('topic'),
        "conversation_history": result['conversation_history']
    }
