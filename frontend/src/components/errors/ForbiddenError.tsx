"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldX, Home, ArrowLeft, AlertCircle, User } from "lucide-react";

interface ForbiddenErrorProps {
  message?: string;
  requiredRole?: string;
}

export default function ForbiddenError({ 
  message = "You don't have permission to access this resource",
  requiredRole
}: ForbiddenErrorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-light)] via-[var(--background-white)] to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Shield X Icon */}
        <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'}`}>
          <div className="relative mb-8">
            <div className="relative">
              <ShieldX className="w-24 h-24 md:w-32 md:h-32 text-[var(--accent-pink)] mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-[var(--accent-pink)]/20 rounded-full animate-spin opacity-25" style={{animationDuration: '3s'}}></div>
              </div>
            </div>
            
            {/* Floating Warning */}
            <div className="absolute -top-4 -right-4 animate-bounce" style={{animationDelay: '0.5s'}}>
              <AlertCircle className="w-8 h-8 text-[var(--accent-pink)]" />
            </div>
          </div>
        </div>

        {/* 403 Code */}
        <div className={`transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-6xl md:text-7xl font-bold text-[var(--accent-pink)] opacity-20 mb-4 animate-pulse">
            403
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-1000 delay-400 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-dark)] mb-4">
            Access Forbidden
          </h1>
          <p className="text-lg text-[var(--text-gray)] mb-8 max-w-md mx-auto">
            {message}
          </p>

          {requiredRole && (
            <div className="mb-8 animate-fadeIn" style={{animationDelay: '0.8s'}}>
              <div className="inline-flex items-center px-4 py-2 bg-[var(--accent-pink)]/10 text-[var(--accent-pink)] rounded-full text-sm font-medium border border-[var(--accent-pink)]/20">
                <User className="w-4 h-4 mr-2" />
                Required Role: {requiredRole}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-[var(--gradient-primary)] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md group"
              style={{background: 'var(--gradient-primary)'}}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Dashboard
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

        {/* Permission Info */}
        <div className={`mt-12 transition-all duration-1000 delay-600 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-[var(--background-white)]/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--accent-pink)]/20 hover:border-[var(--accent-pink)]/40 transition-all duration-300">
            <h3 className="text-lg font-semibold text-[var(--text-dark)] mb-4">Need Access?</h3>
            <div className="text-sm text-[var(--text-gray)] space-y-3">
              <p>If you believe you should have access to this resource:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Contact your administrator to request permission</li>
                <li>Verify you're signed in with the correct account</li>
                <li>Check if your role has the necessary privileges</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--accent-pink)] rounded-full animate-ping opacity-75" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-[var(--primary-gradient-start)] rounded-full animate-pulse opacity-50" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[var(--accent-pink)] rounded-full animate-bounce opacity-60" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-[var(--primary-gradient-end)] rounded-full animate-ping opacity-40" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Help Text */}
        <div className={`mt-8 transition-all duration-1000 delay-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-[var(--text-light)]">
            Need help?{" "}
            <Link href="/contact" className="text-[var(--accent-pink)] hover:text-[var(--primary-gradient-start)] underline transition-colors duration-200">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}