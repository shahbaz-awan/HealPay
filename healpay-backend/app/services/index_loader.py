"""
Index Loader  –  Runtime initialization (load-only, no model)
==============================================================
Loads precomputed artifacts from embeddings_cache/ at startup:
  • icd_index.faiss / cpt_index.faiss   → FAISS dense search
  • icd_meta.pkl / cpt_meta.pkl         → aligned metadata
  • icd_bm25_corpus.pkl / cpt_bm25_corpus.pkl → BM25 keyword search
  • word_vocab.pkl + word_embeddings.npy → lightweight query encoding

Expected startup time: 3–10 seconds  (no model download, no encoding)
Memory footprint: ~60–100MB

The model (SentenceTransformer) is NEVER loaded here.
"""

import logging
import pickle
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_DIR = _BACKEND_ROOT / "embeddings_cache"

# ---------------------------------------------------------------------------
# Singleton state
# ---------------------------------------------------------------------------
_lock = threading.Lock()

_icd_faiss_index = None
_icd_meta: Optional[List[Dict]] = None

_cpt_faiss_index = None
_cpt_meta: Optional[List[Dict]] = None

_icd_bm25 = None
_icd_bm25_meta: Optional[List[Dict]] = None

_cpt_bm25 = None
_cpt_bm25_meta: Optional[List[Dict]] = None

_is_loaded: bool = False
_dense_available: bool = False
_init_error: Optional[str] = None          # surfaced via /ai-health endpoint
_warmup_thread_running: bool = False
_ready_event = threading.Event()


# ---------------------------------------------------------------------------
# Public status helpers
# ---------------------------------------------------------------------------

def is_ready() -> bool:
    """Return True when all indices are loaded and ready to serve."""
    return _is_loaded


def get_status() -> Dict:
    """Return a dict describing the current engine state.
    Used by the /ai-health endpoint and internal diagnostics.
    """
    return {
        "is_loaded": _is_loaded,
        "dense_available": _dense_available,
        "error": _init_error,
        "icd_dense_count": _icd_faiss_index.ntotal if _icd_faiss_index else 0,
        "cpt_dense_count": _cpt_faiss_index.ntotal if _cpt_faiss_index else 0,
        "icd_bm25_count": len(_icd_bm25_meta) if _icd_bm25_meta else 0,
        "cpt_bm25_count": len(_cpt_bm25_meta) if _cpt_bm25_meta else 0,
    }


# ---------------------------------------------------------------------------
# Internal: BM25 index builder (fast — no model, just text processing)
# ---------------------------------------------------------------------------

def _build_bm25(corpus: List[List[str]], label: str):
    from rank_bm25 import BM25Okapi  # lazy import
    logger.info("Building BM25 index for %d %s codes …", len(corpus), label)
    return BM25Okapi(corpus)


# ---------------------------------------------------------------------------
# Internal: background initialization
# ---------------------------------------------------------------------------

