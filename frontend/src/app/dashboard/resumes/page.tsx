"use client";

import { useState } from "react";
import { Upload, Briefcase, Grid3X3, List } from "lucide-react";
import Link from "next/link";
import { ResumeStats } from "@/components/resumes/ResumeStats";
import { ResumeGrid } from "@/components/resumes/ResumeGrid";
import { JobGroupedResumeView } from "@/components/resumes/JobGroupedResumeView";

export default function ResumesPage() {
  const [viewType, setViewType] = useState<'traditional' | 'job-grouped'>('job-grouped');

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
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewType('job-grouped')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors duration-200 ${
                viewType === 'job-grouped'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              By Job
            </button>
            <button
              onClick={() => setViewType('traditional')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors duration-200 ${
                viewType === 'traditional'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              All Resumes
            </button>
          </div>

          <Link
            href="/dashboard/resumes/upload"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-medium rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <ResumeStats />

      {/* Resume Views */}
      {viewType === 'job-grouped' ? (
        <JobGroupedResumeView />
      ) : (
        <ResumeGrid />
      )}
    </div>
  );
}
