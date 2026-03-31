"""
build_indices.py  –  Offline pre-computation script for HealPay AI Engine
=========================================================================
Run ONCE at Docker build time (or locally before deploying).
NEVER run automatically at application startup.

What this script produces (saved to embeddings_cache/):
  icd_index.faiss        – FAISS IndexFlatIP for top-5k ICD-10 codes
  icd_meta.pkl           – aligned metadata list for ICD index rows
  cpt_index.faiss        – FAISS IndexFlatIP for CPT codes
  cpt_meta.pkl           – aligned metadata list for CPT index rows
  icd_bm25.pkl           – pre-built BM25Okapi index (ICD) — load directly at runtime
  cpt_bm25.pkl           – pre-built BM25Okapi index (CPT) — load directly at runtime
  icd_bm25_corpus.pkl    – tokenized corpus (kept for compatibility/auditing)
  cpt_bm25_corpus.pkl    – tokenized corpus (kept for compatibility/auditing)
  word_vocab.pkl          – dict: token_str → int index
  word_embeddings.npy    – float32 array [vocab_size, 384] for lightweight query encoding
  manifest.json          – sha256 hashes + timestamp + model name for integrity checks

Usage:
  python build_indices.py --force        # always rebuild
  python build_indices.py               # skip if manifest is valid
  python build_indices.py --version 2   # tag the build with a custom version label
"""

import sys
import os
import logging
import pickle
import argparse
import hashlib
import json
from datetime import datetime, timezone
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

# ── Artifact filenames ────────────────────────────────────────────────────────
# Must stay in sync with index_loader.py
INDEX_FILES = [
    "icd_index.faiss",
    "icd_meta.pkl",
    "cpt_index.faiss",
    "cpt_meta.pkl",
    "icd_bm25.pkl",
    "cpt_bm25.pkl",
    "icd_bm25_corpus.pkl",
    "cpt_bm25_corpus.pkl",
    "word_vocab.pkl",
    "word_embeddings.npy",
]

MANIFEST_FILE = "manifest.json"


# ── Integrity helpers ─────────────────────────────────────────────────────────

