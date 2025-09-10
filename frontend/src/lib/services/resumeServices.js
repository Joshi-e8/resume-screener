"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

const useResumeServices = () => {
  const axios = useAxiosClient("admin");

  // Upload single resume file
  const uploadSingleResume = async (file, jobId, onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (jobId) formData.append('job_id', jobId);

      const response = await axios.post(CONSTANTS.RESUMES.UPLOAD.SINGLE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onUploadProgress,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Upload multiple resume files
  const uploadMultipleResumes = async (files, jobId, asyncProcessing = true) => {
    try {
      const formData = new FormData();
      Array.from(files || []).forEach((file) => {
        formData.append('files', file);
      });
      if (jobId) formData.append('job_id', jobId);
      formData.append('async_processing', String(asyncProcessing));

      const response = await axios.post(CONSTANTS.RESUMES.UPLOAD.MULTIPLE, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Upload zip file containing resumes
  const uploadZipResumes = async (zipFile, jobId, onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append('zip_file', zipFile);
      if (jobId) formData.append('job_id', jobId);
      formData.append('async_processing', 'true');

      const response = await axios.post(CONSTANTS.RESUMES.UPLOAD.ZIP, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onUploadProgress,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get all resumes (across jobs)
  const getAllResumes = async () => {
    try {
      const response = await axios.get(CONSTANTS.RESUMES.LISTING);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get all resumes for a job
  const getResumesByJob = async (jobId) => {
    try {
      const response = await axios.get(CONSTANTS.RESUMES.BY_JOB(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get resume details by ID
  const getResumeById = async (resumeId) => {
    try {
      const response = await axios.get(CONSTANTS.RESUMES.DETAIL(resumeId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Delete resume by ID
  const deleteResume = async (resumeId) => {
    try {
      const response = await axios.delete(CONSTANTS.RESUMES.DELETE(resumeId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Screen resumes using AI
  const screenResumes = async (jobId, criteria) => {
    try {
      const response = await axios.post(CONSTANTS.RESUMES.SCREEN(jobId), criteria);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get screening results
  const getScreeningResults = async (jobId) => {
    try {
      const response = await axios.get(CONSTANTS.RESUMES.SCREENING_RESULTS(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update resume status
  const updateResumeStatus = async (resumeId, status) => {
    try {
      const response = await axios.patch(CONSTANTS.RESUMES.STATUS(resumeId), {
        status,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get resume statistics
  const getResumeStats = async () => {
    try {
      const response = await axios.get(CONSTANTS.RESUMES.STATS);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Search resumes with filters
  const searchResumes = async (searchRequest) => {
    try {
      const response = await axios.post(CONSTANTS.RESUMES.SEARCH, searchRequest);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Bulk delete resumes
  const bulkDeleteResumes = async (resumeIds) => {
    try {
      const response = await axios.post(CONSTANTS.RESUMES.BULK_DELETE, {
        resume_ids: resumeIds
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Bulk update resume status
  const bulkUpdateStatus = async (resumeIds, status) => {
    try {
      const response = await axios.post(CONSTANTS.RESUMES.BULK_STATUS, {
        resume_ids: resumeIds,
        status: status
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Download resume file
  const downloadResume = async (resumeId, filename) => {
    try {
      console.log('Requesting download for resume:', resumeId);

      const response = await axios.get(CONSTANTS.RESUMES.DOWNLOAD(resumeId), {
        responseType: 'blob'
      });

      console.log('Download response received:', response.status);

      // Check if response is actually a blob
      if (response.data instanceof Blob) {
        // Create blob URL and trigger download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `resume_${resumeId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('Download triggered successfully');
        return { success: true };
      } else {
        console.error('Response is not a blob:', response.data);
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Download error:', error);
      if (error.response?.status === 401) {
        return { success: false, error: 'Authentication required' };
      } else if (error.response?.status === 404) {
        return { success: false, error: 'Resume file not found' };
      }
      return errorHandler(error);
    }
  };

  return {
    uploadSingleResume,
    uploadMultipleResumes,
    uploadZipResumes,
    getAllResumes,
    getResumesByJob,
    getResumeById,
    deleteResume,
    screenResumes,
    getScreeningResults,
    updateResumeStatus,
    getResumeStats,
    searchResumes,
    bulkDeleteResumes,
    bulkUpdateStatus,
    downloadResume,
  };
};

export default useResumeServices;
