"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Server, Home, RefreshCw, AlertTriangle, Clock } from "lucide-react";

interface ServerErrorProps {
  statusCode?: number;
  message?: string;
  errorId?: string;
}

export default function ServerError({ 
  statusCode = 500,
  message = "Internal server error occurred",
  errorId
}: ServerErrorProps){
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const getErrorTitle = () => {
    switch (statusCode) {
      case 500:
        return "Internal Server Error";
      case 502:
        return "Bad Gateway";
      case 503:
        return "Service Unavailable";
      case 504:
        return "Gateway Timeout";
      default:
        return "Server Error";
    }
  };

  const getErrorDescription = () => {
    switch (statusCode) {
      case 500:
        return "Something went wrong on our servers. We're working to fix this issue.";
      case 502:
        return "We're having trouble connecting to our servers. Please try again in a moment.";
      case 503:
        return "Our service is temporarily unavailable. We're performing maintenance.";
      case 504:
        return "The server is taking too long to respond. Please try again later.";
      default:
        return message;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-light)] via-[var(--background-white)] to-[var(--accent-pink)]/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Server Icon */}
        <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-180'}`}>
          <div className="relative mb-8">
            <div className="relative">
              <Server className="w-24 h-24 md:w-32 md:h-32 text-[var(--accent-pink)] mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-[var(--accent-pink)]/20 rounded-full animate-spin opacity-25" style={{animationDuration: '3s'}}></div>
              </div>
            </div>
            
            {/* Floating Warning */}
            <div className="absolute -top-4 -right-4 animate-bounce" style={{animationDelay: '0.4s'}}>
              <AlertTriangle className="w-8 h-8 text-[var(--accent-pink)]" />
            </div>
          </div>
        </div>

        {/* Status Code */}
        <div className={`transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-6xl md:text-7xl font-bold text-[var(--accent-pink)] opacity-20 mb-4 animate-pulse">
            {statusCode}
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-1000 delay-400 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-dark)] mb-4">
            {getErrorTitle()}
          </h1>
          <p className="text-lg text-[var(--text-gray)] mb-8 max-w-md mx-auto">
            {getErrorDescription()}
          </p>

          {/* Error ID */}
          {errorId && (
            <div className="mb-8 animate-fadeIn" style={{animationDelay: '0.8s'}}>
              <div className="inline-flex items-center px-4 py-2 bg-[var(--accent-pink)]/10 text-[var(--accent-pink)] rounded-full text-sm font-medium border border-[var(--accent-pink)]/20">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Error ID: {errorId}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className={`inline-flex items-center px-6 py-3 font-medium rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md group ${
                retryCount >= 3 
                  ? 'bg-[var(--text-light)] text-[var(--text-gray)] cursor-not-allowed' 
                  : 'bg-[var(--gradient-primary)] text-white hover:shadow-lg'
              }`}
              style={retryCount < 3 ? {background: 'var(--gradient-primary)'} : {}}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${retryCount >= 3 ? '' : 'group-hover:animate-spin'}`} />
              {retryCount >= 3 ? 'Max Retries Reached' : `Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[var(--background-white)] text-[var(--text-gray)] font-medium rounded-lg border border-[var(--text-light)] hover:bg-[var(--background-light)] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md group"
            >
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Go Home
            </Link>
          </div>
        </div>

        {/* Status Information */}
        <div className={`mt-12 transition-all duration-1000 delay-600 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-[var(--background-white)]/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--accent-pink)]/20 hover:border-[var(--accent-pink)]/40 transition-all duration-300">
            <h3 className="text-lg font-semibold text-[var(--text-dark)] mb-4">What's happening?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--text-gray)]">
              <div className="flex items-start space-x-3 group hover:scale-105 transition-transform duration-200">
                <Server className="w-5 h-5 text-[var(--accent-pink)] mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                <div>
                  <p className="font-medium">Server Issue</p>
                  <p>Our servers are experiencing technical difficulties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:scale-105 transition-transform duration-200">
                <Clock className="w-5 h-5 text-[var(--accent-pink)] mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
                <div>
                  <p className="font-medium">Temporary</p>
                  <p>This is usually a temporary issue that resolves quickly</p>
                </div>
              </div>
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
            If the problem persists, please{" "}
            <Link href="/contact" className="text-[var(--accent-pink)] hover:text-[var(--primary-gradient-start)] underline transition-colors duration-200">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}