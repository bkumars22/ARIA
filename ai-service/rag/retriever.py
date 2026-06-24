"""ARIA RAG retriever — per-student knowledge retrieval.

retrieve_for_question(student_id, question) — main entry point.
  Looks up the student's ChromaDB collection for relevant textbook chunks
  and past Q&A turns, returning them formatted for LLM injection.

format_student_context(retrieved) — formats results for prompt injection.
"""

from __future__ import annotations

import logging
from typing import Any

from .chroma_store import retrieve

logger = logging.getLogger("rag.retriever")


def retrieve_for_question(
    student_id: str,
    question: str,
    top_k: int = 4,
    prefer_textbook: bool = True,
) -> list[dict[str, Any]]:
    """Retrieve the most relevant chunks for a student's question.

    If the student has uploaded textbook content (prefer_textbook=True),
    textbook chunks are retrieved first; Q&A memory is mixed in after.
    Falls back to a combined search if no textbook chunks score above threshold.
    """
    all_results: list[dict[str, Any]] = []

    if prefer_textbook:
        # Try textbook-specific retrieval first
        textbook_hits = retrieve(student_id=student_id, query=question, top_k=top_k, source_type="textbook")
        if textbook_hits:
            all_results.extend(textbook_hits)

    # Always pull in prior Q&A memory (up to 2 slots)
    qa_hits = retrieve(student_id=student_id, query=question, top_k=2, source_type="qa_memory")
    all_results.extend(qa_hits)

    # If textbook gave nothing, try general search
    if not all_results:
        all_results = retrieve(student_id=student_id, query=question, top_k=top_k)

    # Deduplicate by content prefix and sort by similarity
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for hit in sorted(all_results, key=lambda x: x.get("similarity", 0), reverse=True):
        key = hit["content"][:80]
        if key not in seen:
            seen.add(key)
            unique.append(hit)

    logger.debug("retrieve_for_question(student=%s) → %d chunks", student_id, len(unique))
    return unique[:top_k + 2]


def format_student_context(retrieved: list[dict[str, Any]], question: str = "") -> str:
    """Format retrieved chunks as a context block for the ARIA LLM prompt."""
    if not retrieved:
        return ""

    textbook_chunks = [r for r in retrieved if r.get("metadata", {}).get("source_type") == "textbook"]
    qa_chunks = [r for r in retrieved if r.get("metadata", {}).get("source_type") == "qa_memory"]

    sections: list[str] = []

    if textbook_chunks:
        sections.append("--- RELEVANT TEXTBOOK CONTENT ---")
        for i, chunk in enumerate(textbook_chunks, 1):
            sim = chunk.get("similarity", 0)
            sections.append(f"[{i}] (relevance: {sim:.2f})\n{chunk['content'][:500]}")
        sections.append("--- END TEXTBOOK CONTENT ---")

    if qa_chunks:
        sections.append("\n--- PRIOR LEARNING CONTEXT ---")
        for qa in qa_chunks[:2]:
            sim = qa.get("similarity", 0)
            sections.append(f"(relevance: {sim:.2f})\n{qa['content'][:300]}")
        sections.append("--- END PRIOR CONTEXT ---")

    return "\n".join(sections)
