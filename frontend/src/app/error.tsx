"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, Bug, ArrowLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Error Icon */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative mb-8">
            <div className="animate-pulse">
              <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-red-500 mx-auto" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-red-200 rounded-full animate-ping opacity-25"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Something went wrong!
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            We encountered an unexpected error. Don't worry, our team has been notified 
            and we're working to fix this issue.
          </p>

          {/* Error Details Toggle */}
          <div className="mb-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <Bug className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left max-w-lg mx-auto">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {error.message || "Unknown error occurred"}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Floating Error Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-50"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-red-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
        </div>

        {/* Help Text */}
        <div className={`mt-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-gray-500">
            If this problem persists, please{" "}
            <Link href="/contact" className="text-red-600 hover:text-red-700 underline">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}