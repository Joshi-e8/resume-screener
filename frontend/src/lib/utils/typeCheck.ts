// Type checking file to verify all error handling types work correctly
import { AxiosError } from "axios";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { handleApiError, createErrorState, logError } from "./errorUtils";
import useAxiosClient from "../hooks/useAxiosClient";

// This file is just for type checking - it won't be used in runtime
// If this compiles without errors, our types are correct

export function typeCheckExample() {
  // Test useErrorHandler
  const { error, handleError, clearError, isError } = useErrorHandler();
  
  // Test different error types
  const axiosError: AxiosError = new Error("Axios error") as AxiosError;
  const genericError = new Error("Generic error");
  const unknownError: unknown = "string error";
  
  // These should all work without type errors
  handleError(axiosError);
  handleError(genericError);
  handleError(unknownError);
  
  // Test useAxiosClient
  const axiosClient = useAxiosClient("user");
  
  // Test error utilities
  const errorState = createErrorState(axiosError);
  logError(axiosError, "test context");
  
  // Mock router for testing
  const mockRouter = {
    push: (path: string) => console.log(`Navigate to: ${path}`),
    replace: (path: string) => console.log(`Replace with: ${path}`),
    back: () => console.log("Go back"),
    forward: () => console.log("Go forward"),
    refresh: () => console.log("Refresh"),
    prefetch: async (path: string) => console.log(`Prefetch: ${path}`)
  } as any;
  
  handleApiError(axiosError, mockRouter);
  
  return {
    error,
    isError,
    errorState,
    axiosClient
  };
}

// Export types for use in other files
export type { AxiosError };