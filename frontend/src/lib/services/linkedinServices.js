"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

const useLinkedInServices = () => {
  const axios = useAxiosClient("admin");

  // Connect LinkedIn account
  const connectLinkedIn = async () => {
    try {
      const response = await axios.get(CONSTANTS.LINKEDIN.CONNECT);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Handle LinkedIn OAuth callback
  const handleLinkedInCallback = async (code, state) => {
    try {
      const response = await axios.post(CONSTANTS.LINKEDIN.CALLBACK, {
        code,
        state,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get LinkedIn profile
  const getLinkedInProfile = async () => {
    try {
      const response = await axios.get(CONSTANTS.LINKEDIN.PROFILE);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get LinkedIn jobs
  const getLinkedInJobs = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.LINKEDIN.JOBS, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Import job from LinkedIn
  const importJobFromLinkedIn = async (jobData) => {
    try {
      const response = await axios.post(CONSTANTS.LINKEDIN.IMPORT_JOB, jobData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Disconnect LinkedIn account
  const disconnectLinkedIn = async () => {
    try {
      const response = await axios.post(CONSTANTS.LINKEDIN.DISCONNECT);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    connectLinkedIn,
    handleLinkedInCallback,
    getLinkedInProfile,
    getLinkedInJobs,
    importJobFromLinkedIn,
    disconnectLinkedIn,
  };
};

export default useLinkedInServices;
