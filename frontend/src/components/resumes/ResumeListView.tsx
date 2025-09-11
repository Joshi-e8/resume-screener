"use client";

import { useState, useEffect, useRef } from "react";
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
  onBulkDownload?: (resumeIds: string[]) => void;
  onBulkDelete?: (resumeIds: string[]) => void;
  onBulkStatusChange?: (resumeIds: string[], status: Resume['status']) => void;
}

export function ResumeListView(props: ResumeListViewProps) {
  const {
    resumes,
    onView,
    onDownload,
    onDelete,
    onStatusChange,
    onBulkDownload,
    onBulkDelete,
    onBulkStatusChange
  } = props;
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);



  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBulkDownload = () => {
    if (selectedResumes.length > 0 && onBulkDownload) {
      onBulkDownload(selectedResumes);
    }
  };

  const handleBulkDelete = () => {
    if (selectedResumes.length > 0 && onBulkDelete) {
      onBulkDelete(selectedResumes);
    }
  };

  const handleBulkStatusChange = (status: Resume['status']) => {
    if (selectedResumes.length === 0) {
      alert('Please select resumes first');
      setShowStatusDropdown(false);
      return;
    }
    if (onBulkStatusChange) {
      onBulkStatusChange(selectedResumes, status);
      setShowStatusDropdown(false);
    } else {
      alert('Bulk status change not available');
      setShowStatusDropdown(false);
    }
  };

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
                  <select
                    value={resume.status}
                    onChange={(e) => onStatusChange?.(resume, e.target.value as Resume['status'])}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
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
                  {(resume.matchScore ?? (resume as any).ai_overall_score) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                          style={{ width: `${(resume.matchScore ?? (resume as any).ai_overall_score) as number}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{(resume.matchScore ?? (resume as any).ai_overall_score) as number}%</span>
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
                    {resume.fileType?.toUpperCase()} • {typeof resume.fileSize === 'number' && resume.fileSize > 0 ? formatFileSize(resume.fileSize) : '—'}
                    {resume.source ? ` • ${resume.source}` : ''}
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
              <button
                onClick={() => {
                  console.log('Download All clicked');
                  console.log('selectedResumes:', selectedResumes);
                  console.log('onBulkDownload exists:', !!onBulkDownload);
                  console.log('onBulkDownload type:', typeof onBulkDownload);

                  if (selectedResumes.length === 0) {
                    alert('Please select resumes first');
                    return;
                  }
                  if (onBulkDownload) {
                    console.log('Calling onBulkDownload with:', selectedResumes);
                    onBulkDownload(selectedResumes);
                  } else {
                    alert('Bulk download not available');
                  }
                }}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Download All
              </button>

              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="px-3 py-1 text-sm font-medium text-yellow-700 hover:text-yellow-800 transition-colors duration-200"
                >
                  Change Status
                </button>

                {showStatusDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[120px]">
                    <button
                      onClick={() => handleBulkStatusChange('new')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      New
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('reviewed')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Reviewed
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('shortlisted')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Shortlisted
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('interviewed')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Interviewed
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('rejected')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Rejected
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('hired')}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Hired
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  console.log('Delete All clicked');
                  console.log('selectedResumes:', selectedResumes);
                  console.log('onBulkDelete exists:', !!onBulkDelete);
                  console.log('onBulkDelete type:', typeof onBulkDelete);

                  if (selectedResumes.length === 0) {
                    alert('Please select resumes first');
                    return;
                  }
                  if (onBulkDelete) {
                    console.log('Calling onBulkDelete with:', selectedResumes);
                    onBulkDelete(selectedResumes);
                  } else {
                    alert('Bulk delete not available');
                  }
                }}
                className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
              >
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
