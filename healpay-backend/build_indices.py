"""
build_indices.py  –  Offline pre-computation script for HealPay AI Engine
=========================================================================
Run ONCE at Docker build time (or locally before pushing).
NEVER run at application startup.

What this script produces (saved to embeddings_cache/):
  icd_index.faiss        – FAISS IndexFlatIP for top-5k ICD-10 codes
  icd_meta.pkl           – aligned metadata list for ICD index rows
  cpt_index.faiss        – FAISS IndexFlatIP for CPT codes
  cpt_meta.pkl           – aligned metadata list for CPT index rows
  icd_bm25_corpus.pkl    – tokenized BM25 corpus for ICD codes (ALL codes)
  cpt_bm25_corpus.pkl    – tokenized BM25 corpus for CPT codes (ALL codes)
  word_vocab.pkl         – dict: token_str → int index
  word_embeddings.npy    – float32 array [vocab_size, 384] for lightweight
                           query encoding at runtime (no model needed)

Usage:
  python build_indices.py --force        # always rebuild
  python build_indices.py               # skip if files already exist
"""

import sys
import os
import logging
import pickle
import argparse
from pathlib import Path

# ── Bootstrap sys.path so app modules are importable ─────────────────────────
BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

# Disable TF imports for faster startup and lower memory during build
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TORCH", "1")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("build_indices")

# ── Deterministic output filenames (no hash — always loadable at runtime) ────
INDEX_FILES = [
    "icd_index.faiss",
    "icd_meta.pkl",
    "cpt_index.faiss",
    "cpt_meta.pkl",
    "icd_bm25_corpus.pkl",
    "cpt_bm25_corpus.pkl",
    "word_vocab.pkl",
    "word_embeddings.npy",
]


def _all_files_exist(cache_dir: Path) -> bool:
    return all((cache_dir / f).exists() for f in INDEX_FILES)


