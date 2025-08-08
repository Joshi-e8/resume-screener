"""
Celery tasks for resume processing
"""

import asyncio
import time
from typing import Dict, List, Any
from celery import current_task
from app.core.celery_app import celery_app
from app.services.google_drive_service import GoogleDriveService
from app.services.resume_parser import ResumeParser
# WebSocket manager no longer needed - using SSE instead
# from app.core.websocket_manager import websocket_manager
from app.models.resume_processing import BatchProcessingJob, ProcessingStatus
import os
from loguru import logger
from datetime import datetime


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
            filename = file_metadata["name"]
            
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
            
            # Clean up
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            
            return {
                'file_id': file_id,
                'filename': filename,
                'success': True,
                'parsed_data': parsed_data,
                'status': 'completed'
            }
            
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
            chunk_results = process_chunk_sync(chunk, credentials_dict, drive_service, parser)
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
                        batch_job.completed_at = datetime.utcnow()
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
                            'completion_time': datetime.utcnow().isoformat(),
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
                    batch_job.completed_at = datetime.utcnow()
                    batch_job.current_status_message = f"Failed: {str(e)}"
                    batch_job.processing_summary = {
                        'error': str(e),
                        'status': ProcessingStatus.FAILED.value,
                        'task_id': task_id,
                        'failure_time': datetime.utcnow().isoformat()
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
                      drive_service: GoogleDriveService, parser: ResumeParser) -> List[Dict[str, Any]]:
    """
    Process a chunk of files synchronously
    """
    results = []
    
    # Create new event loop for this chunk
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Process files concurrently within the chunk
        async def process_files():
            semaphore = asyncio.Semaphore(12)  # Maximum concurrent processing for speed
            
            async def process_single_file(file_id: str):
                async with semaphore:
                    return await process_file_async_fast(file_id, credentials_dict, drive_service, parser)
            
            tasks = [process_single_file(file_id) for file_id in file_ids]
            return await asyncio.gather(*tasks, return_exceptions=True)
        
        chunk_results = loop.run_until_complete(process_files())
        
        # Convert exceptions to error results
        for i, result in enumerate(chunk_results):
            if isinstance(result, Exception):
                results.append({
                    'file_id': file_ids[i],
                    'filename': f'unknown_{file_ids[i]}',
                    'success': False,
                    'error_message': str(result),
                    'processing_time_ms': 0
                })
            else:
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
