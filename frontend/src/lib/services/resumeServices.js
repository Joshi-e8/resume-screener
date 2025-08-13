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
  const uploadMultipleResumes = async (files, jobId) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('job_id', jobId);

      const response = await axios.post(CONSTANTS.RESUMES.UPLOAD.MULTIPLE, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Upload zip file containing resumes
  const uploadZipResumes = async (zipFile, jobId) => {
    try {
      const formData = new FormData();
      formData.append('zip_file', zipFile);
      formData.append('job_id', jobId);

      const response = await axios.post(CONSTANTS.RESUMES.UPLOAD.ZIP, formData, {
        headers: { "Content-Type": "multipart/form-data" }
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
  };
};

export default useResumeServices;
