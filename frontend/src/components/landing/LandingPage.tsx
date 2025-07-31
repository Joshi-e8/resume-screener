"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { AuthSection } from "@/components/landing/AuthSection";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { OtpSection } from "./otpSection";

export function LandingPage() {
    const authStep = useSelector((state: RootState) => state.authStep.step);

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
