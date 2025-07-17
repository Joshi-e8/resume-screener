// API Response types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    resume_ids: string[];
    uploaded_count: number;
    failed_count: number;
    failed_files?: string[];
  };
  message?: string;
}

export interface AnalysisRequest {
  resume_ids: string[];
  job_description_id: string;
}

export interface BulkAnalysisResponse {
  success: boolean;
  data: {
    analysis_ids: string[];
    processed_count: number;
    failed_count: number;
    failed_resumes?: string[];
  };
  message?: string;
}

export interface ExportRequest {
  analysis_ids: string[];
  format: 'PDF' | 'CSV';
  filters?: {
    status?: 'SHORTLISTED' | 'REJECTED' | 'MAYBE';
    min_score?: number;
    max_score?: number;
  };
}

export interface ExportResponse {
  success: boolean;
  data: {
    download_url: string;
    filename: string;
    expires_at: Date;
  };
  message?: string;
}
