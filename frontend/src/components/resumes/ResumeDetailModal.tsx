"use client";

import { useState } from "react";
import { 
  X, 
  Download, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 

  Briefcase,
  GraduationCap,
  FileText,
  Star,

} from "lucide-react";
import { Resume } from "@/data/mockResumes";
import { formatDistanceToNow } from "date-fns";

interface ResumeDetailModalProps {
  resume: Resume | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (resume: Resume) => void;
  onEdit?: (resume: Resume) => void;
  onDelete?: (resume: Resume) => void;
  onStatusChange?: (resume: Resume, status: Resume['status']) => void;
}

export function ResumeDetailModal({
  resume,
  isOpen,
  onClose,
  onDownload,
  onEdit,
  onDelete,
  onStatusChange
}: ResumeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'skills' | 'education'>('overview');

  if (!isOpen || !resume) return null;

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusOptions: Resume['status'][] = ['new', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-all duration-300"
        style={{ backgroundColor: '#04050587' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                {resume.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 sm:flex-none">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{resume.name}</h2>
                <p className="text-base sm:text-lg text-gray-600">{resume.title}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(resume.status)}`}>
                    {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                  </div>
                  {resume.matchScore && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <span className="text-xs sm:text-sm font-medium">{resume.matchScore}% Match</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-0">
              <button
                onClick={() => onDownload?.(resume)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                title="Download Resume"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => onEdit?.(resume)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                title="Edit Resume"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => onDelete?.(resume)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                title="Delete Resume"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'experience', label: 'Experience', icon: Briefcase },
                { id: 'skills', label: 'Skills', icon: Star },
                { id: 'education', label: 'Education', icon: GraduationCap }
              ].map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
                      activeTab === tab.id
                        ? 'border-yellow-500 text-yellow-600 bg-white shadow-sm rounded-t-lg'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
                    }`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${
                      activeTab === tab.id ? 'scale-110' : ''
                    }`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Enhanced Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Contact Information */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-yellow-500" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Email</p>
                        <p className="font-medium text-sm sm:text-base break-all">{resume.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                      <Phone className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-sm sm:text-base">{resume.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                      <MapPin className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Location</p>
                        <p className="font-medium text-sm sm:text-base">{resume.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                      <Briefcase className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Experience</p>
                        <p className="font-medium text-sm sm:text-base">{resume.experience} years</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Professional Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{resume.summary}</p>
                </div>

                {/* Enhanced File Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    File Information
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">File Type</p>
                        <p className="font-medium">{resume.fileType.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">File Size</p>
                        <p className="font-medium">{formatFileSize(resume.fileSize)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Uploaded</p>
                        <p className="font-medium">{formatDistanceToNow(new Date(resume.uploadDate), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{resume.title}</h4>
                        <p className="text-gray-600">Current Position</p>
                        <p className="text-sm text-gray-500 mt-1">{resume.experience} years of experience</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Present</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-3">{resume.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                <div className="space-y-4">
                  {resume.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.school}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{edu.year}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Change Status:</span>
              <select
                value={resume.status}
                onChange={(e) => onStatusChange?.(resume, e.target.value as Resume['status'])}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onDownload?.(resume)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Download Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
