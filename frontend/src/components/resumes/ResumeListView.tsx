"use client";

import { useState } from "react";
import { 
  FileText, 
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

interface ResumeListViewProps {
  resumes: Resume[];
  onView?: (resume: Resume) => void;
  onDownload?: (resume: Resume) => void;
  onDelete?: (resume: Resume) => void;
  onStatusChange?: (resume: Resume, status: Resume['status']) => void;
}

export function ResumeListView({ 
  resumes, 
  onView, 
  onDownload, 
  onDelete, 
  // onStatusChange 
}: ResumeListViewProps) {
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumes(prev => 
      prev.includes(resumeId) 
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedResumes(prev => 
      prev.length === resumes.length ? [] : resumes.map(r => r.id)
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center">
          <div className="flex items-center w-8">
            <input
              type="checkbox"
              checked={selectedResumes.length === resumes.length && resumes.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
            />
          </div>
          <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Experience</div>
            <div className="col-span-1">Match</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
              selectedResumes.includes(resume.id) ? 'bg-yellow-50' : ''
            }`}
          >
            <div className="flex items-center">
              {/* Checkbox */}
              <div className="flex items-center w-8">
                <input
                  type="checkbox"
                  checked={selectedResumes.includes(resume.id)}
                  onChange={() => toggleResumeSelection(resume.id)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
              </div>

              {/* Content Grid */}
              <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                {/* Candidate Info */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {resume.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{resume.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {resume.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {resume.location}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div className="col-span-2">
                  <div className="font-medium text-gray-900">{resume.title}</div>
                  <div className="text-sm text-gray-500">
                    {resume.skills.slice(0, 2).join(', ')}
                    {resume.skills.length > 2 && ` +${resume.skills.length - 2}`}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(resume.status)}`}>
                    {getStatusIcon(resume.status)}
                    {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                  </div>
                </div>

                {/* Experience */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Briefcase className="w-3 h-3" />
                    {resume.experience}y
                  </div>
                </div>

                {/* Match Score */}
                <div className="col-span-1">
                  {resume.matchScore ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                          style={{ width: `${resume.matchScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{resume.matchScore}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>

                {/* Upload Date */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(resume.uploadDate), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {resume.fileType.toUpperCase()} • {formatFileSize(resume.fileSize)}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === resume.id ? null : resume.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeDropdown === resume.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            onView?.(resume);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            onDownload?.(resume);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.(resume);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedResumes.length > 0 && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-800">
              {selectedResumes.length} resume{selectedResumes.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm font-medium text-yellow-700 hover:text-yellow-800">
                Download All
              </button>
              <button className="px-3 py-1 text-sm font-medium text-yellow-700 hover:text-yellow-800">
                Change Status
              </button>
              <button className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export for TypeScript module resolution
