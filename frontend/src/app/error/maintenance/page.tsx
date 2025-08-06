"use client";

import { useEffect, useState } from "react";
import { MaintenancePage } from "@/components/errors";

interface ErrorState {
  estimatedTime?: string;
  message?: string;
}

export default function MaintenanceErrorPage() {
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
    <MaintenancePage
      estimatedTime={errorState?.estimatedTime || "30 minutes"}
      message={errorState?.message || "We're currently performing scheduled maintenance to improve your experience."}
      features={[
        "Enhanced security measures",
        "Performance improvements", 
        "New features and bug fixes",
        "Database optimizations"
      ]}
    />
  );
}