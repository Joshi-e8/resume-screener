import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GoogleDriveFile, ProgressUpdate } from '@/lib/services/googleDriveServices';

export type UploadMode = "single" | "multiple" | "zip" | "google-drive";

interface ResumeUploadState {
  // Upload mode and files
  uploadMode: UploadMode;
  selectedFiles: File[];
  selectedGoogleDriveFiles: GoogleDriveFile[];
  zipContents: File[];
  
  // Upload states
  isUploading: boolean;
  googleDriveUploading: boolean;
  uploadProgress: Record<string, number>;
  uploadSuccess: boolean;
  errors: string[];
  
  // Async processing states
  isAsyncProcessing: boolean;
  processingProgress: ProgressUpdate | null;
  batchId: string | null;
  
  // WebSocket states
  wsConnected: boolean;
  userId: string;
  
  // UI states
  isDragOver: boolean;
  folderProcessed: boolean;
}

const initialState: ResumeUploadState = {
  // Upload mode and files
  uploadMode: "google-drive",
  selectedFiles: [],
  selectedGoogleDriveFiles: [],
  zipContents: [],
  
  // Upload states
  isUploading: false,
  googleDriveUploading: false,
  uploadProgress: {},
  uploadSuccess: false,
  errors: [],
  
  // Async processing states
  isAsyncProcessing: false,
  processingProgress: null,
  batchId: null,
  
  // WebSocket states
  wsConnected: false,
  userId: '',
  
  // UI states
  isDragOver: false,
  folderProcessed: false,
};

const resumeUploadSlice = createSlice({
  name: 'resumeUpload',
  initialState,
  reducers: {
    // Upload mode and files
    setUploadMode: (state, action: PayloadAction<UploadMode>) => {
      state.uploadMode = action.payload;
      state.selectedFiles = [];
      state.selectedGoogleDriveFiles = [];
      state.errors = [];
      state.uploadSuccess = false;
      state.uploadProgress = {};
      state.folderProcessed = false;
      state.zipContents = [];
    },
    
    setSelectedFiles: (state, action: PayloadAction<File[]>) => {
      state.selectedFiles = action.payload;
    },
    
    setSelectedGoogleDriveFiles: (state, action: PayloadAction<GoogleDriveFile[]>) => {
      state.selectedGoogleDriveFiles = action.payload;
      if (action.payload.length > 0) {
        state.folderProcessed = true;
      }
    },
    
    setZipContents: (state, action: PayloadAction<File[]>) => {
      state.zipContents = action.payload;
    },
    
    // Upload states
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },
    
    setGoogleDriveUploading: (state, action: PayloadAction<boolean>) => {
      state.googleDriveUploading = action.payload;
    },
    
    setUploadProgress: (state, action: PayloadAction<Record<string, number>>) => {
      state.uploadProgress = action.payload;
    },
    
    updateUploadProgress: (state, action: PayloadAction<{ fileName: string; progress: number }>) => {
      state.uploadProgress[action.payload.fileName] = action.payload.progress;
    },
    
    setUploadSuccess: (state, action: PayloadAction<boolean>) => {
      state.uploadSuccess = action.payload;
    },
    
    setErrors: (state, action: PayloadAction<string[]>) => {
      state.errors = action.payload;
    },
    
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push(action.payload);
    },
    
    clearErrors: (state) => {
      state.errors = [];
    },
    
    // Async processing states
    setIsAsyncProcessing: (state, action: PayloadAction<boolean>) => {
      state.isAsyncProcessing = action.payload;
    },
    
    setProcessingProgress: (state, action: PayloadAction<ProgressUpdate | null>) => {
      state.processingProgress = action.payload;
    },
    
    setBatchId: (state, action: PayloadAction<string | null>) => {
      state.batchId = action.payload;
    },
    
    // WebSocket states
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },
    
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    
    // UI states
    setIsDragOver: (state, action: PayloadAction<boolean>) => {
      state.isDragOver = action.payload;
    },
    
    setFolderProcessed: (state, action: PayloadAction<boolean>) => {
      state.folderProcessed = action.payload;
    },
    
    // Complex actions
    startAsyncProcessing: (state, action: PayloadAction<{ userId: string; batchSize: number; batchId?: string }>) => {
      const { userId, batchSize, batchId } = action.payload;
      state.isAsyncProcessing = true;
      state.userId = userId;
      state.batchId = batchId || null;
      state.processingProgress = {
        completed: 0,
        total: batchSize,
        status: 'processing'
      };
    },
    
    completeAsyncProcessing: (state) => {
      state.googleDriveUploading = false;
      state.isAsyncProcessing = false;
      state.batchId = null;
      state.selectedGoogleDriveFiles = [];
      state.uploadSuccess = false;
      state.processingProgress = null;
      state.folderProcessed = false;
    },
    
    resetUploadState: (state) => {
      state.selectedFiles = [];
      state.selectedGoogleDriveFiles = [];
      state.zipContents = [];
      state.isUploading = false;
      state.googleDriveUploading = false;
      state.uploadProgress = {};
      state.uploadSuccess = false;
      state.errors = [];
      state.isAsyncProcessing = false;
      state.processingProgress = null;
      state.batchId = null;
      state.folderProcessed = false;
    },
  },
});

export const {
  // Upload mode and files
  setUploadMode,
  setSelectedFiles,
  setSelectedGoogleDriveFiles,
  setZipContents,
  
  // Upload states
  setIsUploading,
  setGoogleDriveUploading,
  setUploadProgress,
  updateUploadProgress,
  setUploadSuccess,
  setErrors,
  addError,
  clearErrors,
  
  // Async processing states
  setIsAsyncProcessing,
  setProcessingProgress,
  setBatchId,
  
  // WebSocket states
  setWsConnected,
  setUserId,
  
  // UI states
  setIsDragOver,
  setFolderProcessed,
  
  // Complex actions
  startAsyncProcessing,
  completeAsyncProcessing,
  resetUploadState,
} = resumeUploadSlice.actions;

export default resumeUploadSlice.reducer;
