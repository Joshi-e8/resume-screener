"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/utils/toast";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LinkedInSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [linkedinCallbackError, setLinkedinCallbackError] = useState<string | null>(
    null
  );

  const handleLinkedInSignIn = async () => {
    try {
      setIsLoading(true);
      showToast.info("Redirecting to LinkedIn...");

      await signIn("linkedin", {
        redirect: true, // Handle redirect manually for better UX
        callbackUrl: "/?provider=linkedin",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      showToast.authError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show error toast when linkedinCallbackError is set
  useEffect(() => {
    if (linkedinCallbackError) {
      showToast.error(linkedinCallbackError);
      setLinkedinCallbackError(null); // Reset error after showing
    }
  }, [linkedinCallbackError]);

  return (
    <button
      onClick={handleLinkedInSignIn}
      disabled={isLoading}
      className="w-full bg-[#0077B5] hover:bg-[#005885] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          {/* LinkedIn Logo SVG */}
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span>Continue with LinkedIn</span>
        </>
      )}
    </button>
  );
}