"use client";

import { useState } from "react";
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
  MoreVertical,
  Star,
  User
} from "lucide-react";
import { Resume } from "@/data/mockResumes";
import { formatDistanceToNow } from "date-fns";

interface ResumeCardProps {
  resume: Resume;
  onView?: (resume: Resume) => void;
  onDownload?: (resume: Resume) => void;
  onDelete?: (resume: Resume) => void;
  onStatusChange?: (resume: Resume, status: Resume['status']) => void;
}

export function ResumeCard({
  resume,
  onView,
  onDownload,
  onDelete,
  onStatusChange
}: ResumeCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'interviewed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'hired': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'new': return <Clock className="w-3 h-3" />;
      case 'reviewed': return <Eye className="w-3 h-3" />;
      case 'shortlisted': return <Star className="w-3 h-3" />;
      case 'interviewed': return <User className="w-3 h-3" />;
      case 'rejected': return <AlertTriangle className="w-3 h-3" />;
      case 'hired': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
            {resume.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{resume.name}</h3>
            <p className="text-gray-600 text-sm">{resume.title}</p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
              <button
                onClick={() => onView?.(resume)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => onDownload?.(resume)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => onDelete?.(resume)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and Match Score */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(resume.status)}`}>
          {getStatusIcon(resume.status)}
          {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
        </div>

        {(resume.matchScore ?? (resume as any).ai_overall_score) && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Match</div>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(resume.matchScore ?? (resume as any).ai_overall_score) as number}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">{(resume.matchScore ?? (resume as any).ai_overall_score) as number}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span className="truncate">{resume.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{resume.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="w-4 h-4" />
          <span>{resume.experience} years experience</span>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {resume.skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {skill}
            </span>
          ))}
          {resume.skills.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
              +{resume.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-3 text-sm text-gray-600">
          <p className="line-clamp-2 truncate">{resume.summary}</p>
        </div>
      )}

      {/* Education (first) */}
      {Array.isArray(resume.education) && resume.education.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          <span>
            {resume.education[0].degree}
            {resume.education[0].school ? ` • ${resume.education[0].school}` : ''}
            {resume.education[0].year ? ` • ${resume.education[0].year}` : ''}
          </span>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(resume.tags) && resume.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {resume.tags.slice(0, 5).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
          ))}
          {resume.tags.length > 5 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">+{resume.tags.length - 5}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Uploaded {formatDistanceToNow(new Date(resume.uploadDate), { addSuffix: true })}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileText className="w-3 h-3" />
          <span>
            {resume.fileType?.toUpperCase()}
            {typeof resume.fileSize === 'number' && resume.fileSize > 0 ? ` • ${formatFileSize(resume.fileSize)}` : ''}
            {resume.source ? ` • ${resume.source}` : ''}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView?.(resume)}
          className="flex-1 px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
        >
          View Resume
        </button>
        <button
          onClick={() => onDownload?.(resume)}
          className="px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Status Change Dropdown - Hidden but accessible for functionality */}
      <select
        value={resume.status}
        onChange={(e) => onStatusChange?.(resume, e.target.value as Resume['status'])}
        className="hidden"
        aria-hidden="true"
      >
        <option value="new">New</option>
        <option value="reviewed">Reviewed</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interviewed">Interviewed</option>
        <option value="rejected">Rejected</option>
        <option value="hired">Hired</option>
      </select>
    </div>
  );
}
