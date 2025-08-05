"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  MoreHorizontal, 
  MapPin, 
  Calendar, 
  Users, 
  Eye, 
  DollarSign,
  Briefcase,
  Clock,
  Play,
  Pause,
  Trash2,
  Copy,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { jobStatuses } from "@/data/mockJobs";
import { formatDistanceToNow } from "date-fns";
import useJobServices from "@/lib/services/jobServices";
import { useSession } from "next-auth/react";

// Created by user information interface
interface CreatedByInfo {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  company_name?: string;
}

// Flexible job type that can handle API responses with optional fields
interface FlexibleJob {
  id: string;
  title?: string;
  department?: string;
  location?: string;
  job_type?: string;
  type?: string; // fallback
  experience_level?: string;
  experience?: string; // fallback
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  status?: string;
  total_applications?: number;
  applicants?: number; // fallback
  total_views?: number;
  views?: number; // fallback
  posted_platforms?: string[];
  remote_allowed?: boolean;
  urgent?: boolean;
  closing_date?: string;
  closingDate?: string; // fallback
  created_at?: string;
  postedDate?: string; // fallback
  updated_at?: string;
  updatedAt?: string; // fallback
  published_at?: string | null;
  user_id?: string;
  created_by?: CreatedByInfo; // API response field
  createdBy?: string; // fallback for old format
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [job, setJob] = useState<FlexibleJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const jobId = params.id as string;
  const { getJobById, updateJobStatus, deleteJob } = useJobServices();

  // Load job data on component mount
  useEffect(() => {
    if (status === "authenticated" && jobId) {
      loadJobData();
    }
  }, [status, jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobById(jobId);

      if (response?.result === "success" && response.records) {
        setJob(response.records);
      } else if (response?.result === "success" && response.record) {
        // Handle alternative response structure
        setJob(response.record);
      } else {
        setError(response?.message || "Failed to load job details");
      }
    } catch (err) {
      setError("An error occurred while loading job details");
      console.error("Error loading job:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading job details...
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch the job information.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading job</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={loadJobData}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Helper functions to handle flexible data fields
  const getPostedDate = () => {
    return job.postedDate || job.created_at || new Date().toISOString();
  };

  const getClosingDate = () => {
    return job.closingDate || job.closing_date || '';
  };

  const getCreatedBy = () => {
    // If we have the new created_by object structure
    if (job.created_by && typeof job.created_by === 'object') {
      return job.created_by.full_name;
    }
    // Fallback to old string format
    return job.createdBy || 'Unknown';
  };

  const getCreatedByDetails = () => {
    // Return the full created_by object if available
    if (job.created_by && typeof job.created_by === 'object') {
      return job.created_by;
    }
    return null;
  };

  const statusConfig = jobStatuses.find(s => s.value === job.status);
  
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
    if (!salary || !salary.min || !salary.max || !salary.currency) {
      return 'Not specified';
    }
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const handleAction = async (action: string) => {
    setShowMenu(false);
    
    try {
      switch (action) {
        case 'delete':
          const deleteResponse = await deleteJob(jobId);
          if (deleteResponse?.success) {
            router.push('/dashboard/jobs');
          } else {
            setError(deleteResponse?.message || 'Failed to delete job');
          }
          break;

        case 'activate':
          const activateResponse = await updateJobStatus(jobId, 'active');
          if (activateResponse?.success) {
            setJob(prev => prev ? { ...prev, status: 'active' } : null);
          } else {
            setError(activateResponse?.message || 'Failed to activate job');
          }
          break;

        case 'pause':
          const pauseResponse = await updateJobStatus(jobId, 'paused');
          if (pauseResponse?.success) {
            setJob(prev => prev ? { ...prev, status: 'paused' } : null);
          } else {
            setError(pauseResponse?.message || 'Failed to pause job');
          }
          break;

        default:
          console.log(`Action: ${action} on job ${jobId}`);
      }
    } catch (err) {
      setError('An error occurred while performing the action');
      console.error('Error performing job action:', err);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(job.status)}`}>
              {statusConfig?.label || job.status || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {(job.job_type || job.type)?.replace('-', ' ') || 'Unknown type'} • {(job.experience_level || job.experience) || 'Unknown'} level
            </span>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {job.title || 'Untitled Job'}
          </h1>
          <p className="text-gray-600 mt-1">
            {job.department || 'Unknown Department'} • Posted {formatDistanceToNow(new Date(getPostedDate()), { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/jobs/${job.id}/edit`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit
          </Link>
          
          <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Share2 className="w-4 h-4 mr-2 inline" />
            Share
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    <button
                      onClick={() => handleAction('duplicate')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate Job
                    </button>

                    {job.status === 'active' ? (
                      <button
                        onClick={() => handleAction('pause')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pause className="w-4 h-4" />
                        Pause Job
                      </button>
                    ) : job.status === 'paused' ? (
                      <button
                        onClick={() => handleAction('activate')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Play className="w-4 h-4" />
                        Activate Job
                      </button>
                    ) : null}

                    <div className="border-t border-gray-100 my-1" />
                    
                    <button
                      onClick={() => handleAction('delete')}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Applicants</p>
              <p className="text-2xl font-bold text-gray-900">{job.total_applications || job.applicants || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Views</p>
              <p className="text-2xl font-bold text-gray-900">{job.total_views || job.views || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Salary Range</p>
              <p className="text-lg font-bold text-gray-900">{formatSalary(job.salary)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.ceil((new Date().getTime() - new Date(getPostedDate()).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{job.location || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">{job.department || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Closing Date</p>
                  <p className="font-medium text-gray-900">
                    {getClosingDate() ? new Date(getClosingDate()).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-900">{getCreatedBy()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {job.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href={`/dashboard/jobs/${job.id}/applicants`}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-center block"
              >
                View Applicants ({job.total_applications || job.applicants || 0})
              </Link>
              
              <Link
                href={`/dashboard/jobs/${job.id}/edit`}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-center block"
              >
                Edit Job Posting
              </Link>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills && job.skills.length > 0 ? (
                job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills specified</p>
              )}
            </div>
          </div>

          {/* Job Creator Information */}
          {getCreatedByDetails() && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Creator</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getCreatedByDetails()?.full_name}</p>
                    <p className="text-sm text-gray-500">{getCreatedByDetails()?.email}</p>
                  </div>
                </div>
                
                {getCreatedByDetails()?.job_title && (
                  <div className="flex items-center gap-3 pl-13">
                    <div>
                      <p className="text-sm text-gray-500">Job Title</p>
                      <p className="font-medium text-gray-900">{getCreatedByDetails()?.job_title}</p>
                    </div>
                  </div>
                )}
                
                {getCreatedByDetails()?.company_name && (
                  <div className="flex items-center gap-3 pl-13">
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium text-gray-900">{getCreatedByDetails()?.company_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
