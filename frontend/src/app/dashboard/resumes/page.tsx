"use client";

import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { ResumeStats } from "@/components/resumes/ResumeStats";

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
          <button className="inline-flex items-center px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ResumeStats />

      {/* Coming Soon Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resume Grid & Search (Coming Next)
        </h2>
        <p className="text-gray-600 mb-4">
          The resume grid, search, and filtering functionality will be added here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-2">Search & Filter</h3>
            <p className="text-sm text-blue-700">Find resumes by skills, experience, location</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <h3 className="font-medium text-green-900 mb-2">Grid & List View</h3>
            <p className="text-sm text-green-700">Toggle between grid and list layouts</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <h3 className="font-medium text-purple-900 mb-2">Resume Details</h3>
            <p className="text-sm text-purple-700">View detailed resume information</p>
          </div>
        </div>
      </div>
    </div>
  );
}
