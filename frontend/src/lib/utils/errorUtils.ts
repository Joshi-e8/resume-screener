import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AxiosError } from "axios";

export interface ErrorState {
  statusCode: number;
  message?: string;
  errorId?: string;
  requiredRole?: string;
  redirectUrl?: string;
  estimatedTime?: string;
  timestamp: string;
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
  message?: string;
  config?: {
    url?: string;
    method?: string;
  };
}

/**
 * Handles API errors and redirects to appropriate error pages
 */
export const handleApiError = (error: AxiosError | ApiError | any, router: AppRouterInstance): void => {
  const status = error.response?.status;
  const errorData = error.response?.data;

  if (typeof window === 'undefined') return;

  switch (status) {
    case 401:
      redirectToErrorPage(router, '/error/unauthorized', {
        statusCode: 401,
        message: errorData?.message || "You need to sign in to access this resource",
        redirectUrl: "/auth/signin",
        timestamp: new Date().toISOString()
      });
      break;

    case 403:
      redirectToErrorPage(router, '/error/forbidden', {
        statusCode: 403,
        message: errorData?.message || "You don't have permission to access this resource",
        requiredRole: errorData?.requiredRole,
        timestamp: new Date().toISOString()
      });
      break;

    case 404:
      router.push('/not-found');
      break;

    case 500:
      redirectToErrorPage(router, '/error/server', {
        statusCode: 500,
        message: errorData?.message || "Internal server error occurred",
        errorId: errorData?.errorId || `ERR_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
      break;

    case 502:
      redirectToErrorPage(router, '/error/server', {
        statusCode: 502,
        message: errorData?.message || "Bad gateway - unable to connect to server",
        errorId: errorData?.errorId || `ERR_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
      break;

    case 503:
      redirectToErrorPage(router, '/error/maintenance', {
        statusCode: 503,
        message: errorData?.message || "Service temporarily unavailable",
        estimatedTime: errorData?.estimatedTime || "30 minutes",
        timestamp: new Date().toISOString()
      });
      break;

    case 504:
      redirectToErrorPage(router, '/error/server', {
        statusCode: 504,
        message: errorData?.message || "Gateway timeout - server took too long to respond",
        errorId: errorData?.errorId || `ERR_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
      break;

    default:
      if (status && status >= 400) {
        redirectToErrorPage(router, '/error/server', {
          statusCode: status,
          message: errorData?.message || "An unexpected error occurred",
          errorId: errorData?.errorId || `ERR_${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      }
      break;
  }
};

/**
 * Redirects to error page with error state
 */
export const redirectToErrorPage = (
  router: AppRouterInstance, 
  path: string, 
  errorState: Partial<ErrorState>
) => {
  // Store error state in sessionStorage
  sessionStorage.setItem('errorState', JSON.stringify(errorState));
  
  // Redirect to error page
  router.push(path);
};

/**
 * Creates error state from error object
 */
export const createErrorState = (error: any): ErrorState => {
  const status = error.response?.status || 500;
  const errorData = error.response?.data;

  return {
    statusCode: status,
    message: errorData?.message || error.message || "An unexpected error occurred",
    errorId: errorData?.errorId || `ERR_${Date.now()}`,
    requiredRole: errorData?.requiredRole,
    timestamp: new Date().toISOString()
  };
};

/**
 * Gets error state from sessionStorage
 */
export const getStoredErrorState = (): ErrorState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedError = sessionStorage.getItem('errorState');
    if (storedError) {
      const parsedError = JSON.parse(storedError);
      // Clear after reading
      sessionStorage.removeItem('errorState');
      return parsedError;
    }
  } catch (error) {
    console.error('Failed to parse stored error state:', error);
    sessionStorage.removeItem('errorState');
  }

  return null;
};

/**
 * Logs error for monitoring/debugging
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url,
    method: error.config?.method,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };

  console.error('API Error:', errorInfo);

  // Here you could send to error monitoring service
  // Example: Sentry.captureException(error, { extra: errorInfo });
};