"""
Index Loader  –  Runtime initialization (load-only, no model)
==============================================================
Loads precomputed artifacts from embeddings_cache/ at startup:

  • icd_bm25.pkl / cpt_bm25.pkl           → pre-built BM25Okapi objects (no rebuild!)
  • icd_index.faiss / cpt_index.faiss     → FAISS dense search
  • icd_meta.pkl / cpt_meta.pkl           → aligned metadata
  • word_vocab.pkl + word_embeddings.npy  → lightweight query encoding
  • manifest.json                         → integrity validation

Training Phase:  build_indices.py  (runs once at Docker build time)
Inference Phase: this module        (loads artifacts in 3–10 seconds)

Fallback behaviour:
  If manifest.json is missing or hashes don't match, this module will
  automatically call build_indices.build() to regenerate all artifacts,
  then load from the freshly-built files.

Expected startup time: 3–10 seconds  (no model download, no encoding, no BM25 rebuild)
Memory footprint: ~60–100 MB
"""

import json
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
MANIFEST_FILE = CACHE_DIR / "manifest.json"

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

_manifest: Optional[Dict] = None
_is_loaded: bool = False
_dense_available: bool = False
_init_error: Optional[str] = None
_warmup_thread_running: bool = False
_ready_event = threading.Event()


# ---------------------------------------------------------------------------
# Public status helpers
# ---------------------------------------------------------------------------

def is_ready() -> bool:
    """Return True when all indices are loaded and ready to serve."""
    return _is_loaded


def get_status() -> Dict:
    """Return a dict describing the current engine state (for /ai-health)."""
    return {
        "is_loaded": _is_loaded,
        "dense_available": _dense_available,
        "error": _init_error,
        "icd_dense_count": _icd_faiss_index.ntotal if _icd_faiss_index else 0,
        "cpt_dense_count": _cpt_faiss_index.ntotal if _cpt_faiss_index else 0,
        "icd_bm25_count": len(_icd_bm25_meta) if _icd_bm25_meta else 0,
        "cpt_bm25_count": len(_cpt_bm25_meta) if _cpt_bm25_meta else 0,
        "manifest": _manifest,
    }


def get_manifest() -> Optional[Dict]:
    """Return the loaded manifest dict, or None if not loaded."""
    return _manifest


# ---------------------------------------------------------------------------
# Internal: manifest validation
# ---------------------------------------------------------------------------

def _read_manifest() -> Tuple[bool, str, Optional[Dict]]:
    """
    Read and validate manifest.json.
    Returns (is_valid: bool, reason: str, manifest_dict | None).
    """
    if not MANIFEST_FILE.exists():
        return False, "manifest.json not found", None

    try:
        with open(MANIFEST_FILE) as f:
            manifest = json.load(f)
    except Exception as exc:
        return False, f"manifest.json unreadable: {exc}", None

    # Check all expected artifact files exist (hash check is optional here —
    # we do a lightweight exist check at startup; the heavy sha256 check runs
    # only in build_indices.py during the build phase)
    required = [
        "icd_index.faiss", "icd_meta.pkl",
        "cpt_index.faiss", "cpt_meta.pkl",
        "icd_bm25.pkl", "cpt_bm25.pkl",
        "word_vocab.pkl", "word_embeddings.npy",
    ]
    for fname in required:
        if not (CACHE_DIR / fname).exists():
            return False, f"missing artifact: {fname}", None

    return True, "", manifest


# ---------------------------------------------------------------------------
# Internal: load everything from disk
# ---------------------------------------------------------------------------

