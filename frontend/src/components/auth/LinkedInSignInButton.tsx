"use client";

import { useState } from "react";
import { showToast } from "@/utils/toast";

export function LinkedInSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkedInSignIn = async () => {
    try {
      setIsLoading(true);
      showToast.info("Redirecting to LinkedIn...");

      // LinkedIn OAuth configuration
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "86g93kiikr60xr";
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/linkedin/callback`);
      const scope = encodeURIComponent("r_liteprofile r_emailaddress");
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in sessionStorage for verification
      sessionStorage.setItem("linkedin_oauth_state", state);

      // Construct LinkedIn OAuth URL
      const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `state=${state}`;

      // Redirect to LinkedIn OAuth
      window.location.href = linkedinAuthUrl;

    } catch (error) {
      console.error("LinkedIn sign in error:", error);
      showToast.authError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

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