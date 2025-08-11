"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import { axiosClient } from "../axios";
import { useSession, signOut } from "next-auth/react";
import { handleApiError, logError } from "../utils/errorUtils";

// Extend InternalAxiosRequestConfig to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
}

// Define session user type
interface SessionUser {
  accessToken?: string;
  user_type?: string;
}

interface ExtendedSession {
  user?: SessionUser;
}

const useAxiosClient = (userType: string = "unauthorized"): AxiosInstance => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Request Interceptor
    const requestInterceptor = axiosClient.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // Type guard for session
        const typedSession = session as ExtendedSession | null;
        
        // Add Authorization header only if we have a token
        const token = typedSession?.user?.accessToken;
        if (token && !config.headers?.["Authorization"]) {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        // Add user type channel
        if (!config.headers?.["x-channel"]) {
          config.headers = config.headers || {};
          config.headers["x-channel"] = typedSession?.user?.user_type || userType;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        return config;
      },
      (error: AxiosError) => {
        logError(error, 'Request Interceptor');
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    const responseInterceptor = axiosClient.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
          const config = response.config as ExtendedAxiosRequestConfig;
          const duration = config.metadata?.startTime 
            ? new Date().getTime() - config.metadata.startTime.getTime()
            : 0;
          console.log(`✅ ${config.method?.toUpperCase()} ${config.url} - ${response.status} (${duration}ms)`);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Log error details
        logError(error, 'Response Interceptor');

        const status = error.response?.status;
        
        // Handle 401 specifically for authentication
        if (status === 401) {
          // Be gentle on 401 during SSR/initial hydration or when unauthenticated
          console.log('🔒 401 Unauthorized - skipping auto sign-out (no token or initial load)');
          const hasToken = Boolean((session as any)?.user?.accessToken);
          if (hasToken) {
            // Optional: try to refresh or sign out only if we had a token
            // await signOut({ redirect: false });
          }
        }
        
        // Use centralized error handling
        handleApiError(error, router);
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axiosClient.interceptors.request.eject(requestInterceptor);
      axiosClient.interceptors.response.eject(responseInterceptor);
    };
  }, [session, userType, router]);

  return axiosClient;
};

export default useAxiosClient;