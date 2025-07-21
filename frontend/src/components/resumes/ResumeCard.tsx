"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  Download,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical
} from "lucide-react";

interface Resume {
  id: string;
  fileName: string;
  candidateName: string;
  email: string;
  phone?: string;
  location?: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error' | 'pending';
  summary?: string;
  experience?: number;
  education?: string;
  skills: string[];
  fileSize: number;
  fileType: string;
}

interface ResumeCardProps {
  resume: Resume;
  viewMode: 'grid' | 'list';
}

export function ResumeCard({ resume, viewMode }: ResumeCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusConfig = (status: Resume['status']) => {
    const configs = {
      processing: {
        icon: Clock,
        text: 'Processing',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      completed: {
        icon: CheckCircle,
        text: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      error: {
        icon: AlertTriangle,
        text: 'Error',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      pending: {
        icon: Clock,
        text: 'Pending Review',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(resume.status);
  const StatusIcon = statusConfig.icon;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Downloading:', resume.fileName);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${resume.candidateName}'s resume?`)) {
      console.log('Deleting:', resume.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/dashboard/resumes/${resume.id}`}>
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* File Icon */}
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>

              {/* Resume Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{resume.candidateName}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.className}`}>
                    {statusConfig.text}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{resume.email}</span>
                  </div>
                  {resume.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{resume.location}</span>
                    </div>
                  )}
                  {resume.experience && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{resume.experience} years</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                {resume.skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {resume.skills.length > 3 && (
                  <span className="text-xs text-gray-500">+{resume.skills.length - 3}</span>
                )}
              </div>

              {/* Upload Date */}
              <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                <Calendar className="w-4 h-4" />
                <span>{resume.uploadDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={`/dashboard/resumes/${resume.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          <StatusIcon className="w-4 h-4" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.className}`}>
            {statusConfig.text}
          </span>
        </div>

        {/* Candidate Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{resume.candidateName}</h3>
          <p className="text-sm text-gray-600 truncate">{resume.email}</p>
          {resume.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{resume.location}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {resume.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {resume.summary}
          </p>
        )}

        {/* Experience */}
        {resume.experience && (
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{resume.experience} years experience</span>
          </div>
        )}

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {resume.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {resume.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{resume.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{resume.uploadDate.toLocaleDateString()}</span>
          </div>
          <span>{resume.fileSize} MB • {resume.fileType}</span>
        </div>
      </div>
    </Link>
  );
}
