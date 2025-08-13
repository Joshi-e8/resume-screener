#!/usr/bin/env bash
set -euo pipefail

# Always run from the backend directory
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Load .env if present (export all variables)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Export LLM env so API uses your gateway
export PROVIDER=${PROVIDER:-openai}
export OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://ai.nuox.io/v1}
# IMPORTANT: Set your key in the shell or here (do NOT commit secrets)
# export OPENAI_API_KEY=sk-...

# Force Vector DB to remote Qdrant for API
export QDRANT_URL=${QDRANT_URL:-https://6fb03a96-6548-421b-907d-cf985125ef1c.eu-central-1-0.aws.cloud.qdrant.io:6333}
export QDRANT_API_KEY=${QDRANT_API_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.u4ZrNEPf_Bi_nbo2h4wmfGwt4CuJWRxlsxhlXH3Mog4}

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "WARNING: OPENAI_API_KEY is not set in this shell; API may not be able to call your gateway." >&2
fi

echo "Starting API server with base_url=${OPENAI_BASE_URL} provider=${PROVIDER}"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

