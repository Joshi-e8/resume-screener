"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { AuthSection } from "@/components/landing/AuthSection";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { OtpSection } from "./otpSection";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { showToast } from "@/utils/toast";

export function LandingPage() {
  const authStep = useSelector((state: RootState) => state.authStep.step);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledCallback = useRef(false);

  // Handle Google OAuth callback redirect
  useEffect(() => {
    const handleGoogleCallback = async (): Promise<void> => {
      // Check if this is a Google callback
      const isGoogleCallback = searchParams.get("provider") === "google";
      
      if (isGoogleCallback && status === "authenticated" && session?.user && !hasHandledCallback.current) {
        hasHandledCallback.current = true; // Prevent duplicate execution
        
        if (session.user.accessToken) {
          // We have a valid session with backend tokens
          showToast.success("Successfully signed in!");

          // Remove the provider param from the URL
          const url = new URL(window.location.href);
          url.searchParams.delete("provider");
          window.history.replaceState({}, document.title, url.toString());

          // Navigate to dashboard
          router.push("/dashboard");
        } else {
          // If we don't have an accessToken, the backend API call likely failed
          showToast.error("User does not exist.");

          // Remove the provider param from the URL
          const url = new URL(window.location.href);
          url.searchParams.delete("provider");
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    };

    if(status === "authenticated") {
      handleGoogleCallback();
      console.log(status,'status')
    }
  }, [status, session, router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light via-white to-background-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center py-12">
          <div className="w-full grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20 items-center">
            {/* Hero Section - Left Side */}
            <div className="order-2 lg:order-1">
              <HeroSection />
            </div>

            {/* Auth Section - Right Side */}
            <div className="order-1 lg:order-2">
              {(authStep === 1 || authStep === 3) && <AuthSection />}
              {authStep === 2 && <OtpSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