def build(force: bool = False):
    import numpy as np

    from app.core.config import settings
    from app.services.data_pipeline import load_all_codes, tokenize_query

    cache_dir = BACKEND_ROOT / settings.EMBEDDINGS_CACHE_DIR
    cache_dir.mkdir(parents=True, exist_ok=True)

    if not force and _all_files_exist(cache_dir):
        logger.info("✅ All index files already exist — skipping build. Use --force to rebuild.")
        return

    logger.info("=" * 60)
    logger.info("🚀  HealPay AI Index Build  –  %s", settings.EMBEDDING_MODEL)
    logger.info("=" * 60)

    # ── 1. Load datasets ──────────────────────────────────────────────────────
    logger.info("Step 1/5 — Loading datasets …")
    all_icd, sampled_icd, all_cpt, _ = load_all_codes()
    logger.info("  ICD: %d total, %d sampled for dense index", len(all_icd), len(sampled_icd))
    logger.info("  CPT: %d codes", len(all_cpt))

    # ── 2. Build BM25 tokenized corpora (uses ALL codes) ─────────────────────
    logger.info("Step 2/5 — Building BM25 corpora …")
    icd_bm25_corpus = [
        (c.get("bm25_tokens") or ["__empty__"])
        for c in all_icd
    ]
    cpt_bm25_corpus = [
        (c.get("bm25_tokens") or ["__empty__"])
        for c in all_cpt
    ]
    with open(cache_dir / "icd_bm25_corpus.pkl", "wb") as f:
        pickle.dump({"corpus": icd_bm25_corpus, "meta": [
            {k: v for k, v in c.items() if k not in ("bm25_tokens", "search_text")}
            for c in all_icd
        ]}, f, protocol=pickle.HIGHEST_PROTOCOL)
    with open(cache_dir / "cpt_bm25_corpus.pkl", "wb") as f:
        pickle.dump({"corpus": cpt_bm25_corpus, "meta": [
            {k: v for k, v in c.items() if k not in ("bm25_tokens", "search_text")}
            for c in all_cpt
        ]}, f, protocol=pickle.HIGHEST_PROTOCOL)
    logger.info("  ✓ BM25 corpora saved")

    # ── 3. Load embedding model (ONLY time model is loaded) ──────────────────
    logger.info("Step 3/5 — Loading %s …", settings.EMBEDDING_MODEL)
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
    logger.info("  ✓ Model loaded")

    def _encode(texts, label):
        logger.info("  Encoding %d %s descriptions …", len(texts), label)
        vecs = model.encode(
            texts,
            batch_size=128,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True,   # L2-normalise → cosine via inner product
        )
        return vecs.astype(np.float32)

    # ── 4. Build FAISS indices ────────────────────────────────────────────────
    logger.info("Step 4/5 — Encoding code descriptions and building FAISS indices …")
    import faiss

    for code_type, codes in [("icd", sampled_icd), ("cpt", all_cpt)]:
        texts = [c["search_text"] for c in codes]
        vecs = _encode(texts, code_type.upper())

        dim = vecs.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(vecs)
        faiss.write_index(index, str(cache_dir / f"{code_type}_index.faiss"))
        logger.info("  ✓ %s FAISS index: %d vectors, dim=%d", code_type.upper(), index.ntotal, dim)

        meta = [{k: v for k, v in c.items() if k not in ("bm25_tokens",)} for c in codes]
        with open(cache_dir / f"{code_type}_meta.pkl", "wb") as f:
            pickle.dump(meta, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info("  ✓ %s metadata saved (%d records)", code_type.upper(), len(meta))

    # ── 5. Build word embedding vocabulary for lightweight query encoding ─────
    # Extracts unique medical tokens from the corpus and encodes each one
    # individually. At runtime, queries are encoded by mean-pooling over these
    # token embeddings — NO model loading needed.
    logger.info("Step 5/5 — Building word embedding vocabulary for runtime query encoding …")

    # Collect unique tokens from all code descriptions
    all_tokens: set = set()
    for codes in [all_icd, all_cpt]:
        for code in codes:
            tokens = code.get("bm25_tokens") or []
            all_tokens.update(tokens)

    # Also add common medical query words that may not be in code descriptions
    ALWAYS_INCLUDE = {
        "pain", "chest", "abdominal", "fever", "cough", "dyspnea", "shortness",
        "breath", "headache", "nausea", "vomiting", "diarrhea", "fatigue",
        "weakness", "dizziness", "swelling", "rash", "infection", "injury",
        "fracture", "diabetes", "hypertension", "asthma", "pneumonia",
        "cardiac", "acute", "chronic", "severe", "mild", "moderate",
        "bilateral", "unilateral", "left", "right", "upper", "lower",
        "back", "neck", "arm", "leg", "knee", "shoulder", "hip", "ankle",
    }
    all_tokens.update(ALWAYS_INCLUDE)
    all_tokens.discard("__empty__")

    token_list = sorted(all_tokens)
    logger.info("  Vocabulary size: %d tokens", len(token_list))
    logger.info("  Encoding vocabulary (may take 30–60s) …")

    vocab_embeddings = model.encode(
        token_list,
        batch_size=256,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=False,  # raw embeddings for vocab (we normalise at query time)
    ).astype(np.float32)

    word_vocab = {word: idx for idx, word in enumerate(token_list)}

    import numpy as np
    np.save(str(cache_dir / "word_embeddings.npy"), vocab_embeddings)
    with open(cache_dir / "word_vocab.pkl", "wb") as f:
        pickle.dump(word_vocab, f, protocol=pickle.HIGHEST_PROTOCOL)

    logger.info("  ✓ Word vocab saved: %d tokens, embedding shape %s",
                len(word_vocab), vocab_embeddings.shape)

    logger.info("=" * 60)
    logger.info("✅  Build complete! All index files saved to: %s", cache_dir)
    logger.info("    Files created:")
    for fname in INDEX_FILES:
        fpath = cache_dir / fname
        size_kb = fpath.stat().st_size // 1024 if fpath.exists() else 0
        logger.info("      %-30s  %6d KB", fname, size_kb)
    logger.info("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build HealPay AI recommendation indices")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if files exist")
    args = parser.parse_args()
    build(force=args.force)
