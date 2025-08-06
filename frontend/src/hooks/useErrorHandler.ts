import { useState, useCallback } from "react";
import { AxiosError } from "axios";

interface ErrorState {
  statusCode?: number;
  message?: string;
  errorId?: string;
  requiredRole?: string;
  redirectUrl?: string;
  estimatedTime?: string;
}

interface ApiErrorData {
  message?: string;
  errorId?: string;
  requiredRole?: string;
  estimatedTime?: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: ApiErrorData;
  };
  status?: number;
  message?: string;
}

// Type guard functions
const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
};

const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ApiError).response === 'object'
  );
};

const hasStatus = (error: unknown): error is { status: number } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
};

interface UseErrorHandlerReturn {
  error: ErrorState | null;
  setError: (error: ErrorState | null) => void;
  handleError: (error: unknown) => void;
  clearError: () => void;
  isError: boolean;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((err: unknown) => {
    console.error("Error caught by handler:", err);

    // Handle Axios errors
    if (isAxiosError(err)) {
      const status = err.response?.status;
      const errorData = err.response?.data as ApiErrorData | undefined;
      
      setError({
        statusCode: status,
        message: errorData?.message || err.message || "An error occurred",
        errorId: errorData?.errorId,
        requiredRole: errorData?.requiredRole,
        estimatedTime: errorData?.estimatedTime
      });
      return;
    }

    // Handle API errors with response structure
    if (isApiError(err)) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      setError({
        statusCode: status,
        message: errorData?.message || err.message || "An error occurred",
        errorId: errorData?.errorId,
        requiredRole: errorData?.requiredRole,
        estimatedTime: errorData?.estimatedTime
      });
      return;
    }

    // Handle errors with status property
    if (hasStatus(err)) {
      const errorWithStatus = err as ApiError;
      setError({
        statusCode: errorWithStatus.status,
        message: errorWithStatus.message || "An error occurred"
      });
      return;
    }

    // Handle standard Error objects
    if (err instanceof Error) {
      setError({
        statusCode: 500,
        message: err.message || "An unexpected error occurred"
      });
      return;
    }

    // Handle unknown error types
    setError({
      statusCode: 500,
      message: "An unexpected error occurred"
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
    isError: error !== null
  };
}