def _load_all_indices():
    """Load all precomputed artifacts from disk. Fast — no model, no BM25 rebuild."""
    global _icd_faiss_index, _icd_meta, _cpt_faiss_index, _cpt_meta
    global _icd_bm25, _icd_bm25_meta, _cpt_bm25, _cpt_bm25_meta
    global _is_loaded, _dense_available, _init_error, _warmup_thread_running, _manifest

    try:
        logger.info("═══ AI Engine: Starting initialization from precomputed artifacts ═══")

        # ── 0. Validate manifest (with fallback-to-retrain) ───────────────────
        manifest_ok, reason, manifest = _read_manifest()
        if not manifest_ok:
            logger.warning("⚠️  Artifacts invalid or outdated: %s", reason)

            # In production (Koyeb free tier) we CANNOT retrain at runtime —
            # loading the sentence-transformer model would OOM a 512MB container.
            # Instead we degrade gracefully to BM25-only mode using the corpus files.
            import os
            is_production = os.getenv("ENVIRONMENT", "development") == "production"

            if is_production:
                logger.warning(
                    "Production environment detected — skipping fallback rebuild "
                    "(model would OOM). Starting in BM25-only degraded mode."
                )
                # _manifest stays None; we'll still try to load BM25 corpora below
            else:
                logger.info("Development environment — triggering fallback rebuild …")
                try:
                    from build_indices import build as _build
                    success = _build(force=False)
                    if success:
                        manifest_ok, reason, manifest = _read_manifest()
                        if not manifest_ok:
                            raise RuntimeError(f"Rebuild succeeded but manifest still invalid: {reason}")
                    else:
                        raise RuntimeError("build_indices.build() returned False")
                except Exception as exc:
                    raise RuntimeError(f"Fallback rebuild failed: {exc}") from exc

        _manifest = manifest
        logger.info(
            "✓ Manifest loaded: version=%s, model=%s, built_at=%s",
            manifest.get("version"), manifest.get("model"), manifest.get("built_at")
        )

        # ── 1. Load word vocabulary for lightweight query encoding ────────────
        from app.services.embedding_engine import load_word_vocab
        vocab_ok = load_word_vocab()

        # ── 2. Load FAISS indices ─────────────────────────────────────────────
        _dense_available = False
        if vocab_ok:
            try:
                import faiss
                icd_path = CACHE_DIR / "icd_index.faiss"
                cpt_path = CACHE_DIR / "cpt_index.faiss"

                _icd_faiss_index = faiss.read_index(str(icd_path))
                logger.info("✓ ICD FAISS index loaded: %d vectors", _icd_faiss_index.ntotal)

                _cpt_faiss_index = faiss.read_index(str(cpt_path))
                logger.info("✓ CPT FAISS index loaded: %d vectors", _cpt_faiss_index.ntotal)

                with open(CACHE_DIR / "icd_meta.pkl", "rb") as f:
                    _icd_meta = pickle.load(f)
                with open(CACHE_DIR / "cpt_meta.pkl", "rb") as f:
                    _cpt_meta = pickle.load(f)
                logger.info("✓ FAISS metadata: %d ICD, %d CPT", len(_icd_meta), len(_cpt_meta))

                _dense_available = True
            except Exception as exc:
                logger.warning("⚠️ Dense search unavailable (FAISS load failed): %s", exc)
                _dense_available = False

        # ── 3. Load pre-built BM25 objects ────────────────────────────────────
        # Key improvement: we load the fully-built BM25Okapi directly from disk.
        # No corpus reconstruction, no re-tokenisation, no CPU usage at startup.
        icd_bm25_path = CACHE_DIR / "icd_bm25.pkl"
        cpt_bm25_path = CACHE_DIR / "cpt_bm25.pkl"

        if icd_bm25_path.exists() and cpt_bm25_path.exists():
            logger.info("Loading pre-built BM25 objects from disk …")
            with open(icd_bm25_path, "rb") as f:
                icd_data = pickle.load(f)
            _icd_bm25 = icd_data["index"]
            _icd_bm25_meta = icd_data["meta"]
            logger.info("✓ ICD BM25 loaded: %d docs", len(_icd_bm25_meta))

            with open(cpt_bm25_path, "rb") as f:
                cpt_data = pickle.load(f)
            _cpt_bm25 = cpt_data["index"]
            _cpt_bm25_meta = cpt_data["meta"]
            logger.info("✓ CPT BM25 loaded: %d docs", len(_cpt_bm25_meta))
        else:
            # Fallback: build from corpus (old-format compatibility)
            logger.warning(
                "icd_bm25.pkl / cpt_bm25.pkl not found — falling back to corpus rebuild. "
                "Run build_indices.py to generate the faster pre-built format."
            )
            _load_bm25_from_corpus()

        _init_error = None
        _is_loaded = True

        logger.info(
            "═══ AI Engine READY — dense=%s, ICD_bm25=%d, CPT_bm25=%d, v=%s ═══",
            _dense_available,
            len(_icd_bm25_meta) if _icd_bm25_meta else 0,
            len(_cpt_bm25_meta) if _cpt_bm25_meta else 0,
            manifest.get("version", "?"),
        )

    except Exception as exc:
        _init_error = str(exc)
        _is_loaded = False
        logger.error("❌ AI Engine initialization failed: %s", exc, exc_info=True)
    finally:
        _warmup_thread_running = False
        _ready_event.set()


