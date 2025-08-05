"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Eye, 
  MoreHorizontal, 
  Edit, 
  Pause, 
  Play, 
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Job, jobStatuses } from "@/data/mockJobs";
import { formatDistanceToNow } from "date-fns";

// Flexible job type that can handle API responses with optional fields
interface FlexibleJob {
  id: string;
  title?: string;
  department?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  status?: string;
  applicants?: number;
  views?: number;
  postedDate?: string;
  created_at?: string;
  closingDate?: string;
  createdBy?: string;
  updatedAt?: string;
}

interface JobListViewProps {
  jobs: FlexibleJob[];
  onAction: (jobId: string, action: string) => void;
}

export function JobListView({ jobs, onAction }: JobListViewProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary?: FlexibleJob['salary']) => {
    if (!salary || typeof salary.min !== 'number' || typeof salary.max !== 'number') {
      return 'Salary not specified';
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const handleMenuAction = (jobId: string, action: string) => {
    setActiveMenu(null);
    onAction(jobId, action);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-4">Job Title</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Applicants</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {jobs.map((job) => {
          const statusConfig = jobStatuses.find(s => s.value === job.status);
          
          return (
            <div key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Job Title */}
                <div className="col-span-4">
                  <Link 
                    href={`/dashboard/jobs/${job.id}`}
                    className="block hover:text-yellow-600 transition-colors duration-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {job.title || 'Untitled Job'}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Posted {job.postedDate 
                        ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })
                        : job.created_at 
                          ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
                          : 'recently'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatSalary(job.salary)}
                  </div>
                </div>

                {/* Department */}
                <div className="col-span-2">
                  <span className="text-sm text-gray-900">{job.department || 'No department'}</span>
                  <div className="text-xs text-gray-500 capitalize mt-1">
                    {job.job_type ? job.job_type.replace('-', ' ') : 'Not specified'} • {job.experience_level || 'Not specified'}
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{job.location || 'Location not specified'}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status || 'draft')}`}>
                    {statusConfig?.label || 'Draft'}
                  </span>
                </div>

                {/* Applicants */}
                <div className="col-span-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{job.applicants || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{job.views || 0}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/jobs/${job.id}/applicants`}
                    className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                  >
                    View Applicants
                  </Link>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenu === job.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <div className="py-1">
                            <Link
                              href={`/dashboard/jobs/${job.id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Edit className="w-4 h-4" />
                              Edit Job
                            </Link>
                            
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setActiveMenu(null)}
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Details
                            </Link>

                            <button
                              onClick={() => handleMenuAction(job.id, 'duplicate')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" />
                              Duplicate
                            </button>

                            {job.status === 'active' ? (
                              <button
                                onClick={() => handleMenuAction(job.id, 'pause')}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pause className="w-4 h-4" />
                                Pause Job
                              </button>
                            ) : job.status === 'paused' ? (
                              <button
                                onClick={() => handleMenuAction(job.id, 'activate')}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Play className="w-4 h-4" />
                                Activate Job
                              </button>
                            ) : null}

                            <div className="border-t border-gray-100 my-1" />
                            
                            <button
                              onClick={() => handleMenuAction(job.id, 'delete')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Job
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
