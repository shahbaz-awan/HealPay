"""
Index Loader – Step 3 of the AI Recommendation Engine
=======================================================
Responsibility:
  • Single source of truth for all loaded indices.
  • Thread-safe lazy initialisation (first API call triggers warm-up).
  • Exposes both the FAISS dense index and the BM25 lexical index.
  • Provides a clean search interface used by recommendation_service.py.

Architecture note
-----------------
We maintain TWO search systems:

  1. Dense (FAISS)  – semantic similarity on ~5 000 ICD + ~689 CPT embeddings.
  2. Lexical (BM25) – keyword retrieval on ALL ~71 704 ICD + ~689 CPT codes.

Results from both are combined via a weighted hybrid score in the
RecommendationService (Step 4).
"""

import logging
import threading
from typing import Dict, List, Optional, Tuple

import faiss
from rank_bm25 import BM25Okapi

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

_icd_faiss_index: Optional[faiss.IndexFlatIP] = None
_icd_faiss_meta: Optional[List[Dict]] = None

_cpt_faiss_index: Optional[faiss.IndexFlatIP] = None
_cpt_faiss_meta: Optional[List[Dict]] = None

# BM25 covers ALL codes (not just the embeddings sample)
_icd_bm25: Optional[BM25Okapi] = None
_icd_bm25_meta: Optional[List[Dict]] = None

_cpt_bm25: Optional[BM25Okapi] = None
_cpt_bm25_meta: Optional[List[Dict]] = None

_dataset_hash: str = ""
_dense_available = False  # Track if semantic search is actually ready


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_bm25_index(
    codes: List[Dict],
    label: str,
) -> Tuple[BM25Okapi, List[Dict]]:
    """Build a BM25Okapi index from the bm25_tokens field of each code dict."""
    corpus = [c["bm25_tokens"] for c in codes]
    # Replace empty token lists with a placeholder so BM25Okapi doesn't crash
    corpus = [toks if toks else ["__empty__"] for toks in corpus]
    logger.info("Building BM25 index for %d %s codes …", len(corpus), label)
    bm25 = BM25Okapi(corpus)
    meta = [{k: v for k, v in c.items() if k != "bm25_tokens"} for c in codes]
    return bm25, meta


# ---------------------------------------------------------------------------
# Public warm-up function  (called once at startup from main.py lifespan)
# ---------------------------------------------------------------------------

def warm_up(force_rebuild: bool = False) -> None:
    """
    Load (or build) all indices.  Safe to call multiple times – re-entrant
    guard ensures work is done only once unless force_rebuild=True.
    """
    global _icd_faiss_index, _icd_faiss_meta
    global _cpt_faiss_index, _cpt_faiss_meta
    global _icd_bm25, _icd_bm25_meta
    global _cpt_bm25, _cpt_bm25_meta
    global _is_loaded, _dataset_hash

    with _lock:
        if _is_loaded and not force_rebuild:
            return

        logger.info("═══ Index Loader: warm-up started ═══")

        # 1. Compute current dataset hash
        current_hash = compute_dataset_hash()
        logger.info("Dataset hash: %s", current_hash)

        # 2. Load raw codes from CSV
        all_icd, sampled_icd, all_cpt, _ = load_all_codes()

        # 3. Build / load FAISS indices (Heavy - might fail on low RAM)
        logger.info("--- Dense index initialization ---")
        try:
            _icd_faiss_index, _icd_faiss_meta = build_or_load_index(
                sampled_icd, "icd", current_hash, force_rebuild
            )
            _cpt_faiss_index, _cpt_faiss_meta = build_or_load_index(
                all_cpt, "cpt", current_hash, force_rebuild
            )
            
            # Pre-load the embedding model into memory
            logger.info("Pre-loading embedding model into memory …")
            get_model()
            _dense_available = True
            logger.info("✓ Semantic search (Dense) is ready.")
        except Exception as e:
            logger.warning("⚠️ Low-Memory detected or model failure. Semantic search disabled: %s", e)
            _dense_available = False

        # 4. Build BM25 indices (fast, no model required)
        logger.info("--- ICD BM25 index ---")
        _icd_bm25, _icd_bm25_meta = _build_bm25_index(all_icd, "ICD")

        logger.info("--- CPT BM25 index ---")
        _cpt_bm25, _cpt_bm25_meta = _build_bm25_index(all_cpt, "CPT")

        _dataset_hash = current_hash
        _is_loaded = True

        logger.info(
            "═══ Index Loader: ready  "
            "(ICD dense=%d  CPT dense=%d  ICD bm25=%d  CPT bm25=%d) ═══",
            _icd_faiss_index.ntotal if _icd_faiss_index else 0,
            _cpt_faiss_index.ntotal if _cpt_faiss_index else 0,
            len(_icd_bm25_meta) if _icd_bm25_meta else 0,
            len(_cpt_bm25_meta) if _cpt_bm25_meta else 0,
        )


def ensure_loaded() -> None:
    """Lazily warm-up: called at query time if startup warm-up was skipped."""
    if not _is_loaded:
        warm_up()


# ---------------------------------------------------------------------------
# Public search functions
# ---------------------------------------------------------------------------

def dense_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """
    Semantic search via FAISS.

    Parameters
    ----------
    code_type  : "ICD10_CM" or "CPT"
    query_text : raw (pre-cleaned) clinical text
    top_k      : candidate pool size before hybrid re-ranking

    Returns a list of result dicts with 'dense_score' field.
    """
    ensure_loaded()
    if not _dense_available:
        return []

    if code_type == "ICD10_CM":
        return search_index(_icd_faiss_index, _icd_faiss_meta, query_text, top_k)
    else:
        return search_index(_cpt_faiss_index, _cpt_faiss_meta, query_text, top_k)


def bm25_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """
    Lexical keyword search via BM25.

    Returns a list of result dicts sorted by BM25 score descending,
    with 'bm25_score' field (normalised to [0, 1]).
    """
    ensure_loaded()

    tokens = tokenize_query(query_text)
    if not tokens:
        return []

    if code_type == "ICD10_CM":
        bm25, meta = _icd_bm25, _icd_bm25_meta
    else:
        bm25, meta = _cpt_bm25, _cpt_bm25_meta

    scores = bm25.get_scores(tokens)          # numpy array, length = len(meta)

    # Normalise to [0, 1] so it is on the same scale as dense cosine scores
    max_score = float(scores.max()) if scores.max() > 0 else 1.0
    norm_scores = (scores / max_score).tolist()

    # Pick top_k by normalised score
    top_indices = sorted(
        range(len(norm_scores)), key=lambda i: norm_scores[i], reverse=True
    )[:top_k]

    results = []
    for idx in top_indices:
        if norm_scores[idx] <= 0:
            break
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
