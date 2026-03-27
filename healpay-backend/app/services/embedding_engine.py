"""
Embedding Engine  –  Runtime-only module (NO model loading)
============================================================
At runtime this module ONLY uses precomputed artifacts:
  - word_vocab.pkl          : dict: token_str → index
  - word_embeddings.npy     : float32 [vocab_size, 384]
  - icd_index.faiss / cpt_index.faiss  (loaded by index_loader)

Query encoding is done via lightweight mean-pooling over precomputed
token vectors. No SentenceTransformer, no torch, no network calls.

The model (SentenceTransformer) is ONLY used in build_indices.py at
Docker build time.
"""

import logging
import pickle
from pathlib import Path
from typing import List, Dict, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths  (same directory as build_indices.py output)
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_DIR = _BACKEND_ROOT / "embeddings_cache"

# ---------------------------------------------------------------------------
# Precomputed vocabulary (loaded once at init, ~15MB)
# ---------------------------------------------------------------------------
_word_vocab: Optional[Dict[str, int]] = None
_word_embeddings: Optional[np.ndarray] = None  # shape: [vocab_size, 384]


def load_word_vocab() -> bool:
    """Load precomputed word vocabulary and embedding matrix.

    Returns True on success, False if files are missing (still works with
    BM25 fallback — dense search will be unavailable).
    """
    global _word_vocab, _word_embeddings

    vocab_path = CACHE_DIR / "word_vocab.pkl"
    emb_path = CACHE_DIR / "word_embeddings.npy"

    if not vocab_path.exists() or not emb_path.exists():
        logger.warning(
            "Word vocab files not found — dense query encoding unavailable. "
            "Run build_indices.py to generate them."
        )
        return False

    try:
        with open(vocab_path, "rb") as f:
            _word_vocab = pickle.load(f)
        _word_embeddings = np.load(str(emb_path))
        logger.info(
            "✓ Word vocab loaded: %d tokens, embedding dim=%d",
            len(_word_vocab),
            _word_embeddings.shape[1],
        )
        return True
    except Exception as exc:
        logger.error("Failed to load word vocab: %s", exc)
        return False


def encode_query_lightweight(query_text: str) -> Optional[np.ndarray]:
    """Encode a query string into a 384-dim float32 vector.

    Uses mean-pooling over precomputed token embedding vectors.
    No model loading, no network calls — pure numpy.

    Returns None if vocab not loaded (callers should fall back to BM25).
    """
    if _word_vocab is None or _word_embeddings is None:
        return None

    # Simple whitespace + punctuation tokenization matching data_pipeline
    import re
    tokens = re.findall(r"[a-z]+", query_text.lower())

    indices = [_word_vocab[t] for t in tokens if t in _word_vocab]
    if not indices:
        return None

    vecs = _word_embeddings[indices]          # [n_found_tokens, 384]
    mean_vec = vecs.mean(axis=0).astype(np.float32)

    # L2 normalise so inner-product == cosine similarity
    norm = np.linalg.norm(mean_vec)
    if norm < 1e-10:
        return None
    return (mean_vec / norm).reshape(1, -1)  # shape: [1, 384]


# ---------------------------------------------------------------------------
# FAISS search  (index is loaded by index_loader, passed in as argument)
# ---------------------------------------------------------------------------

def search_index(
    index,          # faiss.Index — passed from index_loader
    meta: List[Dict],
    query_text: str,
    top_k: int = 20,
) -> List[Dict]:
    """Query a preloaded FAISS index.  Returns [] if query encoding fails."""
    query_vec = encode_query_lightweight(query_text)
    if query_vec is None:
        logger.debug("encode_query_lightweight returned None — dense search skipped")
        return []

    try:
        import faiss  # lazy import — avoids crash if faiss-cpu not installed
        scores, indices = index.search(query_vec, min(top_k, index.ntotal))
    except Exception as exc:
        logger.warning("FAISS search error: %s", exc)
        return []

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        rec = dict(meta[idx])
        rec["dense_score"] = float(score)
        results.append(rec)
    return results
