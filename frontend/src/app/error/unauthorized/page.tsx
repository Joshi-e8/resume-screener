"use client";

import { useEffect, useState } from "react";
import { UnauthorizedError } from "@/components/errors";

interface ErrorState {
  message?: string;
  redirectUrl?: string;
}

export default function UnauthorizedPage() {
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
    <UnauthorizedError
      message={errorState?.message || "You need to sign in to access this resource"}
      redirectUrl={errorState?.redirectUrl || "/auth/signin"}
    />
  );
}