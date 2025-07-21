"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { AuthSection } from "@/components/landing/AuthSection";

export function LandingPage() {
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
              <AuthSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
