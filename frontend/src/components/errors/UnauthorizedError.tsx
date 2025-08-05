"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, LogIn, Home, Shield, ArrowRight } from "lucide-react";

interface UnauthorizedErrorProps {
  message?: string;
  redirectUrl?: string;
}

export default function UnauthorizedError({ 
  message = "You need to sign in to access this page",
  redirectUrl = "/auth/signin"
}: UnauthorizedErrorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-light)] via-[var(--background-white)] to-[var(--primary-gradient-start)]/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Lock Icon */}
        <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'}`}>
          <div className="relative mb-8">
            <div className="relative">
              <Lock className="w-24 h-24 md:w-32 md:h-32 text-[var(--primary-gradient-start)] mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-[var(--primary-gradient-start)]/20 rounded-full animate-spin opacity-25" style={{animationDuration: '3s'}}></div>
              </div>
            </div>
            
            {/* Floating Shield */}
            <div className="absolute -top-4 -right-4 animate-bounce" style={{animationDelay: '0.3s'}}>
              <Shield className="w-8 h-8 text-[var(--primary-gradient-end)]" />
            </div>
          </div>
        </div>

        {/* 401 Code */}
        <div className={`transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-6xl md:text-7xl font-bold text-[var(--primary-gradient-start)] opacity-20 mb-4 animate-pulse">
            401
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-1000 delay-400 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-dark)] mb-4">
            Authentication Required
          </h1>
          <p className="text-lg text-[var(--text-gray)] mb-8 max-w-md mx-auto">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={redirectUrl}
              className="inline-flex items-center px-6 py-3 bg-[var(--gradient-primary)] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md group"
              style={{background: 'var(--gradient-primary)'}}
            >
              <LogIn className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Sign In
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[var(--background-white)] text-[var(--text-gray)] font-medium rounded-lg border border-[var(--text-light)] hover:bg-[var(--background-light)] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md group"
            >
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Go Home
            </Link>
          </div>
        </div>

        {/* Security Features */}
        <div className={`mt-12 transition-all duration-1000 delay-600 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-[var(--background-white)]/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--primary-gradient-start)]/20 hover:border-[var(--primary-gradient-start)]/40 transition-all duration-300">
            <h3 className="text-lg font-semibold text-[var(--text-dark)] mb-4">Why do I need to sign in?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--text-gray)]">
              <div className="flex items-start space-x-3 group hover:scale-105 transition-transform duration-200">
                <Shield className="w-5 h-5 text-[var(--primary-gradient-start)] mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                <div>
                  <p className="font-medium">Secure Access</p>
                  <p>Protect your personal information and data</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:scale-105 transition-transform duration-200">
                <Lock className="w-5 h-5 text-[var(--primary-gradient-start)] mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                <div>
                  <p className="font-medium">Personalized Experience</p>
                  <p>Access your dashboard and saved preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--primary-gradient-start)] rounded-full animate-ping opacity-75" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-[var(--primary-gradient-end)] rounded-full animate-pulse opacity-50" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[var(--primary-gradient-start)] rounded-full animate-bounce opacity-60" style={{animationDelay: '2s'}}></div>
        </div>
      </div>
    </div>
  );
}