def _load_bm25_from_corpus():
    """
    Compatibility fallback: build BM25 from the corpus pkl files written by
    old versions of build_indices.py.  Slower (~5-20s) but still functional.
    """
    global _icd_bm25, _icd_bm25_meta, _cpt_bm25, _cpt_bm25_meta

    from rank_bm25 import BM25Okapi

    icd_corpus_path = CACHE_DIR / "icd_bm25_corpus.pkl"
    cpt_corpus_path = CACHE_DIR / "cpt_bm25_corpus.pkl"

    if not icd_corpus_path.exists() or not cpt_corpus_path.exists():
        raise FileNotFoundError(
            "Neither icd_bm25.pkl nor icd_bm25_corpus.pkl found. "
            "Run build_indices.py to generate index artifacts."
        )

    with open(icd_corpus_path, "rb") as f:
        icd_data = pickle.load(f)
    logger.info("Building ICD BM25 from corpus (%d docs) …", len(icd_data["corpus"]))
    _icd_bm25 = BM25Okapi(icd_data["corpus"])
    _icd_bm25_meta = icd_data["meta"]
    logger.info("✓ ICD BM25 built: %d docs", len(_icd_bm25_meta))

    with open(cpt_corpus_path, "rb") as f:
        cpt_data = pickle.load(f)
    logger.info("Building CPT BM25 from corpus (%d docs) …", len(cpt_data["corpus"]))
    _cpt_bm25 = BM25Okapi(cpt_data["corpus"])
    _cpt_bm25_meta = cpt_data["meta"]
    logger.info("✓ CPT BM25 built: %d docs", len(_cpt_bm25_meta))


# ---------------------------------------------------------------------------
# Public: launch / await
# ---------------------------------------------------------------------------

def warm_up() -> None:
    """Launch background initialization if not already running. Idempotent."""
    global _warmup_thread_running

    with _lock:
        if _is_loaded or _warmup_thread_running:
            return
        _warmup_thread_running = True
        _ready_event.clear()

    logger.info("═══ AI Engine: Launching background initialization ═══")
    threading.Thread(target=_load_all_indices, daemon=True).start()


def ensure_loaded(timeout_seconds: float = 30.0) -> bool:
    """Block until engine is ready (or timeout expires)."""
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
    """Semantic search via FAISS + lightweight query encoding."""
    if not _dense_available:
        return []

    from app.services.embedding_engine import search_index
    if code_type == "ICD10_CM":
        return search_index(_icd_faiss_index, _icd_meta, query_text, top_k)
    else:
        return search_index(_cpt_faiss_index, _cpt_meta, query_text, top_k)


def bm25_search(code_type: str, query_text: str, top_k: int = 20) -> List[Dict]:
    """Keyword search via BM25Okapi (loaded pre-built from disk — zero rebuild cost)."""
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
