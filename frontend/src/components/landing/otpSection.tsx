"use client";
import {  ArrowRight } from "lucide-react";
import OtpForm from "../auth/OtpForm";

export function OtpSection() {
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
              OTP Verification
            </h2>
            <p className="text-gray-600 text-lg">
              Please enter the OTP sent to your email address to verify your
              account.
            </p>
          </div>

          {/* Auth Form */}
          <OtpForm />
        </div>
      </div>
    </div>
  );
}
