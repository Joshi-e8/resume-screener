"use client";

import { useEffect, useState } from "react";
import { ServerError } from "@/components/errors";

interface ErrorState {
  statusCode?: number;
  message?: string;
  errorId?: string;
}

export default function ServerErrorPage() {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  useEffect(() => {
    // Get error state from sessionStorage
    const storedError = sessionStorage.getItem('errorState');
    if (storedError) {
      try {
        const parsedError = JSON.parse(storedError) as ErrorState;
        setErrorState(parsedError);
        // Clear the error state after reading
        sessionStorage.removeItem('errorState');
      } catch (error) {
        console.error('Failed to parse error state:', error);
      }
    }
  }, []);

  return (
    <ServerError
      statusCode={errorState?.statusCode || 500}
      message={errorState?.message || "Internal server error occurred"}
      errorId={errorState?.errorId}
    />
  );
}