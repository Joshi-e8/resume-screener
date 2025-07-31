"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

const useAnalyticsServices = () => {
  const axios = useAxiosClient("admin");

  // Get dashboard overview statistics
  const getDashboardStats = async () => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.DASHBOARD);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get resume screening analytics
  const getScreeningAnalytics = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.SCREENING, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get job performance analytics
  const getJobPerformance = async (jobId = null, filters = {}) => {
    try {
      const endpoint = jobId ? CONSTANTS.ANALYTICS.JOB_DETAIL(jobId) : CONSTANTS.ANALYTICS.JOBS;
      const response = await axios.get(endpoint, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get resume upload trends
  const getUploadTrends = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.UPLOADS, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get AI screening accuracy metrics
  const getScreeningAccuracy = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.ACCURACY, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get user activity analytics
  const getUserActivity = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.USERS, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get system performance metrics
  const getSystemPerformance = async (filters = {}) => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.SYSTEM, { params: filters });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Export analytics data
  const exportAnalytics = async (type, filters = {}) => {
    try {
      const response = await axios.post(CONSTANTS.ANALYTICS.EXPORT, {
        type,
        filters,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get real-time metrics
  const getRealTimeMetrics = async () => {
    try {
      const response = await axios.get(CONSTANTS.ANALYTICS.REALTIME);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get custom analytics report
  const getCustomReport = async (reportConfig) => {
    try {
      const response = await axios.post(CONSTANTS.ANALYTICS.CUSTOM_REPORT, reportConfig);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    getDashboardStats,
    getScreeningAnalytics,
    getJobPerformance,
    getUploadTrends,
    getScreeningAccuracy,
    getUserActivity,
    getSystemPerformance,
    exportAnalytics,
    getRealTimeMetrics,
    getCustomReport,
  };
};

export default useAnalyticsServices;
