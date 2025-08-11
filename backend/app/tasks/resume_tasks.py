"""
Celery tasks for resume processing
"""

import asyncio
import time
from typing import Dict, List, Any

from app.core.celery_app import celery_app
from app.services.google_drive_service import GoogleDriveService
from app.services.resume_parser import ResumeParser
# WebSocket manager no longer needed - using SSE instead
# from app.core.websocket_manager import websocket_manager
from app.models.resume_processing import BatchProcessingJob, ProcessingStatus, ResumeMetadata, ResumeDetails, ProcessingMode
from app.models.job import Job
from app.scoring.service import score_resume_against_job
from app.core.database import init_database
from app.core.config import settings
import os
from loguru import logger
from datetime import datetime, timezone

import re


@celery_app.task
def test_task():
    """Simple test task"""
    return "Test task completed successfully!"


@celery_app.task(bind=True)
def process_resume_task(self, file_id: str, access_token: str, credentials_dict: Dict[str, Any], job_id: str = None):
    """
    Process a single resume file in background
    """
    try:
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 1, 'status': 'Starting...'}
        )

        # Initialize services
        drive_service = GoogleDriveService()
        parser = ResumeParser()

        # Get file metadata
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 1, 'status': 'Fetching metadata...'}
        )

        # Run async operations in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            file_metadata = loop.run_until_complete(
                drive_service.get_file_metadata(credentials_dict, file_id)
            )
            filename = file_metadata.get("name") or file_id
            mime_type = file_metadata.get("mimeType")
            size_val = file_metadata.get("size")
            try:
                file_size = int(size_val) if size_val is not None else None
            except Exception:
                file_size = None

            # Download file
            self.update_state(
                state='PROGRESS',
                meta={'current': 0, 'total': 1, 'status': f'Downloading {filename}...'}
            )

            tmp_file_path = loop.run_until_complete(
                drive_service.save_file_temporarily(credentials_dict, file_id)
            )

            # Parse resume
            self.update_state(
                state='PROGRESS',
                meta={'current': 0, 'total': 1, 'status': f'Parsing {filename}...'}
            )

            parsed_data = loop.run_until_complete(
                parser.parse_resume(tmp_file_path)
            )

            # Optional: auto-scoring when enabled and job context provided
            ai_scoring = None
            ai_overall = None
            try:
                if bool(int(str(getattr(settings, "ENABLE_SCORING", 1)) or "1")) and job_id:
                    # Ensure DB available for Job fetch
                    try:
                        loop.run_until_complete(init_database())
                    except Exception:
                        pass
                    job_doc = loop.run_until_complete(Job.get(job_id)) if job_id else None
                    job_payload = job_doc.model_dump() if job_doc else {"title": ""}
                    scoring = score_resume_against_job(parsed_data, job_payload)
                    ai_scoring = scoring
                    ai_overall = scoring.get("overall_score")
            except Exception as score_err:
                logger.warning(f"AI scoring skipped for {filename}: {score_err}")

            # Persist to DB: ResumeMetadata + ResumeDetails
            try:
                loop.run_until_complete(init_database())
            except Exception:
                pass
            try:
                # Create metadata
                meta = ResumeMetadata(
                    file_id=file_id,
                    filename=filename,
                    user_id=str(user_id or "unknown"),
                    status=ProcessingStatus.COMPLETED,
                    processing_mode=ProcessingMode.FAST if parsed_data.get("processing_mode") in ("fast", "fast_bulk") else ProcessingMode.STANDARD,
                    processing_completed_at=datetime.now(timezone.utc),
                    processing_time_ms=None,
                    job_id=job_id or None,
                    candidate_name=(parsed_data.get("contact_info") or {}).get("name"),
                    candidate_email=(parsed_data.get("contact_info") or {}).get("email"),
                    key_skills=(parsed_data.get("skills") or []),
                    file_size=file_size,
                    mime_type=mime_type,
                )
                # Save metadata
                saved_meta = loop.run_until_complete(meta.insert())

                # Prepare analysis results to include AI scoring if available
                analysis_results = {}
                if ai_scoring is not None:
                    analysis_results = {
                        "ai_scoring": ai_scoring,
                        "ai_overall_score": ai_overall,
                    }

                # Create details
                details = ResumeDetails(
                    resume_id=str(saved_meta.id),
                    raw_text=parsed_data.get("raw_text"),
                    parsed_data=parsed_data,
                    analysis_results=analysis_results,
                )
                loop.run_until_complete(details.insert())
            except Exception as persist_err:
                logger.warning(f"⚠️ Failed to persist resume data for {filename}: {persist_err}")

            # Clean up
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

            result = {
                'file_id': file_id,
                'filename': filename,
                'success': True,
                'parsed_data': parsed_data,
                'status': 'completed',
                'job_id': job_id,
            }
            if ai_scoring is not None:
                result['ai_scoring'] = ai_scoring
            if ai_overall is not None:
                result['ai_overall_score'] = ai_overall
            return result

        finally:
            loop.close()

    except Exception as e:
        return {
            'file_id': file_id,
            'filename': f'unknown_{file_id}',
            'success': False,
            'error_message': str(e),
            'status': 'failed'
        }


