"""
Embedding Engine – Step 2 of the AI Recommendation Engine
===========================================================
Responsibility:
  • Encode code descriptions with a clinical embedding model.
  • Build FAISS IndexFlatIP indices (inner-product on L2-normalised vectors
    is equivalent to cosine similarity, but significantly faster than sklearn).
  • Persist indices + metadata to disk; invalidate cache by dataset hash.
  • Auto-regenerate the entire index when the dataset files change.

Index files (written to  healpay-backend/embeddings_cache/):
  icd_faiss_{hash}.index   – FAISS binary index for sampled ICD codes
  cpt_faiss_{hash}.index   – FAISS binary index for all CPT codes
  icd_meta_{hash}.pkl      – list[dict] metadata aligned to ICD index rows
  cpt_meta_{hash}.pkl      – list[dict] metadata aligned to CPT index rows
"""

import logging
import os
import pickle
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import numpy as np  # always available, safe at top-level
# faiss is imported lazily inside functions – prevents crash if faiss-cpu
# fails to install on memory-constrained hosts (Koyeb free tier)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_DIR = _BACKEND_ROOT / "embeddings_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Model loader (lazy, with fallback)
# ---------------------------------------------------------------------------

_model = None


def get_model():
    """
    Return a loaded SentenceTransformer model.
    Tries the medical-domain model first; falls back to a smaller general model
    if the domain model is unavailable.
    """
    global _model
    if _model is not None:
        return _model

    # Disable TF / Keras imports for speed
    os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
    os.environ.setdefault("USE_TORCH", "1")

    from sentence_transformers import SentenceTransformer

    # Prioritize smaller model for memory-constrained production environments
    models_to_try = [
        "all-MiniLM-L6-v2",                   # Fast general model – Best for 512MB RAM
        "pritamdeka/S-PubMedBert-MS-MARCO",   # Clinical domain – heavy
    ]

    for model_name in models_to_try:
        try:
            logger.info("Loading embedding model: %s", model_name)
            # Use low_cpu_mem_usage if available in the SentenceTransformer version
            _model = SentenceTransformer(model_name)
            logger.info("✓ Model loaded: %s", model_name)
            return _model
        except Exception as exc:
            logger.warning("Could not load %s: %s", model_name, exc)

    raise RuntimeError("No embedding model could be loaded. Check your environment.")


# ---------------------------------------------------------------------------
# FAISS index helpers
# ---------------------------------------------------------------------------

def _normalise(vectors: np.ndarray) -> np.ndarray:
    """L2-normalise rows so inner-product == cosine similarity."""
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1e-10, norms)
    return (vectors / norms).astype(np.float32)


def _encode_batch(
    texts: List[str],
    batch_size: int = 64,
    show_progress: bool = True,
) -> np.ndarray:
    """Encode a list of strings to L2-normalised float32 vectors."""
    model = get_model()
    logger.info("Encoding %d texts (batch_size=%d) …", len(texts), batch_size)
    vectors = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=show_progress,
        convert_to_numpy=True,
        normalize_embeddings=False,   # We normalise ourselves for explicitness
    )
    return _normalise(vectors.astype(np.float32))


def _build_faiss_index(vectors: np.ndarray):
    """Build a flat inner-product FAISS index from pre-normalised vectors."""
    import faiss  # lazy import
    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    logger.info("Built FAISS IndexFlatIP with %d vectors (dim=%d)", index.ntotal, dim)
    return index


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _cache_path(code_type: str, dataset_hash: str, ext: str) -> Path:
    return CACHE_DIR / f"{code_type}_{dataset_hash}.{ext}"


def _save_index(index, code_type: str, dataset_hash: str):
    import faiss  # lazy import
    path = _cache_path(code_type, dataset_hash, "index")
    faiss.write_index(index, str(path))
    logger.info("Saved FAISS index → %s", path.name)


