"""
Index Loader – Step 3 of the AI Recommendation Engine
=======================================================
Responsibility:
  • Single source of truth for all loaded indices.
  • Thread-safe background initialization.
  • Exposes both the FAISS dense index and the BM25 lexical index.
  • Provides a clean search interface used by recommendation_service.py.
"""

import logging
import threading
from typing import Dict, List, Optional, Tuple

from app.services.data_pipeline import (
    load_all_codes,
    compute_dataset_hash,
    tokenize_query,
)
from app.services.embedding_engine import build_or_load_index, search_index, get_model

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton state
# ---------------------------------------------------------------------------
_lock = threading.Lock()

# These are typed as Optional[Any] because faiss is imported lazily
_icd_faiss_index = None
_icd_faiss_meta: Optional[List[Dict]] = None

_cpt_faiss_index = None
_cpt_faiss_meta: Optional[List[Dict]] = None

# BM25 covers ALL codes
_icd_bm25 = None
_icd_bm25_meta: Optional[List[Dict]] = None

_cpt_bm25 = None
_cpt_bm25_meta: Optional[List[Dict]] = None

_is_loaded = False
_dataset_hash: str = ""
_dense_available = False

# Thread-safe event to signal when initialization is COMPLETE
_ready_event = threading.Event()

# Flag to prevent launching duplicate background threads
_warmup_thread_running = False


def is_ready() -> bool:
    """Return True when the AI engine has finished loading.

    IMPORTANT: Always use this function — never import ``_is_loaded`` directly.
    Python's ``from module import var`` copies the *value* at import time, so
    a direct import of ``_is_loaded`` will always be ``False`` even after the
    background thread sets it to ``True``.
    """
    return _is_loaded


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_bm25_index(
    codes: List[Dict],
    label: str,
) -> Tuple:
    """Build a BM25Okapi index and return optimized metadata."""
    from rank_bm25 import BM25Okapi  # lazy import – safe if package missing
    corpus = [c["bm25_tokens"] for c in codes]
    corpus = [toks if toks else ["__empty__"] for toks in corpus]
    logger.info("Building BM25 index for %d %s codes …", len(corpus), label)
    bm25 = BM25Okapi(corpus)
    
    meta = [
        {k: v for k, v in c.items() if k not in ("bm25_tokens", "search_text")} 
        for c in codes
    ]
    return bm25, meta

def _full_background_warmup(force_rebuild: bool):
    """Heavy lifted data loading and indexing performed in a background thread."""
    global _icd_faiss_index, _icd_faiss_meta, _cpt_faiss_index, _cpt_faiss_meta
    global _icd_bm25, _icd_bm25_meta, _cpt_bm25, _cpt_bm25_meta
    global _is_loaded, _dense_available, _dataset_hash, _warmup_thread_running
    
    try:
        logger.info("Background AI: Starting full initialization...")
        current_hash = compute_dataset_hash()
        
        # 1. Load raw data
        all_icd, sampled_icd, all_cpt, _ = load_all_codes()
        
        # 2. Build BM25 indices
        logger.info("Background AI: Building BM25 keyword indices...")
        _icd_bm25, _icd_bm25_meta = _build_bm25_index(all_icd, "ICD")
        _cpt_bm25, _cpt_bm25_meta = _build_bm25_index(all_cpt, "CPT")
        
        # 3. Build Dense FAISS indices
        logger.info("Background AI: Building Dense FAISS indices...")
        try:
            # faiss is imported inside build_or_load_index
            _icd_faiss_index, _icd_faiss_meta = build_or_load_index(
                sampled_icd, "icd", current_hash, force_rebuild
            )
            _cpt_faiss_index, _cpt_faiss_meta = build_or_load_index(
                all_cpt, "cpt", current_hash, force_rebuild
            )
            get_model()
            _dense_available = True
        except Exception as e:
            logger.warning("⚠️ Background AI: Semantic search failed (Memory/Model): %s", e)
            _dense_available = False

        _dataset_hash = current_hash
        _is_loaded = True
        logger.info("═══ Background AI: Engine is now fully READY. ═══")
    except Exception as e:
        logger.error("❌ Background AI: Critical failure: %s", e)
        _is_loaded = False
    finally:
        _warmup_thread_running = False
        _ready_event.set()

def warm_up(force_rebuild: bool = False) -> None:
    """Triggers the AI engine warm-up in the background.

    Uses _is_loaded and _warmup_thread_running to avoid duplicate threads.
    Safe to call from multiple Gunicorn workers – each process has its own
    state and will independently initialise its in-process indices.
    """
    global _warmup_thread_running

    with _lock:
        if _is_loaded or _warmup_thread_running:
            return
        _warmup_thread_running = True
        _ready_event.clear()

    logger.info("═══ AI Engine: Triggering background initialization ═══")
    threading.Thread(
        target=_full_background_warmup,
        args=(force_rebuild,),
        daemon=True
    ).start()

def ensure_loaded(timeout_seconds: float = 120.0) -> bool:
    """Wait for background initialization to complete.
    
    Default timeout increased to 120 s to handle cold-start model downloads
    on memory-constrained hosts like Koyeb free tier.
    """
    if _is_loaded:
        return True
    warm_up()
    logger.info("AI Engine: Search request waiting for initialization...")
    return _ready_event.wait(timeout=timeout_seconds)

# ---------------------------------------------------------------------------
# Public search functions
# ---------------------------------------------------------------------------

def dense_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """Semantic search via FAISS."""
    if not ensure_loaded():
        raise ValueError("AI Engine is still initializing. Please try again in a few seconds.")

    if not _dense_available:
        return []

    if code_type == "ICD10_CM":
        return search_index(_icd_faiss_index, _icd_faiss_meta, query_text, top_k)
    else:
        return search_index(_cpt_faiss_index, _cpt_faiss_meta, query_text, top_k)

def bm25_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """Lexical keyword search via BM25."""
    if not ensure_loaded():
        raise ValueError("AI Engine is still initializing. Please try again in a few seconds.")

    tokens = tokenize_query(query_text)
    if not tokens:
        return []

    if code_type == "ICD10_CM":
        bm25, meta = _icd_bm25, _icd_bm25_meta
    else:
        bm25, meta = _cpt_bm25, _cpt_bm25_meta

    if bm25 is None: return []

    scores = bm25.get_scores(tokens)
    max_score = float(scores.max()) if scores.max() > 0 else 1.0
    norm_scores = (scores / max_score).tolist()

    top_indices = sorted(range(len(norm_scores)), key=lambda i: norm_scores[i], reverse=True)[:top_k]

    results = []
    for idx in top_indices:
        if norm_scores[idx] <= 0: break
        rec = dict(meta[idx])
        rec["bm25_score"] = norm_scores[idx]
        results.append(rec)
    return results

def get_status() -> Dict:
    """Return a summary of the loaded indices (used by health-check / debug)."""
    return {
        "is_loaded": _is_loaded,
        "dense_available": _dense_available,
        "dataset_hash": _dataset_hash,
        "icd_dense_count": _icd_faiss_index.ntotal if _icd_faiss_index else 0,
        "cpt_dense_count": _cpt_faiss_index.ntotal if _cpt_faiss_index else 0,
        "icd_bm25_count": len(_icd_bm25_meta) if _icd_bm25_meta else 0,
        "cpt_bm25_count": len(_cpt_bm25_meta) if _cpt_bm25_meta else 0,
    }
