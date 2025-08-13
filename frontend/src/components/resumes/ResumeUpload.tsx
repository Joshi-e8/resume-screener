"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Archive,
  Files,
  File,
  Loader2,
  CloudUpload,
  Zap,
  Cloud,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  setUploadMode,
  setSelectedFiles,
  setSelectedGoogleDriveFiles,
  setZipContents,
  setIsUploading,
  setGoogleDriveUploading,
  setUploadProgress,
  setUploadSuccess,
  setErrors,
  setIsAsyncProcessing,
  setProcessingProgress,
  setBatchId,
  setWsConnected,
  setUserId,
  setIsDragOver,
  setFolderProcessed,
} from "@/store/slices/resumeUploadSlice";
import { EnhancedGoogleDrivePicker } from "./EnhancedGoogleDrivePicker";
import {
  googleDriveService,
  GoogleDriveBulkUploadResponse,
  ProgressUpdate,
} from "@/lib/services/googleDriveServices";
import { websocketService } from "@/lib/services/websocketService";
import GoogleDriveService from "@/lib/services/googleDriveServices";
import useResumeServices from "@/lib/services/resumeServices";
import useJobServices from "@/lib/services/jobServices";

interface ResumeUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

function ResumeUpload({ onFilesUploaded }: ResumeUploadProps) {
  const dispatch = useAppDispatch();

  // Get all state from Redux store
  const {
    uploadMode,
    isDragOver,
    selectedFiles,
    uploadProgress,
    errors,
    isUploading,
    uploadSuccess,
    zipContents,
    selectedGoogleDriveFiles,
    googleDriveUploading,
    processingProgress,
    batchId,
    isAsyncProcessing,
    wsConnected,
    userId,
    folderProcessed,
  } = useAppSelector((state) => state.resumeUpload);

  // Optional job selection (kept inside upload component for clarity)
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const { getAllJobs } = useJobServices();
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getAllJobs({ page: 1, size: 100 });
        if (isMounted) setJobs(data?.records || []);
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
    // intentionally run once on mount to avoid re-fetch loops
  }, []);


  // Enhanced tab/window switching protection during processing
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      console.log(`👁️ Page visibility changed: ${document.visibilityState}`);

      if (document.visibilityState === 'visible' && isAsyncProcessing) {
        console.log('👁️ Page became visible during processing, checking WebSocket...');

        // Clear any pending reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }

        // Immediate connection check when page becomes visible
        if (!wsConnected) {
          console.log('🔄 WebSocket disconnected, attempting immediate reconnection...');
          console.log(`🔧 Using stored userId: ${userId}`);
          websocketService.connect(userId).then(() => {
            dispatch(setWsConnected(true));
            console.log('✅ WebSocket reconnected after page became visible');
          }).catch((error) => {
            console.error('❌ Failed to reconnect WebSocket after page became visible:', error);
          });
        }
      } else if (document.visibilityState === 'hidden' && isAsyncProcessing) {
        console.log('👁️ Page became hidden during processing, setting up reconnect strategy...');

        // Set up delayed reconnection attempt for when page becomes visible again
        reconnectTimeout = setTimeout(() => {
          if (document.visibilityState === 'visible' && isAsyncProcessing && !wsConnected) {
            console.log('🔄 Delayed reconnection attempt after page was hidden...');
            console.log(`🔧 Using stored userId: ${userId}`);
            websocketService.connect(userId).then(() => {
              dispatch(setWsConnected(true));
              console.log('✅ WebSocket reconnected via delayed attempt');
            }).catch((error) => {
              console.error('❌ Failed delayed WebSocket reconnection:', error);
            });
          }
        }, 2000); // Wait 2 seconds after page becomes visible
      }
    };

    const handleWindowFocus = () => {
      console.log('🪟 Window gained focus during processing');
      if (isAsyncProcessing && !wsConnected) {
        console.log('🔄 Window focused, attempting WebSocket reconnection...');
        console.log(`🔧 Using stored userId: ${userId}`);
        websocketService.connect(userId).then(() => {
          dispatch(setWsConnected(true));
          console.log('✅ WebSocket reconnected after window focus');
        }).catch((error) => {
          console.error('❌ Failed to reconnect WebSocket after window focus:', error);
        });
      }
    };

    const handleWindowBlur = () => {
      console.log('🪟 Window lost focus during processing');
      // Don't disconnect, but log for debugging
    };

    // Detect browser/system sleep/wake cycles
    let lastActiveTime = Date.now();
    const handleSleepWake = () => {
      const now = Date.now();
      const timeDiff = now - lastActiveTime;

      // If more than 60 seconds have passed, likely system was sleeping
      if (timeDiff > 60000 && isAsyncProcessing) {
        console.log('😴 System wake detected during processing, reconnecting WebSocket...');
        if (!wsConnected) {
          console.log(`🔧 Using stored userId: ${userId}`);
          websocketService.connect(userId).then(() => {
            dispatch(setWsConnected(true));
            console.log('✅ WebSocket reconnected after system wake');
          }).catch((error) => {
            console.error('❌ Failed to reconnect WebSocket after system wake:', error);
          });
        }
      }
      lastActiveTime = now;
    };

    // Check for sleep/wake every 30 seconds
    const sleepWakeInterval = setInterval(handleSleepWake, 30000);

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      clearInterval(sleepWakeInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isAsyncProcessing, wsConnected, userId, dispatch]);

  const allowedTypes = useMemo(
    () => [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    []
  );
  const allowedZipTypes = useMemo(
    () => ["application/zip", "application/x-zip-compressed"],
    []
  );
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxZipSize = 50 * 1024 * 1024; // 50MB

  // Handle Google Drive OAuth callback
  useEffect(() => {
    const accessToken = GoogleDriveService.handleOAuthCallback();
    if (accessToken) {
      GoogleDriveService.storeAccessToken(accessToken);
      googleDriveService.setAccessToken(accessToken);
      dispatch(setUploadMode("google-drive"));
    }
  }, [dispatch]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check if it's a ZIP file
      if (
        allowedZipTypes.includes(file.type) ||
        file.name.toLowerCase().endsWith(".zip")
      ) {
        if (uploadMode !== "zip") {
          return `${file.name}: ZIP files are only allowed in ZIP upload mode`;
        }
        if (file.size > maxZipSize) {
          return `${file.name}: ZIP file size must be less than 50MB`;
        }
        return null;
      }

      // Check regular resume files
      if (!allowedTypes.includes(file.type)) {
        return `${file.name}: Only PDF, DOC, and DOCX files are allowed`;
      }
      if (file.size > maxFileSize) {
        return `${file.name}: File size must be less than 10MB`;
      }

      // In single mode, only allow one file
      if (uploadMode === "single" && selectedFiles.length >= 1) {
        return `Single upload mode: Only one file allowed at a time`;
      }

      return null;
    },
    [
      uploadMode,
      selectedFiles.length,
      allowedTypes,
      allowedZipTypes,
      maxFileSize,
      maxZipSize,
    ]
  );

  // Function to simulate ZIP file extraction (in real app, this would use a ZIP library)
  const processZipFile = async (_zipFile: File): Promise<File[]> => {
    // Mock ZIP processing - in real implementation, use JSZip or similar
    const mockFiles: File[] = [];
    const fileCount = Math.floor(Math.random() * 5) + 2; // 2-6 files

    for (let i = 0; i < fileCount; i++) {
      const mockFileName = `resume_${i + 1}.pdf`;
      const mockFileSize = Math.floor(Math.random() * 2000000) + 500000; // 0.5-2.5MB

      // Create a mock file object that mimics the File interface
      const mockFile = {
        name: mockFileName,
        size: mockFileSize,
        type: "application/pdf",
        lastModified: Date.now(),
        webkitRelativePath: "",
        stream: () => new ReadableStream(),
        text: () => Promise.resolve("mock content"),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        slice: () => new Blob(),
      } as File;

      mockFiles.push(mockFile);
    }

    return mockFiles;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
          continue;
        }

        // Handle ZIP files
        if (
          allowedZipTypes.includes(file.type) ||
          file.name.toLowerCase().endsWith(".zip")
        ) {
          try {
            const extractedFiles = await processZipFile(file);
            dispatch(setZipContents(extractedFiles));
            validFiles.push(...extractedFiles);
          } catch {
            newErrors.push(`${file.name}: Failed to extract ZIP file`);
          }
        } else {
          validFiles.push(file);
        }
      }

      dispatch(setErrors(newErrors));
      if (validFiles.length > 0) {
        if (uploadMode === "single") {
          dispatch(setSelectedFiles([validFiles[0]])); // Only keep the first file in single mode
        } else {
          dispatch(setSelectedFiles([...selectedFiles, ...validFiles]));
        }
      }
    },
    [uploadMode, allowedZipTypes, validateFile, selectedFiles, dispatch]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dispatch(setIsDragOver(true));
  }, [dispatch]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dispatch(setIsDragOver(false));
  }, [dispatch]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dispatch(setIsDragOver(false));
      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [dispatch, handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    dispatch(setSelectedFiles(selectedFiles.filter((_, i) => i !== index)));
  };

  const { uploadSingleResume } = useResumeServices();

  const simulateUpload = async (file: File, jobId?: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        await uploadSingleResume(file, selectedJobId || jobId, (e) => {
          const total = e.total || file.size || 1;
          const loaded = e.loaded || 0;
          const progress = Math.min(100, Math.round((loaded / total) * 100));
          dispatch(setUploadProgress({ ...uploadProgress, [file.name]: progress }));
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    dispatch(setIsUploading(true));
    dispatch(setUploadSuccess(false));
    dispatch(setErrors([]));

    try {
      if (!selectedJobId) {
        dispatch(setErrors(["Please select a position before uploading."]));
        dispatch(setIsUploading(false));
        return;
      }

      const jobId = undefined; // keep UI unchanged; can be integrated with SmartJobAssociation later

      for (const file of selectedFiles) {
        await simulateUpload(file, jobId);
      }

      onFilesUploaded(selectedFiles);

      dispatch(setUploadSuccess(true));

      setTimeout(() => {
        dispatch(setSelectedFiles([]));
        dispatch(setUploadProgress({}));
        dispatch(setUploadSuccess(false));
        dispatch(setZipContents([]));
      }, 2000);
    } catch (e) {
      dispatch(setErrors(["Upload failed. Please try again."]));
    } finally {
      dispatch(setIsUploading(false));
    }
  };

  // Handle Google Drive file upload with smart processing
  const handleGoogleDriveUpload = async () => {
    if (selectedGoogleDriveFiles.length === 0) return;

    console.log('🚀 Starting Google Drive upload...');
    dispatch(setGoogleDriveUploading(true));
    dispatch(setErrors([]));
    dispatch(setProcessingProgress(null));
    console.log('📊 googleDriveUploading set to true');

    try {
      // Extract file IDs for bulk upload
      const fileIds = selectedGoogleDriveFiles.map(file => file.id);
      const batchSize = fileIds.length;

      // Determine if we should use async processing
      const useAsync = batchSize > 10;
      const currentUserId = `user_${Date.now()}`; // Generate a temporary user ID
      dispatch(setUserId(currentUserId)); // Store it in state for reconnections

      // Always show processing state when starting
      dispatch(setIsAsyncProcessing(true));
      dispatch(setProcessingProgress({
        completed: 0,
        total: batchSize,
        status: 'processing'
      }));

      if (useAsync) {
        // Setup WebSocket connection for progress tracking
        try {
          await websocketService.connect(currentUserId);
          dispatch(setWsConnected(true));

          // Setup progress callback
          const progressCallback = (progress: ProgressUpdate) => {
            console.log('📡 Received WebSocket progress update:', progress);
            console.log('📊 Current processing progress state:', processingProgress);

            // Validate progress data
            if (!progress || typeof progress !== 'object') {
              console.error('❌ Invalid progress data received:', progress);
              return;
            }

            console.log('🔄 Updating progress state...');
            dispatch(setProcessingProgress(progress));
            console.log('✅ Progress state updated');

            if (progress.status === 'completed') {
              console.log('🎉 Processing completed, calling completion handler...');
              handleAsyncProcessingComplete(progress);
            }
          };

          // Setup connection status callback
          const connectionCallback = (connected: boolean) => {
            console.log('🔗 WebSocket connection status changed:', connected);
            dispatch(setWsConnected(connected));
          };

          websocketService.onProgress(progressCallback);
          websocketService.onConnectionChange(connectionCallback);

          // Cleanup function
          const cleanup = () => {
            websocketService.offProgress(progressCallback);
            websocketService.offConnectionChange(connectionCallback);
            websocketService.disconnect();
            dispatch(setWsConnected(false));
          };

          // Store cleanup function for later use
          (window as any).wsCleanup = cleanup;

        } catch (wsError) {
          console.warn('WebSocket connection failed, proceeding without real-time updates:', wsError);
        }
      }

      // Use bulk upload API with async processing option
      const response = await googleDriveService.bulkUploadResumes(
        fileIds,
        undefined, // jobId
        currentUserId,
        useAsync
      );

      if (response.async_processing) {
        // Async processing started - update batch ID
        dispatch(setBatchId(response.batch_id || null));

        // Ensure WebSocket stays connected during processing
        if (response.batch_id) {
          ensureWebSocketConnection(currentUserId);
        }
      } else {
        // Synchronous processing completed
        handleSyncProcessingComplete(response);
      }

    } catch (error) {
      dispatch(setErrors([
        "Failed to upload files from Google Drive. Please try again.",
      ]));
      dispatch(setGoogleDriveUploading(false));
      dispatch(setIsAsyncProcessing(false));
    }
  };

  // Handle completion of synchronous processing
  const handleSyncProcessingComplete = (response: GoogleDriveBulkUploadResponse) => {
    // Check for errors
    const failedUploads = response.results.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      dispatch(setErrors(failedUploads.map((f) => `${f.filename}: ${f.error_message}`)));
    }

    // Get successful uploads
    const successfulUploads = response.results.filter((r) => r.success);
    if (successfulUploads.length > 0) {
      dispatch(setUploadSuccess(true));

      // Publish a completion progress payload so ResumeGrid can render real results
      const progressPayload: ProgressUpdate = {
        completed: response.total_files,
        total: response.total_files,
        results: response.results as any,
        status: 'completed',
        successful_files: response.successful_files,
        failed_files: response.failed_files,
      } as any;
      dispatch(setProcessingProgress(progressPayload));

      // Convert Google Drive files to File objects for callback (existing behavior)
      const mockFiles = successfulUploads.map((result) => {
        const file = selectedGoogleDriveFiles.find(
          (f) => f.id === result.file_id
        );
        return {
          name: result.filename,
          size: parseInt(file?.size || "0"),
          type: "application/pdf",
          lastModified: Date.now(),
        } as File;
      });

      // Persist results locally so ResumeGrid can render after navigation/refresh
      try {
        localStorage.setItem('latestResumeResults', JSON.stringify(response.results || []));
      } catch {}

      onFilesUploaded(mockFiles);

      // Clear selection after delay (do not clear processingProgress)
      setTimeout(() => {
        dispatch(setSelectedGoogleDriveFiles([]));
        dispatch(setUploadSuccess(false));
      }, 2000);
    }

    dispatch(setGoogleDriveUploading(false));
  };

  // Ensure WebSocket connection stays active during processing
  const ensureWebSocketConnection = async (userId: string) => {
    console.log('🔗 Ensuring WebSocket connection for processing...');

    // Force reconnection to ensure fresh connection
    console.log('🔄 Forcing WebSocket reconnection for processing...');
    try {
      websocketService.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await websocketService.connect(userId);
      dispatch(setWsConnected(true));
      console.log('✅ WebSocket connected successfully for processing');
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      dispatch(setWsConnected(false));
    }

    // Set up aggressive connection monitoring during processing
    const connectionMonitor = setInterval(async () => {
      console.log('🔍 Checking WebSocket connection status...');

      if (!wsConnected) {
        console.log('🔄 WebSocket disconnected during processing, attempting reconnect...');
        try {
          await websocketService.connect(userId);
          dispatch(setWsConnected(true));
          console.log('✅ WebSocket reconnected during processing');
        } catch (error) {
          console.error('❌ Failed to reconnect WebSocket during processing:', error);
          dispatch(setWsConnected(false));
        }
      } else {
        console.log('✅ WebSocket connection is active');
      }
    }, 5000); // Check every 5 seconds (more aggressive)

    // Store monitor reference for cleanup
    (window as any).connectionMonitor = connectionMonitor;

    // Clear monitor after 30 minutes (extended for large batches)
    setTimeout(() => {
      console.log('⏰ Stopping connection monitor after timeout');
      clearInterval(connectionMonitor);
      (window as any).connectionMonitor = null;
    }, 1800000); // 30 minutes
  };

  // Handle completion of asynchronous processing
  const handleAsyncProcessingComplete = (progress: ProgressUpdate) => {
    console.log('🎉 Async processing completed:', progress);

    // Update progress state with completion data
    console.log('📊 Updating progress state with completion data...');
    dispatch(setProcessingProgress(progress));

    // Stop any ongoing connection monitoring
    if ((window as any).connectionMonitor) {
      console.log('🛑 Stopping WebSocket connection monitor');
      clearInterval((window as any).connectionMonitor);
      (window as any).connectionMonitor = null;
    }

    if (progress.results) {
      const successfulUploads = progress.results.filter((r) => r.success);
      const failedUploads = progress.results.filter((r) => !r.success);

      if (failedUploads.length > 0) {
        dispatch(setErrors(failedUploads.map((f) => `${f.filename}: ${f.error_message}`)));
      }

      if (successfulUploads.length > 0) {
        dispatch(setUploadSuccess(true));

        const mockFiles = successfulUploads.map((result) => {
          const file = selectedGoogleDriveFiles.find(
            (f) => f.id === result.file_id
          );
          return {
            name: result.filename,
            size: parseInt(file?.size || "0"),
            type: "application/pdf",
            lastModified: Date.now(),
          } as File;
        });

        onFilesUploaded(mockFiles);
      }
    }

    // Cleanup - but keep processing state visible for a moment
    dispatch(setGoogleDriveUploading(false));

    // Delay cleanup to show completion state
    setTimeout(() => {
      console.log('🧹 Cleaning up async processing state...');
      dispatch(setIsAsyncProcessing(false));
      dispatch(setBatchId(null));
      dispatch(setSelectedGoogleDriveFiles([]));
      dispatch(setUploadSuccess(false));
      dispatch(setProcessingProgress(null));
    }, 5000); // Increased to 5 seconds to show completion

    // Cleanup WebSocket
    if ((window as any).wsCleanup) {
      (window as any).wsCleanup();
      delete (window as any).wsCleanup;
    }
  };

  return (
    <div className="p-6">
      {/* Upload Mode Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Upload Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Google Drive Upload */}
          <button
            onClick={() => {
              dispatch(setUploadMode("google-drive"));
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === "google-drive"
                ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  uploadMode === "google-drive" ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <Cloud
                  className={`w-4 h-4 ${
                    uploadMode === "google-drive"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <h4 className="font-medium text-gray-900">Google Drive</h4>
            </div>
            <p className="text-sm text-gray-600">
              Upload from your Google Drive
            </p>
          </button>
          {/* Single Upload */}
          <button
            onClick={() => {
              dispatch(setUploadMode("single"));
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === "single"
                ? "border-yellow-500 bg-yellow-50 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  uploadMode === "single" ? "bg-yellow-500" : "bg-gray-100"
                }`}
              >
                <File
                  className={`w-4 h-4 ${
                    uploadMode === "single" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <h4 className="font-medium text-gray-900">Single Upload</h4>
            </div>
            <p className="text-sm text-gray-600">Upload one resume at a time</p>
          </button>

          {/* Multiple Upload */}
          <button
            onClick={() => {
              dispatch(setUploadMode("multiple"));
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === "multiple"
                ? "border-yellow-500 bg-yellow-50 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  uploadMode === "multiple" ? "bg-yellow-500" : "bg-gray-100"
                }`}
              >
                <Files
                  className={`w-4 h-4 ${
                    uploadMode === "multiple" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <h4 className="font-medium text-gray-900">Multiple Upload</h4>
            </div>
            <p className="text-sm text-gray-600">
              Upload multiple resumes at once
            </p>
          </button>

          {/* ZIP Upload */}
          <button
            onClick={() => {
              dispatch(setUploadMode("zip"));
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === "zip"
                ? "border-yellow-500 bg-yellow-50 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  uploadMode === "zip" ? "bg-yellow-500" : "bg-gray-100"
                }`}
              >
                <Archive
                  className={`w-4 h-4 ${
                    uploadMode === "zip" ? "text-white" : "text-gray-600"
                  }`}
                />
              </div>
              <h4 className="font-medium text-gray-900">ZIP Upload</h4>
            </div>
            <p className="text-sm text-gray-600">
              Upload a ZIP file containing multiple resumes
            </p>
          </button>
        </div>
      </div>

      {/* Optional Job Association (inside upload component for clarity) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Associate with position (required)
        </label>
        <select
          required
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">— None —</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
      </div>


      {/* Upload Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              {uploadMode === "single" && "Single Upload Instructions"}
              {uploadMode === "multiple" && "Multiple Upload Instructions"}
              {uploadMode === "zip" && "ZIP Upload Instructions"}
              {uploadMode === "google-drive" &&
                "Google Drive Upload Instructions"}
            </h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              {uploadMode === "single" && (
                <>
                  <li>• Upload one resume file (PDF, DOC, DOCX)</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Perfect for individual candidate processing</li>
                </>
              )}
              {uploadMode === "multiple" && (
                <>
                  <li>• Upload multiple resume files at once</li>
                  <li>• Supported formats: PDF, DOC, DOCX</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Drag & drop multiple files or select them</li>
                </>
              )}
              {uploadMode === "zip" && (
                <>
                  <li>• Upload a ZIP file containing resume files</li>
                  <li>• ZIP file should contain PDF, DOC, or DOCX files</li>
                  <li>• Maximum ZIP size: 50MB</li>
                  <li>• Files will be automatically extracted and processed</li>
                </>
              )}
              {uploadMode === "google-drive" && (
                <>
                  <li>• Connect to your Google Drive account</li>
                  <li>• Browse and select multiple resume files from your Drive</li>
                  <li>• Supported formats: PDF, DOC, DOCX</li>
                  <li>• All files are processed together in bulk for efficiency</li>
                  <li>• Files are downloaded and processed securely</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone - Only for non-Google Drive modes */}
      {uploadMode !== "google-drive" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 transform ${
            isDragOver
              ? "border-yellow-400 bg-yellow-50 scale-105 shadow-lg"
              : uploadSuccess
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input
            type="file"
            multiple={uploadMode !== "single"}
            accept={uploadMode === "zip" ? ".zip" : ".pdf,.doc,.docx"}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 ${
                isDragOver
                  ? "bg-yellow-200 scale-110"
                  : uploadSuccess
                  ? "bg-green-200"
                  : "bg-yellow-100"
              }`}
            >
              {uploadSuccess ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : isDragOver ? (
                <CloudUpload className="w-8 h-8 text-yellow-600 animate-bounce" />
              ) : uploadMode === "zip" ? (
                <Archive className="w-8 h-8 text-yellow-600" />
              ) : (
                <Upload className="w-8 h-8 text-yellow-600" />
              )}
            </div>

            <div>
              <h3
                className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                  isDragOver
                    ? "text-yellow-700"
                    : uploadSuccess
                    ? "text-green-700"
                    : "text-gray-900"
                }`}
              >
                {uploadSuccess ? (
                  "Files uploaded successfully!"
                ) : isDragOver ? (
                  "Release to upload files"
                ) : (
                  <>
                    {uploadMode === "single" && "Drop your resume file here"}
                    {uploadMode === "multiple" && "Drop your resume files here"}
                    {uploadMode === "zip" && "Drop your ZIP file here"}
                  </>
                )}
              </h3>
              {!uploadSuccess && (
                <>
                  <p
                    className={`mb-4 transition-colors duration-300 ${
                      isDragOver ? "text-yellow-700" : "text-gray-600"
                    }`}
                  >
                    or{" "}
                    <span className="text-yellow-600 font-medium">browse</span>{" "}
                    to choose
                    {uploadMode === "single"
                      ? " a file"
                      : uploadMode === "zip"
                      ? " a ZIP file"
                      : " files"}
                  </p>
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      isDragOver ? "text-yellow-600" : "text-gray-500"
                    }`}
                  >
                    {uploadMode === "single" &&
                      "Supports PDF, DOC, DOCX • Max 10MB"}
                    {uploadMode === "multiple" &&
                      "Supports PDF, DOC, DOCX • Max 10MB per file"}
                    {uploadMode === "zip" && "Supports ZIP files • Max 50MB"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Picker */}
      {uploadMode === "google-drive" && (
        <EnhancedGoogleDrivePicker
          onFilesSelected={(files) => {
            dispatch(setSelectedGoogleDriveFiles(files));
            if (files.length > 0) {
              dispatch(setFolderProcessed(true));
            }
          }}
          onAuthRequired={() => {
            dispatch(setErrors([
              "Google Drive authentication required. Please try again.",
            ]));
          }}
          multiSelect={true}
          className="mb-6"
          hideEmptyState={true}
        />
      )}

      {/* Processing Summary - Show BELOW picker when files selected OR processing */}
      {uploadMode === "google-drive" && selectedGoogleDriveFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          {!isAsyncProcessing ? (
            // Ready to Process State
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-900">
                    Ready to Process {selectedGoogleDriveFiles.length} Files
                  </h3>
                  <p className="text-sm text-blue-700">
                    Files will be processed in the background - safe to switch tabs
                  </p>
                </div>
              </div>
              <button
                onClick={handleGoogleDriveUpload}
                disabled={googleDriveUploading || uploadSuccess}
                className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300"
              >
                {googleDriveUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Smart Process
                  </>
                )}
              </button>
            </div>
          ) : (
            // Processing State
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Processing {selectedGoogleDriveFiles.length} Files
                    </h3>
                    <p className="text-sm text-blue-700">
                      {processingProgress ?
                        `${processingProgress.completed} of ${processingProgress.total} files processed` :
                        'Initializing processing...'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-900">
                    {processingProgress ?
                      `${Math.round((processingProgress.completed / processingProgress.total) * 100)}%` :
                      '0%'
                    }
                  </div>
                  <div className="text-xs text-blue-700">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: processingProgress ?
                      `${(processingProgress.completed / processingProgress.total) * 100}%` :
                      '0%'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">Upload Errors</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Contents Preview */}
      {uploadMode === "zip" && zipContents.length > 0 && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">
                ZIP File Extracted Successfully
              </h4>
            </div>
            <p className="text-sm text-green-700">
              Found {zipContents.length} resume files in the ZIP archive
            </p>
          </div>

          <h4 className="font-medium text-gray-900 mb-4">
            Extracted Files ({zipContents.length})
          </h4>
          <div className="space-y-3 mb-4">
            {zipContents.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-xs text-blue-700">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  From ZIP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files or Google Drive Files - Hide during processing or after folder processing */}
      {!isAsyncProcessing && !googleDriveUploading && !folderProcessed && (selectedFiles.length > 0 ||
        (uploadMode === "google-drive" &&
          selectedGoogleDriveFiles.length > 0)) && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">
            {uploadMode === "zip"
              ? "Ready to Upload"
              : uploadMode === "google-drive"
              ? "Selected from Google Drive"
              : "Selected Files"}
            (
            {uploadMode === "google-drive"
              ? selectedGoogleDriveFiles.length
              : selectedFiles.length}
            )
          </h4>
          <div className="space-y-3">
            {/* Regular Files */}
            {uploadMode !== "google-drive" &&
              selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {uploadProgress[file.name] !== undefined ? (
                      <div className="flex items-center gap-3">
                        {uploadProgress[file.name] === 100 ? (
                          <div className="flex items-center gap-2 animate-bounce">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              Complete!
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 relative">
                              <div className="w-full h-full rounded-full border-2 border-gray-200"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-yellow-600">
                                  {Math.round(uploadProgress[file.name] || 0)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300 ease-out"
                                  style={{
                                    width: `${uploadProgress[file.name] || 0}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                Uploading...{" "}
                                {Math.round(uploadProgress[file.name] || 0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {/* Google Drive Files */}
            {uploadMode === "google-drive" &&
              selectedGoogleDriveFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h5>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>
                          {googleDriveService.formatFileSize(file.size)}
                        </span>
                        <span>•</span>
                        <span>Google Drive</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {googleDriveUploading ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                        </div>
                        <span className="text-sm text-blue-600">
                          Processing...
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          dispatch(setSelectedGoogleDriveFiles(
                            selectedGoogleDriveFiles.filter((f) => f.id !== file.id)
                          ));
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Upload Button - Show when files are selected and not processing */}
          {!isAsyncProcessing && (selectedFiles.length > 0 || selectedGoogleDriveFiles.length > 0) && (
            <div className="mt-6 flex justify-end">
            <button
              onClick={
                uploadMode === "google-drive"
                  ? handleGoogleDriveUpload
                  : handleUpload
              }
              disabled={
                (uploadMode === "google-drive"
                  ? googleDriveUploading || isAsyncProcessing
                  : isUploading) ||
                Object.keys(uploadProgress).length > 0 ||
                uploadSuccess ||
                (uploadMode !== "google-drive" && !selectedJobId)
              }
              className={`px-6 py-3 font-medium rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 ${
                uploadSuccess
                  ? "bg-green-500 text-white"
                  : (
                      uploadMode === "google-drive"
                        ? googleDriveUploading
                        : isUploading
                    )
                  ? uploadMode === "google-drive"
                    ? "bg-blue-400 text-white"
                    : "bg-yellow-400 text-white"
                  : uploadMode === "google-drive"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              } ${
                (
                  uploadMode === "google-drive"
                    ? googleDriveUploading
                    : isUploading
                )
                  ? "animate-pulse"
                  : ""
              }`}
            >
              {uploadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Upload Complete!
                </>
              ) : (
                  uploadMode === "google-drive"
                    ? googleDriveUploading || isAsyncProcessing
                    : isUploading
                ) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadMode === "google-drive"
                    ? isAsyncProcessing
                      ? "Processing in Background..."
                      : "Smart Processing from Drive..."
                    : "Uploading..."}
                </>
              ) : (
                <>
                  {uploadMode === "google-drive" ? (
                    <Cloud className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {uploadMode === "google-drive"
                    ? `Smart Process ${selectedGoogleDriveFiles.length} File${
                        selectedGoogleDriveFiles.length !== 1 ? "s" : ""
                      } from Drive`
                    : `Upload ${selectedFiles.length} File${
                        selectedFiles.length !== 1 ? "s" : ""
                      }`}
                </>
              )}
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
