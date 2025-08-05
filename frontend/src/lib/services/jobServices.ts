"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

// TypeScript interfaces based on backend models
export interface SalaryInfo {
  min?: number;
  max?: number;
  currency: string;
  period?: string;
}

export interface PlatformPosting {
  platform_id: string;
  external_job_id?: string;
  posted_at?: string;
  status: string;
  post_url?: string;
  error_message?: string;
  applications_count: number;
  views_count: number;
}

// Interface for creating a new job (matches backend JobCreate model)
export interface JobCreateData {
  title: string;
  description: string;
  department?: string;
  location: string;
  job_type: "full-time" | "part-time" | "contract" | "temporary" | "internship";
  experience_level: "entry" | "mid" | "senior" | "executive";
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  salary?: SalaryInfo;
  remote_allowed: boolean;
  urgent: boolean;
  closing_date?: string;
  status?: "draft" | "active" | "paused" | "closed" | "expired";
}

// Interface for updating a job (matches backend JobUpdate model)
export interface JobUpdateData extends Partial<JobCreateData> {
  status?: "draft" | "active" | "paused" | "closed" | "expired";
}

// Interface for job response data
export interface JobResponseData {
  id: string;
  title: string;
  description: string;
  department?: string;
  location: string;
  job_type: string;
  experience_level: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  salary?: SalaryInfo;
  status: string;
  remote_allowed: boolean;
  urgent: boolean;
  posted_platforms: PlatformPosting[];
  total_applications: number;
  total_views: number;
  closing_date?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  user_id: string;
  created_by?: {
    id: string;
    full_name: string;
    email: string;
    job_title?: string;
    company_name?: string;
  };
}

// API response interfaces
export interface JobResponse {
  id: string;
  title: string;
  description: string;
  department?: string;
  location: string;
  job_type: string;
  experience_level: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  salary?: SalaryInfo;
  status: string;
  remote_allowed: boolean;
  urgent: boolean;
  posted_platforms: PlatformPosting[];
  total_applications: number;
  total_views: number;
  closing_date?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  user_id: string;
  created_by?: {
    id: string;
    full_name: string;
    email: string;
    job_title?: string;
    company_name?: string;
  };
}

export interface JobListResponse {
  result: string;
  message: string;
  records: JobResponse[];
  total: number;
  page: number;
  size: number;
}

export interface JobDetailsResponse {
  result: string;
  message: string;
  records: JobResponse;
}

export interface JobSearchParams {
  page?: number;
  size?: number;
  search?: string;
  query?: string;
  status?: string;
  department?: string;
  job_type?: string;
  experience_level?: string;
  location?: string;
  skills?: string[];
  remote_allowed?: boolean;
  urgent?: boolean;
  salary_min?: number;
  salary_max?: number;
}

const useJobServices = () => {
  const axios = useAxiosClient("admin");

  // Get all jobs with pagination and filters
  const getAllJobs = async (
    params: JobSearchParams = {}
  ) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.LISTING, { params });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get job by ID
  const getJobById = async (jobId: string) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.DETAIL(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Create new job
  const createJob = async (jobData: JobCreateData) => {
    try {
      const response = await axios.post(CONSTANTS.JOBS.CREATE, jobData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update job
  const updateJob = async (
    jobId: string,
    jobData: JobUpdateData
  ): Promise<JobResponse> => {
    try {
      const response = await axios.put(CONSTANTS.JOBS.UPDATE(jobId), jobData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Delete job
  const deleteJob = async (jobId: string) => {
    try {
      const response = await axios.delete(CONSTANTS.JOBS.DELETE(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Publish job (make it active)
  const publishJob = async (jobId: string) => {
    try {
      const response = await axios.post(
        `${CONSTANTS.JOBS.DETAIL(jobId)}/publish`
      );
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Pause job
  const pauseJob = async (jobId: string) => {
    try {
      const response = await axios.post(
        `${CONSTANTS.JOBS.DETAIL(jobId)}/pause`
      );
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get job analytics
  const getJobAnalytics = async (jobId: string) => {
    try {
      const response = await axios.get(
        `${CONSTANTS.JOBS.DETAIL(jobId)}/analytics`
      );
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Import job from external platform
  const importJobFromExternal = async (importData: any) => {
    try {
      const response = await axios.post(CONSTANTS.JOBS.IMPORT, importData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get job statistics (legacy - use getJobAnalytics instead)
  const getJobStatistics = async (jobId: string) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.STATISTICS(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update job status (legacy - use updateJob instead)
  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const response = await axios.patch(CONSTANTS.JOBS.STATUS(jobId), {
        status,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get jobs with pagination (legacy - use getAllJobs instead)
  const getJobsPaginated = async (params = {}) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.PAGINATED, { params });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Search jobs (legacy - use getAllJobs with search param instead)
  const searchJobs = async (query: string, filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.SEARCH, {
        params: { query, ...filters },
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    // Main API methods
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    publishJob,
    pauseJob,
    getJobAnalytics,

    // Additional methods
    importJobFromExternal,

    // Legacy methods (for backward compatibility)
    getJobStatistics,
    updateJobStatus,
    getJobsPaginated,
    searchJobs,
  };
};

export default useJobServices;