@celery_app.task(bind=True)
def process_bulk_resumes_task(self, file_ids: List[str], access_token: str, credentials_dict: Dict[str, Any],
                             user_id: str = None, job_id: str = None):
    """
    Process multiple resume files with progress tracking
    """
    total_files = len(file_ids)
    results = []

    try:
        # Initialize services
        drive_service = GoogleDriveService()
        parser = ResumeParser()

        # Process files in much larger chunks for maximum performance
        chunk_size = 20
        chunks = [file_ids[i:i+chunk_size] for i in range(0, len(file_ids), chunk_size)]

        processed_count = 0

        # Send initial progress update via WebSocket
        if user_id:
            try:
                from app.core.websocket_manager import websocket_manager
                logger.info(f"🚀 TASK: Starting bulk processing for user_id: {user_id}")
                logger.info(f"📊 TASK: Processing {total_files} files")

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(websocket_manager.send_progress_update(
                    user_id, {
                        'completed': 0,
                        'total': total_files,
                        'status': 'processing',
                        'message': 'Starting file processing...'
                    }
                ))
                loop.close()
                logger.info(f"✅ TASK: Sent initial WebSocket progress update for user {user_id}")
            except Exception as e:
                logger.error(f"❌ TASK: Failed to send initial WebSocket progress update: {e}")
                import traceback
                logger.error(f"❌ TASK: Traceback: {traceback.format_exc()}")

        for chunk_index, chunk in enumerate(chunks):
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': processed_count,
                    'total': total_files,
                    'status': f'Processing chunk {chunk_index + 1}/{len(chunks)}...'
                }
            )

            # Process chunk
            chunk_results = process_chunk_sync(chunk, credentials_dict, drive_service, parser, job_id=job_id, user_id=user_id)
            results.extend(chunk_results)
            processed_count += len(chunk)

            # Send WebSocket progress update if user_id provided (only every 2 chunks to reduce overhead)
            if user_id and (chunk_index % 2 == 0 or chunk_index == len(chunks) - 1):
                try:
                    from app.core.websocket_manager import websocket_manager
                    logger.info(f"📊 TASK: Sending progress update {processed_count}/{total_files} for user {user_id}")

                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(websocket_manager.send_progress_update(
                        user_id, {
                            'completed': processed_count,
                            'total': total_files,
                            'status': 'processing',
                            'message': f'Processed {processed_count}/{total_files} files...'
                        }
                    ))
                    loop.close()
                    logger.info(f"✅ TASK: Sent WebSocket progress update {processed_count}/{total_files}")
                except Exception as e:
                    logger.error(f"❌ TASK: Failed to send WebSocket progress update: {e}")
                    import traceback
                    logger.error(f"❌ TASK: Traceback: {traceback.format_exc()}")

        # Final update
        successful_files = sum(1 for r in results if r['success'])
        failed_files = total_files - successful_files

        self.update_state(
            state='SUCCESS',
            meta={
                'current': total_files,
                'total': total_files,
                'status': 'completed',
                'successful_files': successful_files,
                'failed_files': failed_files,
                'results': results
            }
        )

        # Update batch job status in database
        try:
            # Find and update the batch job by celery task ID
            task_id = self.request.id
            logger.info(f"🔄 Starting batch job update for task ID: {task_id}")

            # Always create a fresh event loop for database operations
            logger.info(f"🔄 Creating fresh event loop for database operations")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def update_batch_job():
                # Initialize database if not already done
                try:
                    logger.info(f"🔗 Initializing database connection for task...")
                    from app.core.database import init_database
                    await init_database()
                    logger.info(f"✅ Database initialized successfully")
                except Exception as init_error:
                    logger.error(f"❌ Database initialization failed: {init_error}")
                    # Try to continue anyway in case it's already initialized

                # Test database connection
                try:
                    logger.info(f"🔗 Testing database connection...")
                    test_count = await BatchProcessingJob.count()
                    logger.info(f"✅ Database connection OK - found {test_count} batch jobs total")
                except Exception as db_test_error:
                    logger.error(f"❌ Database connection test failed: {db_test_error}")
                    raise db_test_error

                logger.info(f"🔍 Searching for batch job with celery_task_id: {task_id}")
                batch_job = await BatchProcessingJob.find_one({"celery_task_id": task_id})

                if batch_job:
                    logger.info(f"✅ Found batch job: {batch_job.batch_id}")
                    logger.info(f"📊 Current batch job status: {batch_job.status}")

                    try:
                        # Update batch job with completion data
                        logger.info(f"📝 Updating batch job fields...")
                        batch_job.processed_files = total_files
                        batch_job.successful_files = successful_files
                        batch_job.failed_files = failed_files
                        batch_job.status = ProcessingStatus.COMPLETED
                        batch_job.completed_at = datetime.now(timezone.utc)
                        batch_job.progress_percentage = 100.0
                        batch_job.current_status_message = f"Completed: {successful_files}/{total_files} files processed successfully"

                        # Store completed and failed file IDs
                        logger.info(f"📋 Setting completed file IDs: {len([r['file_id'] for r in results if r['success']])} files")
                        batch_job.completed_file_ids = [r['file_id'] for r in results if r['success']]
                        batch_job.failed_file_ids = [r['file_id'] for r in results if not r['success']]

                        # Store processing summary
                        logger.info(f"📄 Setting processing summary...")
                        batch_job.processing_summary = {
                            'total_files': total_files,
                            'successful_files': successful_files,
                            'failed_files': failed_files,
                            'completion_time': datetime.now(timezone.utc).isoformat(),
                            'task_id': task_id
                        }

                        logger.info(f"💾 Attempting to save batch job...")
                        await batch_job.save()
                        logger.info(f"✅ Successfully updated batch job {batch_job.batch_id} - {successful_files}/{total_files} files successful")

                    except Exception as save_error:
                        logger.error(f"❌ Error saving batch job: {type(save_error).__name__}: {save_error}")
                        logger.error(f"📋 Batch job data at time of error:")
                        logger.error(f"   - batch_id: {batch_job.batch_id}")
                        logger.error(f"   - status: {batch_job.status} (type: {type(batch_job.status)})")
                        logger.error(f"   - processed_files: {batch_job.processed_files}")
                        logger.error(f"   - successful_files: {batch_job.successful_files}")
                        logger.error(f"   - failed_files: {batch_job.failed_files}")
                        logger.error(f"   - completed_file_ids length: {len(batch_job.completed_file_ids)}")
                        logger.error(f"   - failed_file_ids length: {len(batch_job.failed_file_ids)}")
                        raise save_error
                else:
                    logger.warning(f"❌ Batch job not found for task ID: {task_id}")
                    # Let's also search by batch_id to see if there's a mismatch
                    all_jobs = await BatchProcessingJob.find().to_list()
                    logger.warning(f"📋 Found {len(all_jobs)} total batch jobs in database")
                    for job in all_jobs[-5:]:  # Show last 5 jobs
                        logger.warning(f"   - Job {job.batch_id}: celery_task_id={job.celery_task_id}, status={job.status}")

            loop.run_until_complete(update_batch_job())
            loop.close()

        except Exception as e:
            logger.error(f"❌ Failed to update batch job - Exception type: {type(e).__name__}")
            logger.error(f"❌ Failed to update batch job - Exception message: {str(e)}")
            logger.error(f"❌ Failed to update batch job - Full exception: {repr(e)}")
            import traceback
            logger.error(f"❌ Full traceback:\n{traceback.format_exc()}")

        # Send final WebSocket update
        if user_id:
            try:
                logger.info(f"📡 TASK: Preparing to send final WebSocket update to user_id: {user_id}")
                logger.info(f"🔄 TASK: Creating fresh event loop for WebSocket update")
                logger.info(f"🎉 TASK: Final results - successful: {successful_files}, failed: {failed_files}")

                from app.core.websocket_manager import websocket_manager
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                loop.run_until_complete(websocket_manager.send_progress_update(
                    user_id, {
                        'completed': total_files,
                        'total': total_files,
                        'results': results,
                        'status': 'completed',
                        'successful_files': successful_files,
                        'failed_files': failed_files
                    }
                ))

                loop.close()
                logger.info(f"✅ TASK: Successfully sent final WebSocket update for user {user_id}")
            except Exception as e:
                logger.error(f"❌ TASK: Failed to send final WebSocket update: {e}")
                import traceback
                logger.error(f"❌ TASK: Traceback: {traceback.format_exc()}")

        return {
            'total_files': total_files,
            'successful_files': successful_files,
            'failed_files': failed_files,
            'results': results,
            'status': 'completed'
        }

    except Exception as e:
        # Update batch job status to failed
        try:
            task_id = self.request.id
            logger.error(f"Task {task_id} failed: {e}")

            # Create new event loop for database operations
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def update_failed_batch_job():
                batch_job = await BatchProcessingJob.find_one({"celery_task_id": task_id})
                if batch_job:
                    batch_job.status = ProcessingStatus.FAILED
                    batch_job.completed_at = datetime.now(timezone.utc)
                    batch_job.current_status_message = f"Failed: {str(e)}"
                    batch_job.processing_summary = {
                        'error': str(e),
                        'status': ProcessingStatus.FAILED.value,
                        'task_id': task_id,
                        'failure_time': datetime.now(timezone.utc).isoformat()
                    }
                    await batch_job.save()
                    logger.info(f"Updated batch job {batch_job.batch_id} status to failed")

            loop.run_until_complete(update_failed_batch_job())
            loop.close()

        except Exception as db_error:
            logger.error(f"Failed to update batch job status to failed: {db_error}")

        self.update_state(
            state='FAILURE',
            meta={'error': str(e), 'status': 'failed'}
        )
        raise


