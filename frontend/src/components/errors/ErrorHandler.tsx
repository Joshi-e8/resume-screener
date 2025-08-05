"use client";

import { ReactNode } from "react";
import UnauthorizedError from "./UnauthorizedError";
import ForbiddenError from "./ForbiddenError";
import ServerError from "./ServerError";

interface ErrorHandlerProps {
  statusCode?: number;
  message?: string;
  errorId?: string;
  requiredRole?: string;
  redirectUrl?: string;
  children?: ReactNode;
}

export default function ErrorHandler({
  statusCode,
  message,
  errorId,
  requiredRole,
  redirectUrl,
  children
}: ErrorHandlerProps) {
  // If no error, render children
  if (!statusCode) {
    return <>{children}</>;
  }

  // Render appropriate error component based on status code
  switch (statusCode) {
    case 401:
      return (
        <UnauthorizedError 
          message={message}
          redirectUrl={redirectUrl}
        />
      );
    
    case 403:
      return (
        <ForbiddenError 
          message={message}
          requiredRole={requiredRole}
        />
      );
    
    case 500:
    case 502:
    case 503:
    case 504:
      return (
        <ServerError 
          statusCode={statusCode}
          message={message}
          errorId={errorId}
        />
      );
    
    default:
      return (
        <ServerError 
          statusCode={statusCode || 500}
          message={message || "An unexpected error occurred"}
          errorId={errorId}
        />
      );
  }
}

// Export individual error components for direct use
export { UnauthorizedError, ForbiddenError, ServerError };