def _load_all_indices():
    """Load all precomputed artifacts from disk. Fast (no model, no encoding)."""
    global _icd_faiss_index, _icd_meta, _cpt_faiss_index, _cpt_meta
    global _icd_bm25, _icd_bm25_meta, _cpt_bm25, _cpt_bm25_meta
    global _is_loaded, _dense_available, _init_error, _warmup_thread_running

    try:
        logger.info("═══ AI Engine: Starting initialization from precomputed files ═══")

        # ── 1. Load word vocabulary for lightweight query encoding ─────────────
        from app.services.embedding_engine import load_word_vocab
        vocab_ok = load_word_vocab()

        # ── 2. Load FAISS indices ──────────────────────────────────────────────
        _dense_available = False
        if vocab_ok:
            try:
                import faiss  # lazy import
                icd_path = CACHE_DIR / "icd_index.faiss"
                cpt_path = CACHE_DIR / "cpt_index.faiss"

                if not icd_path.exists() or not cpt_path.exists():
                    raise FileNotFoundError(
                        f"FAISS index files missing in {CACHE_DIR}. "
                        "Run build_indices.py to generate them."
                    )

                _icd_faiss_index = faiss.read_index(str(icd_path))
                logger.info("✓ ICD FAISS index loaded: %d vectors", _icd_faiss_index.ntotal)

                _cpt_faiss_index = faiss.read_index(str(cpt_path))
                logger.info("✓ CPT FAISS index loaded: %d vectors", _cpt_faiss_index.ntotal)

                _dense_available = True
            except Exception as exc:
                logger.warning("⚠️ Dense search unavailable (FAISS load failed): %s", exc)
                _dense_available = False

        # ── 3. Load metadata ───────────────────────────────────────────────────
        if _dense_available:
            with open(CACHE_DIR / "icd_meta.pkl", "rb") as f:
                _icd_meta = pickle.load(f)
            with open(CACHE_DIR / "cpt_meta.pkl", "rb") as f:
                _cpt_meta = pickle.load(f)
            logger.info("✓ Metadata loaded: %d ICD, %d CPT", len(_icd_meta), len(_cpt_meta))

        # ── 4. Load BM25 corpora and build indices ─────────────────────────────
        icd_bm25_path = CACHE_DIR / "icd_bm25_corpus.pkl"
        cpt_bm25_path = CACHE_DIR / "cpt_bm25_corpus.pkl"

        if not icd_bm25_path.exists() or not cpt_bm25_path.exists():
            raise FileNotFoundError(
                "BM25 corpus files missing. Run build_indices.py."
            )

        with open(icd_bm25_path, "rb") as f:
            icd_data = pickle.load(f)
        _icd_bm25 = _build_bm25(icd_data["corpus"], "ICD")
        _icd_bm25_meta = icd_data["meta"]
        logger.info("✓ ICD BM25 index built: %d codes", len(_icd_bm25_meta))

        with open(cpt_bm25_path, "rb") as f:
            cpt_data = pickle.load(f)
        _cpt_bm25 = _build_bm25(cpt_data["corpus"], "CPT")
        _cpt_bm25_meta = cpt_data["meta"]
        logger.info("✓ CPT BM25 index built: %d codes", len(_cpt_bm25_meta))

        _init_error = None
        _is_loaded = True

        logger.info(
            "═══ AI Engine READY — dense=%s, ICD_bm25=%d, CPT_bm25=%d ═══",
            _dense_available,
            len(_icd_bm25_meta),
            len(_cpt_bm25_meta),
        )

    except Exception as exc:
        _init_error = str(exc)
        _is_loaded = False
        logger.error("❌ AI Engine initialization failed: %s", exc)
    finally:
        _warmup_thread_running = False
        _ready_event.set()


# ---------------------------------------------------------------------------
# Public: launch / await
# ---------------------------------------------------------------------------

def warm_up() -> None:
    """Launch background initialization if not already running.
    Safe to call multiple times — idempotent.
    """
    global _warmup_thread_running

    with _lock:
        if _is_loaded or _warmup_thread_running:
            return
        _warmup_thread_running = True
        _ready_event.clear()

    logger.info("═══ AI Engine: Launching background initialization ═══")
    threading.Thread(target=_load_all_indices, daemon=True).start()


def ensure_loaded(timeout_seconds: float = 30.0) -> bool:
    """Block until engine is ready (or timeout).
    With precomputed indices, loading takes 3–10 seconds — 30s is generous.
    """
    if _is_loaded:
        return True
    warm_up()
    return _ready_event.wait(timeout=timeout_seconds)


# ---------------------------------------------------------------------------
# Public search functions
# ---------------------------------------------------------------------------

def _tokenize(text: str) -> List[str]:
    """Simple tokenizer matching the BM25 corpus tokenization."""
    import re
    return re.findall(r"[a-z]+", text.lower())


def dense_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """Semantic search via FAISS + lightweight query encoding.
    Returns [] immediately if dense search is unavailable (BM25 fallback kicks in).
    """
    if not _dense_available:
        return []

    from app.services.embedding_engine import search_index
    if code_type == "ICD10_CM":
        return search_index(_icd_faiss_index, _icd_meta, query_text, top_k)
    else:
        return search_index(_cpt_faiss_index, _cpt_meta, query_text, top_k)


def bm25_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """Keyword search via BM25Okapi."""
    tokens = _tokenize(query_text)
    if not tokens:
        return []

    if code_type == "ICD10_CM":
        bm25, meta = _icd_bm25, _icd_bm25_meta
    else:
        bm25, meta = _cpt_bm25, _cpt_bm25_meta

    if bm25 is None or meta is None:
        return []

    scores = bm25.get_scores(tokens)
    max_score = float(scores.max()) if scores.max() > 0 else 1.0
    norm_scores = (scores / max_score).tolist()

    top_indices = sorted(
        range(len(norm_scores)),
        key=lambda i: norm_scores[i],
        reverse=True,
    )[:top_k]

    results = []
    for idx in top_indices:
        if norm_scores[idx] <= 0:
            break
        rec = dict(meta[idx])
        rec["bm25_score"] = norm_scores[idx]
        results.append(rec)
    return results
