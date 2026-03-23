"""
Build Indices – Pre-deployment script for HealPay AI Recommendation Engine
========================================================================
Responsibility:
  • Runs during 'docker build' to pre-calculate embeddings and BM25 indices.
  • Saves results to 'healpay-backend/embeddings_cache/'.
  • Eliminates runtime indexing overhead on memory-constrained production (Koyeb).
"""

import sys
import os
import logging
from pathlib import Path

# Add the backend root to sys.path so we can import app modules
BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.append(str(BACKEND_ROOT))

# Configure basic logging to see progress during docker build
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("build_indices")

def build_production_indices():
    logger.info("🚀 Starting Production AI Index Build...")
    
    # 1. Ensure cache directory exists
    from app.services.embedding_engine import CACHE_DIR
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"✓ Cache directory verified: {CACHE_DIR}")

    # 2. Trigger Warm-up (Force Rebuild to ensure fresh cache)
    # We use a direct call to the background logic to avoid threading complexies in build stage
    from app.services.index_loader import _full_background_warmup
    try:
        # This will load CSVs, build BM25, encode vectors with SentenceTransformers, and build FAISS
        # Note: This requires the model to be downloaded during docker build
        _full_background_warmup(force_rebuild=True)
        logger.info("✅ Build Complete: All indices persisted to disk.")
    except Exception as e:
        # Non-fatal: if build-time indexing fails (e.g. network, OOM), the app will
        # still start successfully and rebuild indices at runtime in BM25-only mode.
        logger.warning(
            "⚠️ Build-time index pre-computation failed: %s\n"
            "   The app will still start, but BM25-only mode will be used until the "
            "AI engine finishes warming up at runtime.", e
        )

if __name__ == "__main__":
    # Prevent this from running accidentally in development if not desired
    if os.environ.get("ENVIRONMENT") == "production" or "--force" in sys.argv:
        build_production_indices()
    else:
        logger.info("Skipping index build (Not in production mode). Use --force to override.")