def _load_index(code_type: str, dataset_hash: str) -> Optional[object]:
    import faiss  # lazy import
    path = _cache_path(code_type, dataset_hash, "index")
    if path.exists():
        logger.info("Loading cached FAISS index ← %s", path.name)
        return faiss.read_index(str(path))
    return None


def _save_meta(meta: List[Dict], code_type: str, dataset_hash: str):
    path = _cache_path(code_type, dataset_hash, "pkl")
    with open(path, "wb") as f:
        pickle.dump(meta, f, protocol=pickle.HIGHEST_PROTOCOL)
    logger.info("Saved metadata → %s", path.name)


def _load_meta(code_type: str, dataset_hash: str) -> Optional[List[Dict]]:
    path = _cache_path(code_type, dataset_hash, "pkl")
    if path.exists():
        with open(path, "rb") as f:
            meta = pickle.load(f)
        logger.info("Loaded metadata ← %s (%d records)", path.name, len(meta))
        return meta
    return None


def _stale_cache_exists(code_type: str, dataset_hash: str) -> bool:
    """True if files for this code_type exist but with a DIFFERENT hash."""
    for p in CACHE_DIR.glob(f"{code_type}_*.index"):
        if dataset_hash not in p.name:
            return True
    return False


def _purge_stale_cache(code_type: str, dataset_hash: str):
    """Remove cache files for previous dataset versions."""
    for p in CACHE_DIR.glob(f"{code_type}_*"):
        if dataset_hash not in p.name:
            logger.info("Purging stale cache file: %s", p.name)
            p.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_or_load_index(
    codes: List[Dict],
    code_type: str,          # "icd" or "cpt"
    dataset_hash: str,
    force_rebuild: bool = False,
) -> Tuple[object, List[Dict]]:
    """
    Return (faiss_index, metadata_list) for the given code list.

    • If a valid cached index exists for the current dataset hash, load it.
    • Otherwise encode all texts, build FAISS index, and write to disk.

    Parameters
    ----------
    codes          : list of code dicts (must contain 'search_text' key)
    code_type      : short label used in file names ("icd" or "cpt")
    dataset_hash   : hash from data_pipeline.compute_dataset_hash()
    force_rebuild  : ignore existing cache and rebuild from scratch
    """
    # Purge stale cache files so disk doesn't fill up
    if _stale_cache_exists(code_type, dataset_hash):
        _purge_stale_cache(code_type, dataset_hash)

    if not force_rebuild:
        index = _load_index(code_type, dataset_hash)
        meta = _load_meta(code_type, dataset_hash)
        if index is not None and meta is not None and index.ntotal == len(meta):
            return index, meta

    # Build from scratch
    logger.info(
        "Building %s FAISS index for %d codes (hash=%s) …",
        code_type.upper(),
        len(codes),
        dataset_hash,
    )
    texts = [c["search_text"] for c in codes]
    vectors = _encode_batch(texts)

    index = _build_faiss_index(vectors)
    meta = [
        {k: v for k, v in c.items() if k != "bm25_tokens"}
        for c in codes
    ]

    _save_index(index, code_type, dataset_hash)
    _save_meta(meta, code_type, dataset_hash)

    return index, meta


def search_index(
    index,
    meta: List[Dict],
    query_text: str,
    top_k: int = 20,
) -> List[Dict]:
    """
    Query a FAISS index and return top_k results with similarity scores.

    Returns a list of dicts:
      {code, code_type, short_description, long_description, category,
       search_text, dense_score}
    """
    os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
    os.environ.setdefault("USE_TORCH", "1")

    model = get_model()
    qvec = model.encode([query_text], convert_to_numpy=True, normalize_embeddings=False)
    qvec = _normalise(qvec.astype(np.float32))

    scores, indices = index.search(qvec, min(top_k, index.ntotal))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        rec = dict(meta[idx])
        rec["dense_score"] = float(score)
        results.append(rec)

    return results
