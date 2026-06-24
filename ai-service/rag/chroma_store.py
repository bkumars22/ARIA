"""ChromaDB-backed per-student knowledge store for ARIA RAG.

Each student gets their own ChromaDB collection keyed by student_id.
Textbook chunks are stored at upload time; every Q&A turn is also stored
so future lessons can reference prior conversations.

Uses persistent storage at ARIA_RAG_DIR (default: ./rag_data).
Falls back gracefully when ChromaDB is not installed.
"""

from __future__ import annotations

import hashlib
import logging
import os
import textwrap
from typing import Any

logger = logging.getLogger("rag.chroma_store")

_RAG_DIR = os.getenv("ARIA_RAG_DIR", "./rag_data")
_EMBED_DIM = 384

# ---------------------------------------------------------------------------
# ChromaDB client — lazy init
# ---------------------------------------------------------------------------
_chroma_client = None


def _get_client():
    global _chroma_client
    if _chroma_client is not None:
        return _chroma_client
    try:
        import chromadb
        os.makedirs(_RAG_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=_RAG_DIR)
        logger.info("ChromaDB client initialised at %s", _RAG_DIR)
    except ImportError:
        logger.warning("chromadb not installed — ARIA RAG unavailable")
        _chroma_client = None
    except Exception as exc:
        logger.warning("ChromaDB init failed: %s", exc)
        _chroma_client = None
    return _chroma_client


def _collection_name(student_id: str) -> str:
    safe = "".join(c if c.isalnum() else "_" for c in student_id)
    return f"student_{safe[:40]}"


def _get_collection(student_id: str):
    client = _get_client()
    if client is None:
        return None
    try:
        return client.get_or_create_collection(
            name=_collection_name(student_id),
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as exc:
        logger.warning("get_collection failed for %s: %s", student_id, exc)
        return None


# ---------------------------------------------------------------------------
# Document operations
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """Split text into overlapping chunks of ~chunk_size characters."""
    text = text.strip()
    if not text:
        return []
    words = text.split()
    chunks: list[str] = []
    step = max(1, chunk_size - overlap)

    # Build chunks by word boundaries
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size // 4]  # ~4 chars/word average
        chunk = " ".join(chunk_words)
        if len(chunk) > 20:
            chunks.append(chunk)
        i += step // 4  # advance by step words
        if not chunk_words:
            break

    # Deduplicate consecutive identical chunks
    seen: set[str] = set()
    unique: list[str] = []
    for c in chunks:
        key = c[:64]
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique or [text[:2000]]


def _doc_id(student_id: str, source_id: str, chunk_idx: int) -> str:
    raw = f"{student_id}:{source_id}:{chunk_idx}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def ingest_document(
    student_id: str,
    text: str,
    source_id: str,
    source_type: str = "textbook",
    metadata: dict[str, Any] | None = None,
) -> int:
    """Chunk and store a document in the student's collection.
    Returns the number of chunks stored, 0 on failure.
    """
    from .embedder import embed_batch

    collection = _get_collection(student_id)
    if collection is None:
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = embed_batch(chunks)
    ids = [_doc_id(student_id, source_id, i) for i in range(len(chunks))]
    meta_list = [
        {**(metadata or {}), "source_type": source_type, "source_id": source_id, "chunk": i}
        for i in range(len(chunks))
    ]

    try:
        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=meta_list,
        )
        logger.info("Ingested %d chunks for student %s (source=%s)", len(chunks), student_id, source_id)
        return len(chunks)
    except Exception as exc:
        logger.warning("ingest_document failed: %s", exc)
        return 0


def save_qa_turn(
    student_id: str,
    question: str,
    answer: str,
    subject: str = "",
    language: str = "English",
) -> bool:
    """Store a Q&A exchange as a memory chunk for the student."""
    from .embedder import embed

    collection = _get_collection(student_id)
    if collection is None:
        return False

    content = f"Q: {question}\nA: {answer}"
    doc_id = _doc_id(student_id, f"qa_{hashlib.sha256(content.encode()).hexdigest()[:8]}", 0)
    embedding = embed(content)

    try:
        collection.upsert(
            ids=[doc_id],
            documents=[content],
            embeddings=[embedding],
            metadatas=[{"source_type": "qa_memory", "subject": subject, "language": language}],
        )
        return True
    except Exception as exc:
        logger.warning("save_qa_turn failed: %s", exc)
        return False


def retrieve(
    student_id: str,
    query: str,
    top_k: int = 4,
    source_type: str | None = None,
) -> list[dict[str, Any]]:
    """Retrieve the most relevant chunks for a query from the student's collection."""
    from .embedder import embed

    collection = _get_collection(student_id)
    if collection is None:
        return []

    query_embedding = embed(query)
    where = {"source_type": source_type} if source_type else None

    try:
        kwargs: dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, max(1, collection.count())),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        result = collection.query(**kwargs)
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        dists = result.get("distances", [[]])[0]

        return [
            {
                "content": doc,
                "metadata": meta,
                "similarity": round(1.0 - dist, 4),
            }
            for doc, meta, dist in zip(docs, metas, dists)
            if (1.0 - dist) >= 0.2
        ]
    except Exception as exc:
        logger.warning("retrieve failed for %s: %s", student_id, exc)
        return []


def list_sources(student_id: str) -> list[dict[str, Any]]:
    """List all distinct source documents for a student."""
    collection = _get_collection(student_id)
    if collection is None:
        return []
    try:
        result = collection.get(include=["metadatas"])
        metas = result.get("metadatas", [])
        seen: dict[str, dict] = {}
        for m in metas:
            sid = m.get("source_id", "unknown")
            if sid not in seen:
                seen[sid] = {"source_id": sid, "source_type": m.get("source_type", ""), "chunks": 0}
            seen[sid]["chunks"] += 1
        return list(seen.values())
    except Exception as exc:
        logger.warning("list_sources failed: %s", exc)
        return []
