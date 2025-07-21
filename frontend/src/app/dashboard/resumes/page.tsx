"use client";

import {Upload } from "lucide-react";
import Link from "next/link";
import { ResumeStats } from "@/components/resumes/ResumeStats";
import { ResumeGrid } from "@/components/resumes/ResumeGrid";

export default function ResumesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Resume Management
          </h1>
          <p className="text-gray-600 mt-1">
            Upload, organize, and manage candidate resumes
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/resumes/upload"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-medium rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Link>
          {/* <button className="inline-flex items-center px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Bulk Upload
          </button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <ResumeStats />

      {/* Resume Grid with Integrated Search & Filters */}
      <ResumeGrid />
    </div>
  );
}
