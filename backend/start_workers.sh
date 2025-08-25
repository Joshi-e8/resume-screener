#!/bin/bash

# Start Redis server (if not already running)
echo "Starting Redis server..."
redis-server --daemonize yes --port 6379

# Wait for Redis to start
sleep 2

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Failed to start Redis"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Load .env if present (export all variables)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Export LLM and Vector env (override here as needed)
export PROVIDER=${PROVIDER:-openai}
export OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://ai.nuox.io/v1}
# OPENAI_API_KEY must be set in your shell or .env; we don't echo it for security
# export OPENAI_API_KEY=sk-...
# Optional: remote Qdrant
export QDRANT_URL=${QDRANT_URL:-https://6fb03a96-6548-421b-907d-cf985125ef1c.eu-central-1-0.aws.cloud.qdrant.io:6333}
export QDRANT_API_KEY=${QDRANT_API_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.u4ZrNEPf_Bi_nbo2h4wmfGwt4CuJWRxlsxhlXH3Mog4}

echo "[startup] PROVIDER=$PROVIDER"
echo "[startup] OPENAI_BASE_URL=$OPENAI_BASE_URL"
if [ -n "${OPENAI_API_KEY:-}" ]; then echo "[startup] OPENAI_API_KEY=present"; else echo "[startup] OPENAI_API_KEY=missing"; fi
if [ -n "${QDRANT_URL:-}" ]; then echo "[startup] QDRANT_URL=$QDRANT_URL"; fi
if [ -n "${QDRANT_API_KEY:-}" ]; then echo "[startup] QDRANT_API_KEY=present"; fi

# Start Celery worker
echo "Starting Celery worker..."
celery -A app.core.celery_app worker --loglevel=info --concurrency=4 --queues=resume_processing,bulk_processing

echo "🚀 All services started successfully!"