def process_chunk_sync(file_ids: List[str], credentials_dict: Dict[str, Any],
                      drive_service: GoogleDriveService, parser: ResumeParser,
                      job_id: str | None = None, user_id: str | None = None) -> List[Dict[str, Any]]:
    """
    Process a chunk of files with ultra-high performance
    """
    results = []

    # Create new event loop for this chunk
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Process files with maximum concurrency
        async def process_files_ultra_fast():
            # Use much higher concurrency for maximum speed
            semaphore = asyncio.Semaphore(20)  # Ultra-high concurrency

            async def process_single_file_ultra_fast(file_id: str):
                async with semaphore:
                    start_time = time.time()
                    try:
                        # Download file directly to memory and parse
                        file_content, filename, file_extension = await drive_service.download_file_to_memory(credentials_dict, file_id)

                        parsed_data = await asyncio.wait_for(
                            parser.parse_resume_from_memory(file_content, filename, file_extension),
                            timeout=3.0
                        )

                        return {
                            'file_id': file_id,
                            'filename': filename,
                            'success': True,
                            'parsed_data': parsed_data,
                            'processing_time_ms': int((time.time() - start_time) * 1000)
                        }

                    except asyncio.TimeoutError:
                        return {
                            'file_id': file_id,
                            'filename': f'timeout_{file_id}',
                            'success': False,
                            'error_message': "Processing timeout",
                            'processing_time_ms': int((time.time() - start_time) * 1000)
                        }
                    except Exception as e:
                        return {
                            'file_id': file_id,
                            'filename': f'error_{file_id}',
                            'success': False,
                            'error_message': str(e),
                            'processing_time_ms': int((time.time() - start_time) * 1000)
                        }

            # Process all files simultaneously
            tasks = [process_single_file_ultra_fast(file_id) for file_id in file_ids]
            return await asyncio.gather(*tasks, return_exceptions=True)

        chunk_results = loop.run_until_complete(process_files_ultra_fast())

        # Convert exceptions to error results
        db_inited = False
        for i, result in enumerate(chunk_results):
            if isinstance(result, Exception):
                results.append({
                    'file_id': file_ids[i],
                    'filename': f'exception_{file_ids[i]}',
                    'success': False,
                    'error_message': str(result),
                    'processing_time_ms': 0
                })
            else:
                # Additive: auto-score if possible
                try:
                    if result.get('success') and bool(int(str(getattr(settings, "ENABLE_SCORING", 1)) or "1")):
                        # Ensure DB is initialized and fetch job list once outside the loop if needed
                        # Build job list to score against
                        jobs_cache = getattr(process_chunk_sync, "_jobs_cache", None)
                        if jobs_cache is None:
                            try:
                                loop.run_until_complete(init_database())
                                db_inited = True
                            except Exception:
                                pass
                            jobs: list = []
                            if job_id:
                                try:
                                    jd = loop.run_until_complete(Job.get(job_id))
                                    if jd:
                                        jobs = [jd]
                                except Exception:
                                    jobs = []
                            else:
                                if user_id:
                                    # All ACTIVE jobs for this user; fallback to all user jobs
                                    try:
                                        jobs = loop.run_until_complete(Job.find({"user_id": str(user_id), "status": "active"}).sort("-created_at").to_list())
                                    except Exception:
                                        jobs = []
                                    if not jobs:
                                        try:
                                            jobs = loop.run_until_complete(Job.find({"user_id": str(user_id)}).sort("-created_at").to_list())
                                        except Exception:
                                            jobs = []
                            setattr(process_chunk_sync, "_jobs_cache", jobs)
                            jobs_cache = jobs

                        # If no user/job-scoped jobs found, fall back to all active jobs, then all jobs
                        if not jobs_cache:
                            try:
                                jobs_cache = loop.run_until_complete(Job.find({"status": "active"}).sort("-created_at").to_list())
                            except Exception:
                                jobs_cache = []
                            if not jobs_cache:
                                try:
                                    jobs_cache = loop.run_until_complete(Job.find({}).sort("-created_at").to_list())
                                except Exception:
                                    jobs_cache = []

                        matching_scores = {}
                        best_job = None
                        best_scoring = None
                        best_overall = None

                        for jd in (jobs_cache or []):
                            try:
                                scoring = score_resume_against_job(result['parsed_data'], jd.model_dump())
                                overall = scoring.get('overall_score')
                                matching_scores[str(jd.id)] = float(overall) if overall is not None else 0.0
                                if best_overall is None or (overall or 0) > (best_overall or 0):
                                    best_overall = overall
                                    best_scoring = scoring
                                    best_job = jd
                            except Exception as e:
                                logger.warning(f"Scoring failed for job {getattr(jd, 'id', '?')}: {e}")

                        if best_scoring is not None:
                            result['ai_scoring'] = best_scoring
                            result['ai_overall_score'] = best_overall
                            result['matching_scores'] = matching_scores
                            try:
                                result['job_id'] = str(best_job.id) if best_job else result.get('job_id')
                            except Exception:
                                pass
                except Exception as e:
                    logger.warning(f"AI scoring skipped for {result.get('filename')}: {e}")

                # Persist successful results to DB
                if result.get('success'):
                    # Initialize DB once if not already
                    if not db_inited:
                        try:
                            loop.run_until_complete(init_database())
                        except Exception:
                            pass
                        db_inited = True
                    try:
                        parsed_data = result.get('parsed_data') or {}

                        # Fetch file metadata for size and mime_type
                        file_size = None
                        mime_type = None
                        try:
                            meta_info = loop.run_until_complete(drive_service.get_file_metadata(credentials_dict, result.get('file_id')))
                            size_val = meta_info.get('size')
                            mime_type = meta_info.get('mimeType')
                            try:
                                file_size = int(size_val) if size_val is not None else None
                            except Exception:
                                file_size = None
                        except Exception:
                            pass

                        # Fallback name derivation from email or filename
                        contact = (parsed_data.get('contact_info') or {})
                        candidate_email = contact.get('email') or parsed_data.get('email')
                        candidate_name = contact.get('name') or parsed_data.get('name')
                        if not candidate_name:
                            # derive from email local part
                            if candidate_email and isinstance(candidate_email, str):
                                local = candidate_email.split('@')[0]
                                parts = [p for p in re.split(r"[._-]+", local) if p]
                                if parts:
                                    candidate_name = ' '.join([p[:1].upper() + p[1:] for p in parts])
                        if not candidate_name:
                            # derive from filename
                            fname = result.get('filename') or ''
                            base = re.sub(r"\.[^./]+$", "", fname)
                            parts = [p for p in re.split(r"[._-]+", base) if p]
                            if parts:
                                candidate_name = ' '.join([p[:1].upper() + p[1:] for p in parts[:3]])

                        # Effective job id: use provided job_id or auto-selected nonlocal_job_doc
                        effective_job_id = job_id
                        try:
                            nonlocal_job_doc = getattr(process_chunk_sync, "_job_doc", None)
                            if not effective_job_id and nonlocal_job_doc is not None and getattr(nonlocal_job_doc, 'id', None):
                                effective_job_id = str(nonlocal_job_doc.id)
                        except Exception:
                            pass

                        # Create metadata
                        meta = ResumeMetadata(
                            file_id=result.get('file_id'),
                            filename=result.get('filename'),
                            user_id=str(user_id or "unknown"),
                            status=ProcessingStatus.COMPLETED,
                            processing_mode=ProcessingMode.FAST if (parsed_data.get("processing_mode") in ("fast", "fast_bulk")) else ProcessingMode.STANDARD,
                            processing_completed_at=datetime.now(timezone.utc),
                            processing_time_ms=result.get('processing_time_ms'),
                            job_id=effective_job_id or None,
                            candidate_name=candidate_name,
                            candidate_email=candidate_email,
                            key_skills=(parsed_data.get("skills") or []),
                            file_size=file_size,
                            mime_type=mime_type,
                        )
                        saved_meta = loop.run_until_complete(meta.insert())

                        analysis_results = {}
                        if result.get('ai_scoring') is not None:
                            analysis_results["ai_scoring"] = result.get('ai_scoring')
                        if result.get('ai_overall_score') is not None:
                            analysis_results["ai_overall_score"] = result.get('ai_overall_score')

                        details = ResumeDetails(
                            resume_id=str(saved_meta.id),
                            raw_text=parsed_data.get("raw_text"),
                            parsed_data=parsed_data,
                            analysis_results=analysis_results,
                        )
                        loop.run_until_complete(details.insert())
                    except Exception as persist_err:
                        logger.warning(f"⚠️ Failed to persist resume data for {result.get('filename')}: {persist_err}")

                # Include job_id in the per-file result for frontend hydration
                if job_id:
                    result['job_id'] = job_id

                results.append(result)

    finally:
        loop.close()

    return results


