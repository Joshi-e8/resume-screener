"use client";

import React, { Component, ReactNode } from "react";
import ServerError from "./ServerError";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ServerError
          statusCode={500}
          message={this.state.error?.message || "Something went wrong"}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;