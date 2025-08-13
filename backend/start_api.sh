#!/usr/bin/env bash
set -euo pipefail

# Always run from the backend directory
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Export LLM env so API uses your gateway
export PROVIDER=${PROVIDER:-openai}
export OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://ai.nuox.io/v1}
# IMPORTANT: Set your key in the shell or here (do NOT commit secrets)
# export OPENAI_API_KEY=sk-...

# Optional: Vector DB (if you want to force remote Qdrant for API too)
# export QDRANT_URL=...
# export QDRANT_API_KEY=...

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "WARNING: OPENAI_API_KEY is not set in this shell; API may not be able to call your gateway." >&2
fi

echo "Starting API server with base_url=${OPENAI_BASE_URL} provider=${PROVIDER}"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

