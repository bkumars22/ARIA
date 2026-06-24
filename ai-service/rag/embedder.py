"""Sentence-transformer embedder for ARIA RAG.

Lazy-loads all-MiniLM-L6-v2 on first call. Falls back to a
SHA-256 deterministic hash embedding when the model is unavailable.

384-dimensional float32 vectors, L2-normalised.
"""

from __future__ import annotations

import hashlib
import logging
import os
from typing import Sequence

import numpy as np

logger = logging.getLogger("rag.embedder")

_EMBED_DIM = 384
_MODEL_NAME = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
_model = None
_model_loaded = False


def _load_model():
    global _model, _model_loaded
    if _model_loaded:
        return _model
    _model_loaded = True
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(_MODEL_NAME)
        logger.info("ARIA embedder: loaded %s", _MODEL_NAME)
    except ImportError:
        logger.warning("sentence-transformers not installed — using hash fallback")
        _model = None
    except Exception as exc:
        logger.warning("Model load failed (%s) — using hash fallback", exc)
        _model = None
    return _model


def _hash_embed(text: str) -> list[float]:
    seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**31)
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(_EMBED_DIM).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec.tolist()


def embed(text: str) -> list[float]:
    if not text or not text.strip():
        return _hash_embed("")
    model = _load_model()
    if model is None:
        return _hash_embed(text)
    try:
        vec = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
        return vec.tolist()
    except Exception as exc:
        logger.warning("embed() failed: %s", exc)
        return _hash_embed(text)


def embed_batch(texts: Sequence[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _load_model()
    if model is None:
        return [_hash_embed(t) for t in texts]
    try:
        vecs = model.encode(list(texts), normalize_embeddings=True, show_progress_bar=False, batch_size=32)
        return [v.tolist() for v in vecs]
    except Exception as exc:
        logger.warning("embed_batch() failed: %s", exc)
        return [_hash_embed(t) for t in texts]
