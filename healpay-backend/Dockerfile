# ── Build Stage ──────────────────────────────────────────────────────────────
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies in a virtualenv to easily copy them
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# 1. Install torch-cpu specifically (Saves ~1.5GB vs default torch)
# 2. Install other requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# ── Production Stage ─────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies (libpq for postgres)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port (Koyeb uses 8000 by default)
EXPOSE 8000

# Start command: The app now handles migrations/seeding internally via main.py
CMD ["gunicorn", "main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--timeout", "120"]
