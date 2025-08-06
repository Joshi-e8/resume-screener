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

# Start Celery worker
echo "Starting Celery worker..."
celery -A app.core.celery_app worker --loglevel=info --concurrency=4 --queues=resume_processing,bulk_processing

echo "🚀 All services started successfully!"
