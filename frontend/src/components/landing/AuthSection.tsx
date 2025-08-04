"use client";

import { Suspense, useState } from "react";
import { AuthForm } from "../auth/AuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LinkedInSignInButton } from "@/components/auth/LinkedInSignInButton";
import { Shield, Lock, Zap, ArrowRight } from "lucide-react";

export function AuthSection() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  return (
    <div className="flex justify-center lg:justify-end">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{
                background:
                  "linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)",
              }}
            >
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {authMode === "login" ? "Welcome Back!" : "Get Started"}
            </h2>
            <p className="text-gray-600 text-lg">
              {authMode === "login"
                ? "Sign in to access your dashboard"
                : "Create your account to begin"}
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                authMode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                authMode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <AuthForm mode={authMode} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>
          <Suspense>
            {/* Social Sign In Buttons */}
            <div className="space-y-3 mb-6">
              <GoogleSignInButton />
              <LinkedInSignInButton />
            </div>
          </Suspense>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-3 h-3 text-blue-600" />
                </div>
                <span>Your data is always protected</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-purple-600" />
                </div>
                <span>Get started in under 30 seconds</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-accent-pink hover:underline font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-accent-pink hover:underline font-medium"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
