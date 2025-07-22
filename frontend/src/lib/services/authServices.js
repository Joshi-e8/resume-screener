"use client";
import CONSTANTS from "../constants";
import useAxiosClient from "../hooks/useAxiosClient";
import errorHandler from "../utils/errorHandler";

const useAuthServices = () => {
  const axios = useAxiosClient("unauthorized");

  // User login
  const login = async (credentials) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.LOGIN, credentials);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // User registration
  const register = async (userData) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.REGISTER, userData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // User logout
  const logout = async () => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.LOGOUT);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Refresh access token
  const refreshToken = async (refreshToken) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.REFRESH, {
        refresh_token: refreshToken,
      });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.FORGOT_PASSWORD, { email });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Reset password
  const resetPassword = async (resetData) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.RESET_PASSWORD, resetData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.VERIFY_EMAIL, { token });
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Get current user profile
  const getCurrentUser = async () => {
    try {
      const response = await axios.get(CONSTANTS.AUTH.ME);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(CONSTANTS.AUTH.PROFILE, profileData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await axios.post(CONSTANTS.AUTH.CHANGE_PASSWORD, passwordData);
      return response?.data;
    } catch (error) {
      return errorHandler(error);
    }
  };

  return {
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getCurrentUser,
    updateProfile,
    changePassword,
  };
};

export default useAuthServices;
