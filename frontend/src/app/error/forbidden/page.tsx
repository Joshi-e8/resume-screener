"use client";

import { useEffect, useState } from "react";
import { ForbiddenError } from "@/components/errors";

interface ErrorState {
  message?: string;
  requiredRole?: string;
}

export default function ForbiddenPage() {
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
    <ForbiddenError
      message={errorState?.message || "You don't have permission to access this resource"}
      requiredRole={errorState?.requiredRole}
    />
  );
}