async def process_file_async_fast(file_id: str, credentials_dict: Dict[str, Any],
                                 drive_service: GoogleDriveService, parser: ResumeParser) -> Dict[str, Any]:
    """
    Process a single file asynchronously with high-performance in-memory processing
    """
    start_time = time.time()

    try:
        # Download file directly to memory (much faster than temp files)
        file_content, filename, file_extension = await drive_service.download_file_to_memory(credentials_dict, file_id)

        # Parse resume directly from memory with aggressive timeout
        parsed_data = await asyncio.wait_for(
            parser.parse_resume_from_memory(file_content, filename, file_extension),
            timeout=5.0  # Much more aggressive timeout
        )

        return {
            'file_id': file_id,
            'filename': filename,
            'success': True,
            'parsed_data': parsed_data,
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }

    except asyncio.TimeoutError:
        return {
            'file_id': file_id,
            'filename': f'timeout_{file_id}',
            'success': False,
            'error_message': "File processing timed out (5 seconds)",
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        return {
            'file_id': file_id,
            'filename': f'error_{file_id}',
            'success': False,
            'error_message': str(e),
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }

async def process_file_async(file_id: str, credentials_dict: Dict[str, Any],
                           drive_service: GoogleDriveService, parser: ResumeParser) -> Dict[str, Any]:
    """
    Process a single file asynchronously
    """
    start_time = time.time()

    try:
        # Get file metadata
        file_metadata = await drive_service.get_file_metadata(credentials_dict, file_id)
        filename = file_metadata["name"]

        # Validate file type
        allowed_mime_types = drive_service.get_resume_mime_types()
        if file_metadata["mimeType"] not in allowed_mime_types:
            return {
                'file_id': file_id,
                'filename': filename,
                'success': False,
                'error_message': f"Unsupported file type: {file_metadata['mimeType']}",
                'processing_time_ms': int((time.time() - start_time) * 1000)
            }

        # Download and process file
        tmp_file_path = await drive_service.save_file_temporarily(credentials_dict, file_id)

        try:
            # Parse resume with reduced timeout for faster processing
            parsed_data = await asyncio.wait_for(
                parser.parse_resume(tmp_file_path),
                timeout=15.0
            )

            return {
                'file_id': file_id,
                'filename': filename,
                'success': True,
                'parsed_data': parsed_data,
                'processing_time_ms': int((time.time() - start_time) * 1000)
            }

        except asyncio.TimeoutError:
            return {
                'file_id': file_id,
                'filename': filename,
                'success': False,
                'error_message': "File processing timed out (15 seconds)",
                'processing_time_ms': int((time.time() - start_time) * 1000)
            }
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        return {
            'file_id': file_id,
            'filename': f'unknown_{file_id}',
            'success': False,
            'error_message': str(e),
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
