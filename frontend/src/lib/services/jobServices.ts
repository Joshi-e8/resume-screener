"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

const useJobServices = () => {
  const axios = useAxiosClient("admin");

  // Get all jobs
  const getAllJobs = async (params: URLSearchParams) => {
    try {
      const response = await axios.get(`${CONSTANTS.JOBS.LISTING}`, { params });
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
  const createJob = async (jobData: any) => {
    try {
      const response = await axios.post(CONSTANTS.JOBS.CREATE, jobData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update job
  const updateJob = async (jobId:string, jobData:any) => {
    try {
      const response = await axios.put(CONSTANTS.JOBS.UPDATE(jobId), jobData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Delete job
  const deleteJob = async (jobId:string) => {
    try {
      const response = await axios.delete(CONSTANTS.JOBS.DELETE(jobId));
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

  // Get job statistics
  const getJobStatistics = async (jobId: string) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.STATISTICS(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update job status
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

  // Get jobs with pagination
  const getJobsPaginated = async (params = {}) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.PAGINATED, { params });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Search jobs
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
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    importJobFromExternal,
    getJobStatistics,
    updateJobStatus,
    getJobsPaginated,
    searchJobs,
  };
};

export default useJobServices;
