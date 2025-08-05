"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorHandler } from "@/components/errors";

interface ErrorState {
  statusCode?: number;
  message?: string;
  errorId?: string;
  requiredRole?: string;
  redirectUrl?: string;
  timestamp?: string;
}

function ErrorPageContent() {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get error state from sessionStorage first
    const storedError = sessionStorage.getItem('errorState');
    if (storedError) {
      try {
        const parsedError = JSON.parse(storedError) as ErrorState;
        setErrorState(parsedError);
        // Clear the error state after reading
        sessionStorage.removeItem('errorState');
        return;
      } catch (error) {
        console.error('Failed to parse error state:', error);
      }
    }

    // Fallback to URL parameters
    const statusCode = searchParams.get('status');
    const message = searchParams.get('message');
    const errorId = searchParams.get('errorId');
    const requiredRole = searchParams.get('requiredRole');

    if (statusCode) {
      setErrorState({
        statusCode: parseInt(statusCode),
        message: message || undefined,
        errorId: errorId || undefined,
        requiredRole: requiredRole || undefined,
        timestamp: new Date().toISOString()
      });
    }
  }, [searchParams]);

  // If no error state, show a generic error
  if (!errorState) {
    return (
      <ErrorHandler
        statusCode={500}
        message="An unexpected error occurred"
        errorId={`ERR_${Date.now()}`}
      />
    );
  }

  return (
    <ErrorHandler
      statusCode={errorState.statusCode}
      message={errorState.message}
      errorId={errorState.errorId}
      requiredRole={errorState.requiredRole}
      redirectUrl={errorState.redirectUrl}
    />
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <ErrorHandler
        statusCode={500}
        message="Loading error details..."
        errorId={`ERR_LOADING_${Date.now()}`}
      />
    }>
      <ErrorPageContent />
    </Suspense>
  );
}