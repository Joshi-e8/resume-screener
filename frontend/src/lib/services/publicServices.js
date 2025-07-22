"use client";
import CONSTANTS from "../constants";
import axios from "../axios"; // Use default axios instance for public endpoints
import errorHandler from "../utils/errorHandler";

const usePublicServices = () => {
  // Get public job listings (no auth required)
  const getPublicJobs = async (params = {}) => {
    try {
      const response = await axios.get(`${CONSTANTS.JOBS.LISTING}?${new URLSearchParams(params)}`);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get public job details (no auth required)
  const getPublicJobById = async (jobId) => {
    try {
      const response = await axios.get(CONSTANTS.JOBS.DETAIL(jobId));
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Submit application (no auth required)
  const submitApplication = async (jobId, applicationData) => {
    try {
      const formData = new FormData();
      Object.keys(applicationData).forEach(key => {
        formData.append(key, applicationData[key]);
      });
      formData.append('job_id', jobId);

      const response = await axios.post(`${CONSTANTS.JOBS.DETAIL(jobId)}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get system status (no auth required)
  const getSystemStatus = async () => {
    try {
      const response = await axios.get('/health');
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Contact form submission (no auth required)
  const submitContactForm = async (contactData) => {
    try {
      const response = await axios.post('/contact', contactData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    getPublicJobs,
    getPublicJobById,
    submitApplication,
    getSystemStatus,
    submitContactForm,
  };
};

export default usePublicServices;
