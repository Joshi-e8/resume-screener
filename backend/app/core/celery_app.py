"""
Celery configuration for background task processing
"""

from celery import Celery
from celery.signals import worker_init, worker_shutdown
import os
import asyncio
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "resume_processor",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    include=["app.tasks.resume_tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 60 minutes max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Task routing
celery_app.conf.task_routes = {
    "app.tasks.resume_tasks.process_resume_task": {"queue": "resume_processing"},
    "app.tasks.resume_tasks.process_bulk_resumes_task": {"queue": "bulk_processing"},
    "app.tasks.resume_tasks.process_direct_resume_file": {"queue": "resume_processing"},
}


# Database initialization for Celery workers
@worker_init.connect
def init_worker(**kwargs):
    """Initialize database connection when worker starts"""
    print("🔄 Initializing database connection for Celery worker...")

    # Set up the worker to initialize database on first task
    # This avoids event loop conflicts
    print("✅ Database initialization will happen on first task execution")


@worker_shutdown.connect
def shutdown_worker(**kwargs):
    """Clean up database connection when worker shuts down"""
    print("🔄 Shutting down Celery worker...")
    print("✅ Celery worker shutdown complete")
