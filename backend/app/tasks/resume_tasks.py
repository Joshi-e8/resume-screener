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


# Robust truthy parsing for env/config values like 'True', '1', 'false', etc.
def is_truthy(value) -> bool:
    if isinstance(value, bool):
        return value
    try:
        if isinstance(value, (int, float)):
            return value != 0
        if isinstance(value, str):
            v = value.strip().lower()
            if v in ("1", "true", "yes", "y", "on"):  # truthy strings
                return True
            if v in ("0", "false", "no", "n", "off", ""):
                return False
    except Exception:
        pass
    return bool(value)


@celery_app.task
def test_task():
    """Simple test task"""


@celery_app.task(bind=True)
def process_direct_resume_file(self, resume_id: str, tmp_file_path: str, filename: str, user_id: str, job_id: str | None = None, source: str = "direct") -> dict:
    """
    Process a single directly uploaded resume file (tmp path) in background.
    Updates ResumeMetadata and creates ResumeDetails. Also performs scoring and vector indexing.
    """
    try:
        self.update_state(state='PROGRESS', meta={'current': 0, 'total': 1, 'status': 'Starting...'})

        # Initialize async context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Init DB once
        try:
            loop.run_until_complete(init_database())
        except Exception:
            pass

        parser = ResumeParser()

        # Parse resume with timeout for robustness
        self.update_state(state='PROGRESS', meta={'current': 0, 'total': 1, 'status': 'Parsing resume...'})
        try:
            parsed_data = loop.run_until_complete(asyncio.wait_for(parser.parse_resume(tmp_file_path), timeout=25.0))
        except Exception as pe:
            logger.warning(f"[celery] Direct parse failed for {filename}: {pe}")
            parsed_data = {
                "raw_text": "",
                "contact_info": {},
                "skills": [],
                "education": [],
                "experience": [],
                "summary": "",
            }

        # Optional scoring
        analysis_results = None
        if job_id:
            try:
                job = loop.run_until_complete(Job.get(job_id))
                if job:
                    job_dict = job.model_dump()
                    analysis_results = score_resume_against_job(parsed_data, job_dict, None)
            except Exception as s_e:
                logger.warning(f"[celery] Scoring failed: {s_e}")

        # Update metadata and persist details
        try:
            meta = loop.run_until_complete(ResumeMetadata.get(resume_id))
        except Exception:
            meta = None

        # Safely read contact info (may be None)
        _pd = parsed_data or {}
        contact = _pd.get("contact_info")
        if not isinstance(contact, dict):
            contact = {}
        candidate_email = contact.get("email") or _pd.get("email")
        candidate_name = _pd.get("candidate_name") or _pd.get("name") or contact.get("name")
        key_skills = _pd.get("skills") or []
        # sanitize noisy/fragmented skills and drop location/generic non-skill phrases
        if isinstance(key_skills, list):
            cleaned = []
            drop_terms = {
                "experience", "applications", "tools", "concepts", "frontend", "backend",
                "languages", "frameworks", "databases", "projects", "summary",
                "skills languages frameworks python", "next.js databases", "postgresql frontend tools zustand",
            }
            for s in key_skills:
                if not isinstance(s, str):
                    continue
                t = s.strip()
                if not t:
                    continue
                # drop obvious location-only or comma-separated location blobs
                tl = t.lower()
                if any(x in tl for x in ["kerala", "india", "calicut", "kochi", "wayanad"]):
                    # if the token looks solely like a location phrase, skip
                    if sum(ch.isalpha() for ch in tl) >= len(tl) - 2 and any(x in tl for x in ["kerala", "india", "calicut", "kochi", "wayanad"]):
                        continue
                if len(t) <= 3:
                    continue
                # remove extremely short tokens unless part of common tech patterns
                if any(len(tok) <= 2 for tok in t.split()):
                    if tl not in {"ci", "cd"} and not any(c in t for c in [".", "-", "/"]):
                        continue
                if tl in drop_terms:
                    continue
                cleaned.append(t)
            key_skills = list(dict.fromkeys(cleaned))
        # job-aware enrichment: add job must/nice terms found in raw text
        try:
            if job_id and ((parsed_data or {}).get("raw_text")):
                if 'job_dict' not in locals():
                    try:
                        job = loop.run_until_complete(Job.get(job_id))
                        job_dict = job.model_dump() if job else None
                    except Exception:
                        job_dict = None
                if job_dict:
                    terms = []
                    for fld in ("must_have_skills", "nice_to_have", "required_skills", "preferred_skills"):
                        v = job_dict.get(fld) or []
                        if isinstance(v, str):
                            v = [v]
                        if isinstance(v, list):
                            terms.extend([str(x) for x in v if x])
                    raw = (parsed_data.get("raw_text") or "").lower()
                    add = []
                    for term in terms:
                        t = str(term).strip()
                        if len(t) >= 2 and t.lower() in raw:
                            add.append(t)
                    if add:
                        key_skills = list(dict.fromkeys(list(key_skills) + add))
        except Exception:
            pass
        # fallback derive candidate_name from email or filename
        if not candidate_name:
            try:
                contact = (parsed_data or {}).get("contact_info") or {}
                if not candidate_email:
                    candidate_email = contact.get("email")
                name_from_contact = contact.get("name")
                if name_from_contact and isinstance(name_from_contact, str) and len(name_from_contact.strip()) >= 3:
                    candidate_name = name_from_contact.strip()
                elif candidate_email and isinstance(candidate_email, str):
                    local = candidate_email.split("@")[0]
                    import re as _re
                    parts = [p for p in _re.split(r"[._-]+", local) if p]
                    if parts:
                        candidate_name = " ".join([p[:1].upper() + p[1:] for p in parts])
                if not candidate_name and isinstance(filename, str):
                    import re as _re
                    base = _re.sub(r"\.[^./]+$", "", filename)
                    parts = [p for p in _re.split(r"[._-]+", base) if p]
                    if parts:
                        candidate_name = " ".join([p[:1].upper() + p[1:] for p in parts[:3]])
            except Exception:
                pass

        try:
            if meta:
                # Do not mark COMPLETED yet; set fields and save. We'll mark COMPLETED after details+indexing.
                meta.candidate_email = candidate_email
                meta.candidate_name = candidate_name
                meta.key_skills = key_skills[:20] if isinstance(key_skills, list) else []
                meta.job_id = job_id or meta.job_id
                meta.processing_mode = ProcessingMode.STANDARD
                loop.run_until_complete(meta.save())
            else:
                # Fallback if metadata not created
                meta = ResumeMetadata(
                    file_id=resume_id,
                    filename=filename,
                    user_id=str(user_id),
                    file_size=0,
                    mime_type=None,
                    status=ProcessingStatus.COMPLETED,
                    processing_mode=ProcessingMode.STANDARD,
                    job_id=job_id,
                    candidate_name=candidate_name,
                    candidate_email=candidate_email,
                    key_skills=key_skills[:20] if isinstance(key_skills, list) else [],
                    source=source,
                )
                loop.run_until_complete(meta.insert())
        except Exception as db_e:
            logger.warning(f"[celery] Failed to update metadata: {db_e}")

        # Create details
        try:
            slim = {
                "summary": (parsed_data or {}).get("summary"),
                "skills": (parsed_data or {}).get("skills"),
                "experience": (parsed_data or {}).get("experience"),
                "education": (parsed_data or {}).get("education"),
                "contact_info": (parsed_data or {}).get("contact_info"),
                "title": (parsed_data or {}).get("title"),
                "total_experience_years": (parsed_data or {}).get("total_experience_years"),
            }
            # Build AI payload safely even if scoring returned None or malformed
            # Always build a dict to avoid downstream .get on None
            overall = None
            scoring_obj = analysis_results if isinstance(analysis_results, dict) else {}
            try:
                overall = scoring_obj.get("overall_score")
                if overall is None:
                    overall = (scoring_obj.get("derived") or {}).get("server_check_overall")
            except Exception:
                overall = None
            ai_payload = {
                "ai_overall_score": overall,
                "ai_scoring": scoring_obj,
            }

            details = ResumeDetails(
                resume_id=str(meta.id),
                raw_text=None,
                parsed_data=slim,
                analysis_results=ai_payload,
            )
            loop.run_until_complete(details.insert())
        except Exception as db2_e:
            logger.warning(f"[celery] Failed to persist details: {db2_e}")

        # Vector indexing
        try:
            from app.vector.store import upsert_resume_chunks, Chunk, get_mode
            chunks: list[Chunk] = []
            def _chunkify(text: str, section: str, size: int = 1200, overlap: int = 200):
                if not text:
                    return
                n = len(text)
                pos = 0
                while pos < n:
                    end = min(n, pos + size)
                    chunks.append(Chunk(text=text[pos:end], section=section, chunk_index=len(chunks)))
                    if end == n:
                        break
                    pos = end - overlap
            summary = (parsed_data or {}).get("summary") or ""
            skills_text = ", ".join((parsed_data or {}).get("skills") or [])
            raw_text = (parsed_data or {}).get("raw_text") or ""
            _chunkify(summary, 'summary')
            _chunkify(skills_text, 'skills')
            _chunkify(raw_text, 'raw_text')
            try:
                inserted = upsert_resume_chunks(str(meta.id), chunks, user_id=str(user_id or 'unknown'))
                logger.info(f"[vector] Upserted {inserted} chunks for direct file {filename} ({get_mode()})")
            except Exception as vex:
                logger.warning(f"[vector] Upsert failed for {filename}: {vex}")
        except Exception as vex_all:
            logger.warning(f"[vector] Indexing skipped: {vex_all}")

        # Mark metadata COMPLETED now that details created and indexing attempted
        try:
            if meta:
                meta.status = ProcessingStatus.COMPLETED
                meta.processing_completed_at = datetime.now(timezone.utc)
                loop.run_until_complete(meta.save())
        except Exception:
            pass

        # Cleanup tmp file
        try:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        except Exception:
            pass

        return {
            'resume_id': str(meta.id) if meta else resume_id,
            'filename': filename,
            'success': True,
            'status': 'completed',
        }

    except Exception as e:
        # Attempt to set metadata to FAILED
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                m = loop.run_until_complete(ResumeMetadata.get(resume_id))
            except Exception:
                m = None
            if m:
                m.status = ProcessingStatus.FAILED
                m.error_message = str(e)
                m.processing_completed_at = datetime.now(timezone.utc)
                loop.run_until_complete(m.save())
        except Exception:
            pass
        try:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        except Exception:
            pass
        # Log full traceback to identify root cause precisely
        logger.exception("[celery] Direct resume processing failed")
        return {'resume_id': resume_id, 'filename': filename, 'success': False, 'error_message': str(e)}

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
                if is_truthy(getattr(settings, "ENABLE_SCORING", 1)) and job_id:
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
                # Slim stored data: drop raw_text and trim parsed_data to essentials
                slim = {
                    "summary": parsed_data.get("summary"),
                    "skills": parsed_data.get("skills"),
                    "experience": parsed_data.get("experience"),
                    "education": parsed_data.get("education"),
                    "contact_info": parsed_data.get("contact_info"),
                    "title": parsed_data.get("title"),
                    "total_experience_years": parsed_data.get("total_experience_years"),
                }
                details = ResumeDetails(
                    resume_id=str(saved_meta.id),
                    raw_text=None,
                    parsed_data=slim,
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


@celery_app.task(bind=True, soft_time_limit=3300, time_limit=3600)
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


            # Reset LLM failure gate at the start of each chunk to avoid carry-over between chunks
            try:
                from app.scoring.llm_client import reset_llm_gate
                reset_llm_gate()
            except Exception:
                pass

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

        # Parse all files (ultra fast path)
        chunk_results = loop.run_until_complete(process_files_ultra_fast())

        # Upsert vector chunks BEFORE scoring so retrieval works in same run
        try:
            from app.vector.store import upsert_resume_chunks, Chunk, get_mode
            logger.info("[vector] Pre-score upsert starting for parsed results…")
            for result in chunk_results:
                if isinstance(result, Exception):
                    continue
                if result.get('success'):
                    pd = result.get('parsed_data') or {}
                    summary = (pd.get('summary') or '')
                    skills_text = ', '.join(pd.get('skills') or [])
                    raw_text = pd.get('raw_text') or ''
                    chunks: list[Chunk] = []
                    def _chunkify(text: str, section: str, size: int = 1200, overlap: int = 200):
                        if not text:
                            return
                        n = len(text)
                        pos = 0
                        while pos < n:
                            end = min(n, pos + size)
                            chunks.append(Chunk(text=text[pos:end], section=section, chunk_index=len(chunks)))
                            if end == n:
                                break
                            pos = end - overlap
                    _chunkify(summary, 'summary')
                    _chunkify(skills_text, 'skills')
                    _chunkify(raw_text, 'raw_text')
                    try:
                        inserted = upsert_resume_chunks(str(result.get('file_id')), chunks, user_id=str(user_id or 'unknown'))
                        logger.info(f"[vector] Upserted {inserted} chunks for {result.get('filename')} ({get_mode()})")
                    except Exception as vex:
                        logger.warning(f"[vector] Upsert (pre-score) failed for {result.get('filename')}: {vex}")
        except Exception as vex_all:
            logger.warning(f"[vector] Pre-scoring vector setup failed: {vex_all}")

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
                    if result.get('success') and is_truthy(getattr(settings, "ENABLE_SCORING", 1)):
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

                        # Debug preview of jobs being considered
                        try:
                            preview = []
                            for jd in (jobs_cache or [])[:5]:
                                preview.append(f"{getattr(jd, 'id', '?')}|{getattr(jd, 'title', '')}")
                            logger.info(f"🧭 TASK: Jobs considered: {len(jobs_cache or [])} -> {', '.join(preview)}")
                        except Exception:
                            pass

                        logger.info(f"🔎 TASK: Scoring {result.get('filename')} across {len(jobs_cache or [])} job(s)")
                        matching_scores: dict[str, float] = {}
                        per_job_scoring: dict[str, dict] = {}
                        best_job = None
                        best_scoring = None
                        best_overall = None

                        for jd in (jobs_cache or []):
                            try:
                                scoring = score_resume_against_job(result['parsed_data'], jd.model_dump())
                                # Prefer explicit overall; fallback to server_check_overall
                                overall = scoring.get('overall_score')
                                if overall is None:
                                    overall = scoring.get('derived', {}).get('server_check_overall')
                                try:
                                    overall_f = float(overall) if overall is not None else 0.0
                                except Exception:
                                    overall_f = 0.0
                                matching_scores[str(jd.id)] = overall_f
                                per_job_scoring[str(jd.id)] = scoring
                                if best_overall is None or overall_f > (best_overall or 0):
                                    best_overall = overall_f
                                    best_scoring = scoring
                                    best_job = jd
                            except Exception as e:
                                logger.warning(f"⚠️ TASK: Scoring failed for job {getattr(jd, 'id', '?')}: {e}")

                        if best_scoring is not None:
                            logger.info(f"🏁 TASK: Selected job {getattr(best_job, 'id', '?')} with score {best_overall} for {result.get('filename')}")
                            result['ai_scoring'] = best_scoring
                            result['ai_overall_score'] = best_overall
                            result['matching_scores'] = matching_scores
                            result['per_job_scoring'] = per_job_scoring
                            try:
                                result['job_id'] = str(best_job.id) if best_job else result.get('job_id')
                            except Exception:
                                pass
                        else:
                            logger.info(f"ℹ️ TASK: No scoring produced for {result.get('filename')} (no jobs or scorer returned None)")
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
                        # sanitize skills before saving
                        _skills = (parsed_data.get("skills") or [])
                        if isinstance(_skills, list):
                            _clean = []
                            for s in _skills:
                                if not isinstance(s, str):
                                    continue
                                t = s.strip()
                                if len(t) <= 3:
                                    continue
                                if any(len(tok) <= 2 for tok in t.split()):
                                    if t.lower() not in {"ci", "cd"} and not any(c in t for c in [".", "-","/"]):
                                        continue
                                _clean.append(t)
                            _skills = list(dict.fromkeys(_clean))

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
                            key_skills=_skills,
                            file_size=file_size,
                            mime_type=mime_type,
                        )
                        saved_meta = loop.run_until_complete(meta.insert())

                        analysis_results = {}
                        if result.get('ai_scoring') is not None:
                            analysis_results["ai_scoring"] = result.get('ai_scoring')
                        if result.get('ai_overall_score') is not None:
                            analysis_results["ai_overall_score"] = result.get('ai_overall_score')

                        # Slim stored data: drop raw_text and trim parsed_data to essentials
                        slim = {
                            "summary": parsed_data.get("summary"),
                            "skills": parsed_data.get("skills"),
                            "experience": parsed_data.get("experience"),
                            "education": parsed_data.get("education"),
                            "contact_info": parsed_data.get("contact_info"),
                            "title": parsed_data.get("title"),
                            "total_experience_years": parsed_data.get("total_experience_years"),
                        }
                        details = ResumeDetails(
                            resume_id=str(saved_meta.id),
                            raw_text=None,
                            parsed_data=slim,
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
