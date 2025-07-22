"use client";
import { useEffect } from "react";
import { axiosClient } from "../axios";
import { useSession } from "next-auth/react";

const useAxiosClient = (userType = "unauthorized") => {
  const { data: session } = useSession();

  useEffect(() => {
    // Request Interceptor
    const requestInterceptor = axiosClient.interceptors.request.use(
      (config) => {
        // Add Authorization header
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${session?.user.accessToken}`;
        }

        // Add user type channel
        if (!config.headers["x-channel"]) {
          config.headers["x-channel"] = session?.user?.user_type || userType;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    const responseInterceptor = axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle different error status codes
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } else if (error.response?.status === 403) {
          // Forbidden - redirect to forbidden page
          if (typeof window !== 'undefined') {
            window.location.href = '/403';
          }
        } else if (error.response?.status === 500) {
          // Server error - redirect to error page
          if (typeof window !== 'undefined') {
            window.location.href = '/500';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axiosClient.interceptors.request.eject(requestInterceptor);
      axiosClient.interceptors.response.eject(responseInterceptor);
    };
  }, [session, userType]);

  return axiosClient;
};

export default useAxiosClient;
