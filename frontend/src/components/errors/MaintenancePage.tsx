"use client";

import { useState, useEffect } from "react";
import { Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface MaintenancePageProps {
  estimatedTime?: string;
  message?: string;
  features?: string[];
}

export default function MaintenancePage({
  estimatedTime = "2 hours",
  message = "We're currently performing scheduled maintenance to improve your experience.",
  features = [
    "Enhanced security measures",
    "Performance improvements", 
    "New features and bug fixes",
    "Database optimizations"
  ]
}: MaintenancePageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsVisible(true);
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-light)] via-[var(--background-white)] to-[var(--primary-gradient-start)]/20 flex items-center justify-center p-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Animated Maintenance Icon */}
        <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-45'}`}>
          <div className="relative mb-8">
            <div className="relative">
              <Wrench className="w-24 h-24 md:w-32 md:h-32 text-[var(--primary-gradient-start)] mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-[var(--primary-gradient-start)]/20 rounded-full animate-spin opacity-25" style={{animationDuration: '4s'}}></div>
              </div>
            </div>
            
            {/* Floating Clock */}
            <div className="absolute -top-4 -right-4 animate-bounce" style={{animationDelay: '0.3s'}}>
              <Clock className="w-8 h-8 text-[var(--primary-gradient-end)]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
            Under Maintenance
          </h1>
          <p className="text-lg text-[var(--text-gray)] mb-8 max-w-2xl mx-auto">
            {message}
          </p>

          {/* Estimated Time */}
          <div className="mb-8 animate-fadeIn" style={{animationDelay: '0.6s'}}>
            <div className="inline-flex items-center px-6 py-3 bg-[var(--primary-gradient-start)]/10 text-[var(--primary-gradient-start)] rounded-full text-lg font-medium border border-[var(--primary-gradient-start)]/20">
              <Clock className="w-5 h-5 mr-2 animate-spin" style={{animationDuration: '2s'}} />
              Estimated Time: {estimatedTime}
            </div>
          </div>

          {/* Current Time */}
          <div className="mb-12">
            <p className="text-sm text-[var(--text-light)] mb-2">Current Time</p>
            <p className="text-2xl font-mono text-[var(--text-dark)] animate-pulse">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* What We're Working On */}
        <div className={`transition-all duration-1000 delay-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-[var(--background-white)]/80 backdrop-blur-sm rounded-2xl p-8 border border-[var(--primary-gradient-start)]/20 hover:border-[var(--primary-gradient-start)]/40 transition-all duration-300">
            <h3 className="text-2xl font-semibold text-[var(--text-dark)] mb-6">What we're working on</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 text-left group hover:scale-105 transition-transform duration-200">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-gradient-start)] flex-shrink-0 group-hover:animate-pulse" />
                  <span className="text-[var(--text-gray)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Updates */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="bg-[var(--primary-gradient-start)]/10 rounded-2xl p-6 border border-[var(--primary-gradient-start)]/20">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <AlertCircle className="w-5 h-5 text-[var(--primary-gradient-start)] animate-pulse" />
              <h4 className="text-lg font-semibold text-[var(--text-dark)]">Stay Updated</h4>
            </div>
            <p className="text-[var(--text-gray)] text-sm">
              Follow our status page for real-time updates on the maintenance progress.
              We'll notify you as soon as we're back online!
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--primary-gradient-start)] rounded-full animate-ping opacity-75" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-[var(--primary-gradient-end)] rounded-full animate-pulse opacity-50" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[var(--primary-gradient-start)] rounded-full animate-bounce opacity-60" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-[var(--primary-gradient-end)] rounded-full animate-ping opacity-40" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Footer */}
        <div className={`mt-12 transition-all duration-1000 delay-900 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-[var(--text-light)]">
            Thank you for your patience while we make improvements to serve you better.
          </p>
        </div>
      </div>
    </div>
  );
}