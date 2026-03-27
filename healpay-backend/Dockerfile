# ── Build Stage ──────────────────────────────────────────────────────────────
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies in a virtualenv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# Install torch-cpu (saves ~1.5 GB vs default torch with CUDA)
# Install all other requirements second
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# ── Pre-download the embedding model ─────────────────────────────────────────
# paraphrase-MiniLM-L3-v2: ~60MB, 384 dims, 3 transformer layers
# Baking the model into the image eliminates ALL runtime downloads.
# SENTENCE_TRANSFORMERS_HOME controls where the model is cached.
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
print('Downloading paraphrase-MiniLM-L3-v2 ...'); \
m = SentenceTransformer('paraphrase-MiniLM-L3-v2'); \
print('Model downloaded and cached at /app/model_cache')"

# ── Production Stage ─────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy virtualenv from builder (includes torch, sentence-transformers, faiss-cpu)
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy pre-downloaded model from builder
COPY --from=builder /app/model_cache /app/model_cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache

# Copy application code and datasets
COPY . .

# ── Pre-compute AI indices ────────────────────────────────────────────────────
# Uses pre-downloaded model (no network call).
# Produces deterministic files in embeddings_cache/:
#   icd_index.faiss, cpt_index.faiss, icd_meta.pkl, cpt_meta.pkl,
#   icd_bm25_corpus.pkl, cpt_bm25_corpus.pkl, word_vocab.pkl, word_embeddings.npy
# Runtime only does np.load() + faiss.read_index() — NO model needed.
RUN ENVIRONMENT=production python build_indices.py --force

# Runtime environment
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# 2 workers: enough for Koyeb free tier (512 MB).
# Timeout 60s is now safe — index loading takes <10s, not 120s.
CMD ["gunicorn", "main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", "--timeout", "60"]
