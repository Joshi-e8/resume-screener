"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/utils/toast";

export default function LinkedInCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || "LinkedIn authentication failed");
        }

        // Verify state parameter
        const storedState = sessionStorage.getItem("linkedin_oauth_state");
        if (!state || state !== storedState) {
          throw new Error("Invalid state parameter. Possible CSRF attack.");
        }

        // Clean up stored state
        sessionStorage.removeItem("linkedin_oauth_state");

        if (!code) {
          throw new Error("No authorization code received from LinkedIn");
        }

        // Exchange authorization code for access token and user info
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social-login/linkedin/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: code,
            email: "", // Will be populated by backend after token exchange
            name: "", // Will be populated by backend after token exchange
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to authenticate with LinkedIn");
        }

        const data = await response.json();
        
        // Store the access token (you might want to use a more secure method)
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        showToast.authSuccess("Successfully signed in with LinkedIn!");
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);

      } catch (error) {
        console.error("LinkedIn callback error:", error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
        showToast.authError(error instanceof Error ? error.message : "LinkedIn authentication failed");
        
        // Redirect back to login after a delay
        setTimeout(() => {
          router.push("/?error=linkedin_auth_failed");
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleLinkedInCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Failed</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Processing LinkedIn Authentication</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we complete your sign-in...</p>
        </div>
      </div>
    </div>
  );
}