def _sha256(path: Path) -> str:
    """Return the sha256 hex-digest of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _write_manifest(cache_dir: Path, model: str, version: str) -> dict:
    """Compute hashes for all artifact files and write manifest.json."""
    file_hashes = {}
    for fname in INDEX_FILES:
        fpath = cache_dir / fname
        if fpath.exists():
            file_hashes[fname] = _sha256(fpath)

    manifest = {
        "version": version,
        "model": model,
        "built_at": datetime.now(timezone.utc).isoformat(),
        "files": file_hashes,
    }

    manifest_path = cache_dir / MANIFEST_FILE
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    logger.info("✓ Manifest written → %s (version=%s, model=%s, files=%d)",
                manifest_path, version, model, len(file_hashes))
    return manifest


def _validate_manifest(cache_dir: Path, expected_model: str) -> tuple[bool, str]:
    """
    Returns (True, "") if the manifest exists, matches the expected model,
    and all hashed files still match their stored sha256 digests.
    Returns (False, reason) otherwise.
    """
    manifest_path = cache_dir / MANIFEST_FILE
    if not manifest_path.exists():
        return False, "manifest.json not found"

    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except Exception as exc:
        return False, f"manifest.json unreadable: {exc}"

    stored_model = manifest.get("model", "")
    if stored_model != expected_model:
        return False, f"model mismatch: stored={stored_model}, expected={expected_model}"

    file_hashes = manifest.get("files", {})
    for fname in INDEX_FILES:
        fpath = cache_dir / fname
        if not fpath.exists():
            return False, f"missing artifact: {fname}"
        stored_hash = file_hashes.get(fname)
        if stored_hash is None:
            return False, f"no hash entry for {fname} in manifest"
        actual_hash = _sha256(fpath)
        if actual_hash != stored_hash:
            return False, f"hash mismatch for {fname}"

    return True, ""


# ── Main build function ───────────────────────────────────────────────────────

def build(force: bool = False, version: str = "1") -> bool:
    """
    Build and persist all AI recommendation artifacts.

    Returns True if the build was skipped (all files valid) or succeeded.
    Returns False if the build failed.
    """
    import numpy as np
    from app.core.config import settings
    from app.services.data_pipeline import load_all_codes, tokenize_query

    cache_dir = BACKEND_ROOT / settings.EMBEDDINGS_CACHE_DIR
    cache_dir.mkdir(parents=True, exist_ok=True)

    # ── Validate existing artifacts ───────────────────────────────────────────
    if not force:
        ok, reason = _validate_manifest(cache_dir, settings.EMBEDDING_MODEL)
        if ok:
            logger.info("✅ Manifest valid — skipping build.  Use --force to rebuild.")
            return True
        else:
            logger.info("⚠️  Manifest invalid (%s) — starting full rebuild.", reason)

    logger.info("=" * 60)
    logger.info("🚀  HealPay AI Index Build  –  v%s  –  %s", version, settings.EMBEDDING_MODEL)
    logger.info("=" * 60)

    try:
        # ── Step 1: Load datasets ─────────────────────────────────────────────
        logger.info("Step 1/6 — Loading datasets …")
        _raw = load_all_codes()
        all_icd: list = list(_raw[0])
        sampled_icd: list = list(_raw[1])
        all_cpt: list = list(_raw[2])
        logger.info("  ICD: %d total, %d sampled for dense index", len(all_icd), len(sampled_icd))
        logger.info("  CPT: %d codes", len(all_cpt))

        # ── Step 2: Build and PERSIST BM25 indices ────────────────────────────
        # Key improvement: we serialize the full BM25Okapi object rather than
        # just the corpus, so index_loader.py can just pickle.load() it at
        # runtime — no CPU rebuild at all.
        logger.info("Step 2/6 — Building and persisting BM25 indices …")
        from rank_bm25 import BM25Okapi

        icd_bm25_corpus = [(c.get("bm25_tokens") or ["__empty__"]) for c in all_icd]
        cpt_bm25_corpus = [(c.get("bm25_tokens") or ["__empty__"]) for c in all_cpt]

        icd_meta_bm25 = [
            {k: v for k, v in c.items() if k not in ("bm25_tokens", "search_text")}
            for c in all_icd
        ]
        cpt_meta_bm25 = [
            {k: v for k, v in c.items() if k not in ("bm25_tokens", "search_text")}
            for c in all_cpt
        ]

        logger.info("  Building ICD BM25 index (%d docs) …", len(icd_bm25_corpus))
        icd_bm25_index = BM25Okapi(icd_bm25_corpus)

        logger.info("  Building CPT BM25 index (%d docs) …", len(cpt_bm25_corpus))
        cpt_bm25_index = BM25Okapi(cpt_bm25_corpus)

        # Persist the fully-built BM25 objects (fast load at runtime)
        with open(cache_dir / "icd_bm25.pkl", "wb") as f:
            pickle.dump({"index": icd_bm25_index, "meta": icd_meta_bm25}, f, protocol=pickle.HIGHEST_PROTOCOL)
        with open(cache_dir / "cpt_bm25.pkl", "wb") as f:
            pickle.dump({"index": cpt_bm25_index, "meta": cpt_meta_bm25}, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info("  ✓ BM25 objects persisted (icd_bm25.pkl, cpt_bm25.pkl)")

        # Also keep corpus files for auditing/compatibility
        with open(cache_dir / "icd_bm25_corpus.pkl", "wb") as f:
            pickle.dump({"corpus": icd_bm25_corpus, "meta": icd_meta_bm25}, f, protocol=pickle.HIGHEST_PROTOCOL)
        with open(cache_dir / "cpt_bm25_corpus.pkl", "wb") as f:
            pickle.dump({"corpus": cpt_bm25_corpus, "meta": cpt_meta_bm25}, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info("  ✓ BM25 corpora saved for auditing")

        # ── Step 3: Load the sentence transformer model ───────────────────────
        # This is the ONLY place where the model is ever loaded.
        logger.info("Step 3/6 — Loading embedding model: %s …", settings.EMBEDDING_MODEL)
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("  ✓ Model loaded")

        def _encode(texts, label):
            logger.info("  Encoding %d %s descriptions …", len(texts), label)
            return model.encode(
                texts,
                batch_size=128,
                show_progress_bar=True,
                convert_to_numpy=True,
                normalize_embeddings=True,
            ).astype(np.float32)

        # ── Step 4: Build FAISS dense indices ────────────────────────────────
        logger.info("Step 4/6 — Building FAISS dense indices …")
        import faiss

        for code_type, codes in [("icd", sampled_icd), ("cpt", all_cpt)]:
            texts = [c["search_text"] for c in codes]
            vecs = _encode(texts, code_type.upper())
            dim = vecs.shape[1]
            index = faiss.IndexFlatIP(dim)
            index.add(vecs)
            faiss.write_index(index, str(cache_dir / f"{code_type}_index.faiss"))
            logger.info("  ✓ %s FAISS index: %d vectors, dim=%d", code_type.upper(), index.ntotal, dim)

            meta = [{k: v for k, v in c.items() if k != "bm25_tokens"} for c in codes]
            with open(cache_dir / f"{code_type}_meta.pkl", "wb") as f:
                pickle.dump(meta, f, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info("  ✓ %s metadata saved (%d records)", code_type.upper(), len(meta))

        # ── Step 5: Build word embedding vocabulary ───────────────────────────
        logger.info("Step 5/6 — Building word embedding vocabulary …")
        all_tokens: set = set()
        for codes in [all_icd, all_cpt]:
            for code in codes:
                tokens = code.get("bm25_tokens") or []
                all_tokens.update(tokens)

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

        vocab_embeddings = model.encode(
            token_list,
            batch_size=256,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=False,
        ).astype(np.float32)

        word_vocab = {word: idx for idx, word in enumerate(token_list)}
        np.save(str(cache_dir / "word_embeddings.npy"), vocab_embeddings)
        with open(cache_dir / "word_vocab.pkl", "wb") as f:
            pickle.dump(word_vocab, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info("  ✓ Word vocab: %d tokens, shape=%s", len(word_vocab), vocab_embeddings.shape)

        # ── Step 6: Write manifest ────────────────────────────────────────────
        logger.info("Step 6/6 — Writing manifest.json …")
        manifest = _write_manifest(cache_dir, settings.EMBEDDING_MODEL, version)

        logger.info("=" * 60)
        logger.info("✅  Build complete! v=%s  built_at=%s", manifest["version"], manifest["built_at"])
        logger.info("    Files saved to: %s", cache_dir)
        for fname in INDEX_FILES:
            fpath = cache_dir / fname
            size_kb = fpath.stat().st_size // 1024 if fpath.exists() else 0
            logger.info("      %-30s  %6d KB", fname, size_kb)
        logger.info("=" * 60)
        return True

    except Exception as exc:
        logger.error("❌ Build FAILED: %s", exc, exc_info=True)
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build HealPay AI recommendation indices")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if manifest is valid")
    parser.add_argument("--version", default="1", help="Version label to embed in manifest.json")
    args = parser.parse_args()
    ok = build(force=args.force, version=args.version)
    sys.exit(0 if ok else 1)
