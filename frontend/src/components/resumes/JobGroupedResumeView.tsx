"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ChevronDown,
  ChevronRight,
  Briefcase,
  Users,
  Calendar,
  MapPin,
  Building,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { ResumeCard } from "./ResumeCard";
import { ResumeListView } from "./ResumeListView";
import { ResumeDetailModal } from "./ResumeDetailModal";
import { Resume } from "@/data/mockResumes";
import useJobServices from "@/lib/services/jobServices";
import useResumeServices from "@/lib/services/resumeServices";
import { formatDistanceToNow } from "date-fns";

interface JobGroup {
  job: {
    id: string;
    title: string;
    department?: string;
    location: string;
    status: string;
    created_at: string;
    total_applications: number;
  };
  resumes: Resume[];
}

interface JobGroupedResumeViewProps {
  onView?: (resume: Resume) => void;
  onDownload?: (resume: Resume) => void;
  onDelete?: (resume: Resume) => void;
  onStatusChange?: (resume: Resume, status: Resume['status']) => void;
}

export function JobGroupedResumeView({
  onView,
  onDownload,
  onDelete,
  onStatusChange
}: JobGroupedResumeViewProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Services
  const { bulkDownloadResumes, bulkDeleteResumes, bulkUpdateStatus } = useResumeServices();

  // Modal state
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Use ref to track if data has been fetched to prevent multiple calls
  const hasFetchedData = useRef(false);
  const jobServices = useJobServices();
  const resumeServices = useResumeServices();

  // Fetch jobs and their associated resumes
  useEffect(() => {
    // Only fetch data if user is authenticated and we haven't fetched yet
    if (status !== 'authenticated' || !session || hasFetchedData.current) {
      if (status === 'unauthenticated') {
        setLoading(false);
      }
      return;
    }

    const fetchJobsAndResumes = async () => {
      try {
        setLoading(true);
        hasFetchedData.current = true; // Mark as fetched to prevent multiple calls

        // Get all jobs
        const jobsResponse = await jobServices.getAllJobs({ status: 'active' });
        const jobs = jobsResponse?.records || [];

        // Get all resumes to also include unassociated ones
        const allResumesResponse = await resumeServices.getAllResumes();
        const allResumes = allResumesResponse?.records || [];

        // Group resumes by job
        const jobGroupsMap = new Map<string, JobGroup>();
        
        // Initialize job groups
        for (const job of jobs) {
          jobGroupsMap.set(job.id, {
            job: {
              id: job.id,
              title: job.title,
              department: job.department,
              location: job.location,
              status: job.status,
              created_at: job.created_at,
              total_applications: job.total_applications || 0
            },
            resumes: []
          });
        }

        // Add unassociated resumes group
        jobGroupsMap.set('unassociated', {
          job: {
            id: 'unassociated',
            title: 'Unassociated Resumes',
            department: undefined,
            location: 'Various',
            status: 'active',
            created_at: new Date().toISOString(),
            total_applications: 0
          },
          resumes: []
        });

        // Distribute resumes to their respective job groups
        for (const resume of allResumes) {
          // Helper function to derive name from email or filename
          const deriveNameFromEmail = (email: string) => {
            if (!email) return '';
            return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          };

          const deriveNameFromFilename = (filename: string) => {
            if (!filename) return '';
            return filename.replace(/\.[^/.]+$/, '').replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          };

          const fallbackName = deriveNameFromEmail(resume.candidate_email) || deriveNameFromFilename(resume.filename);

          const mappedResume: Resume = {
            id: resume.id || resume.file_id,
            name: resume.candidate_name || fallbackName || resume.filename || 'Unknown',
            email: resume.candidate_email || '',
            phone: resume.phone || '',
            location: resume.location || '',
            title: resume.title || '',
            experience: Number(resume.total_experience_years || 0),
            skills: Array.isArray(resume.key_skills) ? resume.key_skills : [],
            education: Array.isArray(resume.education)
              ? resume.education.map((e: any) => ({
                  degree: e?.degree || '',
                  school: e?.institution || e?.school || '',
                  year: Number(e?.year || 0)
                }))
              : [],
            summary: resume.summary || '',
            status: (resume.ui_status || 'new') as Resume['status'],
            uploadDate: resume.created_at || new Date().toISOString(),
            fileType: (resume.mime_type?.includes('pdf') ? 'pdf' : resume.mime_type?.includes('word') ? 'docx' : undefined) as 'pdf' | 'doc' | 'docx' | undefined as any,
            fileSize: typeof resume.file_size === 'number' ? resume.file_size : 0,
            matchScore: resume.ai_overall_score ?? undefined,
            tags: Array.isArray(resume.tags) ? resume.tags : [],
            lastActivity: resume.created_at || new Date().toISOString(),
            source: resume.source || 'upload',
            // Add AI scoring data for recommendations
            ai_overall_score: resume.ai_overall_score,
            ai_scoring: resume.ai_scoring,
            // Add the experience array for detailed view
            experience_array: Array.isArray(resume.experience) ? resume.experience : [],
            projects: Array.isArray(resume.projects) ? resume.projects : [],
          } as Resume & {
            ai_overall_score?: number;
            ai_scoring?: any;
            experience_array?: any[];
            projects?: any[];
          };

          const jobId = resume.job_id || 'unassociated';
          const jobGroup = jobGroupsMap.get(jobId);
          
          if (jobGroup) {
            jobGroup.resumes.push(mappedResume);
          } else {
            // If job doesn't exist, add to unassociated
            jobGroupsMap.get('unassociated')?.resumes.push(mappedResume);
          }
        }

        // Convert to array and filter out empty job groups
        const groupsArray = Array.from(jobGroupsMap.values())
          .filter(group => group.resumes.length > 0)
          .sort((a, b) => {
            // Sort by: unassociated last, then by creation date
            if (a.job.id === 'unassociated') return 1;
            if (b.job.id === 'unassociated') return -1;
            return new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime();
          });

        setJobGroups(groupsArray);
        
        // Auto-expand first job group if it has resumes
        if (groupsArray.length > 0) {
          setExpandedJobs(new Set([groupsArray[0].job.id]));
        }

      } catch (error) {
        console.error('Failed to fetch jobs and resumes:', error);
        hasFetchedData.current = false; // Reset on error so user can retry
      } finally {
        setLoading(false);
      }
    };

    fetchJobsAndResumes();
  }, [status, session]); // Only depend on auth status and session

  // Filter job groups based on search and status
  const filteredJobGroups = useMemo(() => {
    return jobGroups.map(group => ({
      ...group,
      resumes: group.resumes.filter(resume => {
        // Search filter
        const matchesSearch = !searchQuery || 
          resume.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resume.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resume.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        const matchesStatus = statusFilter === 'all' || resume.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    })).filter(group => group.resumes.length > 0);
  }, [jobGroups, searchQuery, statusFilter]);

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Resume action handlers (matching ResumeGrid exactly)
  const handleView = (resume: Resume) => {
    setSelectedResume(resume);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResume(null);
  };

  const handleDownload = async (resume: Resume) => {
    console.log('🔥 JobGroupedResumeView handleDownload called with resume:', resume.id, resume.filename);
    try {
      console.log('Downloading resume:', resume.id);

      // Check if user is authenticated
      if (status !== 'authenticated') {
        console.error('User not authenticated, status:', status);
        showToast({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to download resumes'
        });
        return;
      }

      console.log('User is authenticated, proceeding with download...');
      const result = await resumeServices.downloadResume(resume.id, resume.filename);

      if (result?.success) {
        console.log('Download completed for:', resume.filename);
        showToast({
          type: 'success',
          title: 'Download Complete',
          message: `Successfully downloaded ${resume.filename}`
        });
      } else {
        console.error('Download failed:', result);
        showToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Please check your connection and try again.'
      });
    }
  };

  const handleDelete = async (resume: Resume) => {
    const confirmed = await confirm({
      title: 'Delete Resume',
      message: `Are you sure you want to delete the resume for ${resume.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await resumeServices.deleteResume(resume.id);
      if (result?.result === 'success') {
        // Remove from local state
        setJobGroups(prevGroups =>
          prevGroups.map(group => ({
            ...group,
            resumes: group.resumes.filter(r => r.id !== resume.id)
          })).filter(group => group.resumes.length > 0 || group.job.id !== 'unassigned')
        );

        showToast({
          type: 'success',
          title: 'Resume Deleted',
          message: `Successfully deleted resume for ${resume.name}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: result?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Please try again.'
      });
    }
  };

  const handleStatusChange = async (resume: Resume, status: Resume['status']) => {
    try {
      const result = await resumeServices.updateResumeStatus(resume.id, status);
      if (result?.result === 'success') {
        // Update local state
        setJobGroups(prevGroups =>
          prevGroups.map(group => ({
            ...group,
            resumes: group.resumes.map(r =>
              r.id === resume.id ? { ...r, status } : r
            )
          }))
        );

        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `Resume status updated to ${status}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: result?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Status update failed:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update resume status. Please try again.'
      });
    }
  };

  // Show loading state while session is loading or data is being fetched
  if (status === 'loading' || loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {status === 'loading' ? 'Authenticating...' : 'Loading jobs and resumes...'}
          </h3>
          <p className="text-gray-500">
            {status === 'loading'
              ? 'Please wait while we verify your session.'
              : 'Please wait while we organize your resumes by job.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (status === 'unauthenticated') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500">
            Please sign in to view your resumes organized by job.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resumes by name, email, title, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 flex items-center gap-2 transition-colors duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 flex items-center gap-2 transition-colors duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Groups */}
      {filteredJobGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredJobGroups.map((group) => (
            <div key={group.job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Job Header */}
              <div 
                className="p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleJobExpansion(group.job.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedJobs.has(group.job.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <Briefcase className="w-6 h-6 text-yellow-500" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {group.job.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {group.job.department && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {group.job.department}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {group.job.location}
                        </div>
                        {group.job.id !== 'unassociated' && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDistanceToNow(new Date(group.job.created_at), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        {group.resumes.length}
                      </span>
                      <span className="text-sm text-gray-600">
                        {group.resumes.length === 1 ? 'resume' : 'resumes'}
                      </span>
                    </div>
                    
                    {group.job.id !== 'unassociated' && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(group.job.status)}`}>
                        {group.job.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumes List */}
              {expandedJobs.has(group.job.id) && (
                <div className="p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {group.resumes.map((resume) => (
                        <ResumeCard
                          key={resume.id}
                          resume={resume}
                          onView={handleView}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <ResumeListView
                      resumes={group.resumes}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onBulkDownload={async (resumeIds) => {
                        try {
                          const result = await bulkDownloadResumes(resumeIds);
                          if (result.success) {
                            showToast({
                              type: 'success',
                              title: 'Bulk Download Complete',
                              message: 'Resumes downloaded successfully'
                            });
                          } else {
                            showToast({
                              type: 'error',
                              title: 'Bulk Download Failed',
                              message: result.error || 'Failed to download resumes'
                            });
                          }
                        } catch (error) {
                          console.error('Bulk download error:', error);
                          showToast({
                            type: 'error',
                            title: 'Bulk Download Failed',
                            message: 'Failed to download resumes'
                          });
                        }
                      }}
                      onBulkDelete={async (resumeIds) => {
                        console.log('🔍 JobGroupedResumeView onBulkDelete called with:', resumeIds);

                        if (resumeIds.length === 0) return;

                        try {
                          console.log('🚀 Calling bulkDeleteResumes API...');
                          const response = await bulkDeleteResumes(resumeIds);
                          console.log('📡 Bulk delete API response:', response);

                          if (response?.result === 'success') {
                            console.log(`Successfully deleted ${response.deleted_count} resumes`);

                            // Remove deleted resumes from local state
                            setJobGroups(prevGroups =>
                              prevGroups.map(jobGroup => ({
                                ...jobGroup,
                                resumes: jobGroup.resumes.filter(r => !resumeIds.includes(r.id))
                              })).filter(jobGroup => jobGroup.resumes.length > 0)
                            );

                            showToast({
                              type: 'success',
                              title: 'Bulk Delete Complete',
                              message: `Successfully deleted ${response.deleted_count} resume${response.deleted_count > 1 ? 's' : ''}`
                            });
                          } else {
                            showToast({
                              type: 'error',
                              title: 'Bulk Delete Failed',
                              message: response?.error || 'Failed to delete resumes'
                            });
                          }
                        } catch (error) {
                          console.error('Bulk delete error:', error);
                          showToast({
                            type: 'error',
                            title: 'Bulk Delete Failed',
                            message: 'Failed to delete resumes'
                          });
                        }
                      }}
                      onBulkStatusChange={async (resumeIds, status) => {
                        console.log('🔍 JobGroupedResumeView onBulkStatusChange called with:', resumeIds, status);

                        if (resumeIds.length === 0) return;

                        try {
                          const response = await bulkUpdateStatus(resumeIds, status);

                          if (response?.result === 'success') {
                            console.log(`Successfully updated ${response.updated_count} resumes`);

                            // Update status in local state
                            setJobGroups(prevGroups =>
                              prevGroups.map(jobGroup => ({
                                ...jobGroup,
                                resumes: jobGroup.resumes.map(r =>
                                  resumeIds.includes(r.id) ? { ...r, ui_status: status } : r
                                )
                              }))
                            );

                            showToast({
                              type: 'success',
                              title: 'Bulk Status Update Complete',
                              message: `Successfully updated ${response.updated_count} resume${response.updated_count > 1 ? 's' : ''}`
                            });
                          } else {
                            showToast({
                              type: 'error',
                              title: 'Bulk Status Update Failed',
                              message: response?.error || 'Failed to update resume status'
                            });
                          }
                        } catch (error) {
                          console.error('Bulk status update error:', error);
                          showToast({
                            type: 'error',
                            title: 'Bulk Status Update Failed',
                            message: 'Failed to update resume status'
                          });
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No resumes found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to see more resumes.'
                : 'Upload some resumes to get started with job-based organization.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Resume Detail Modal */}
      <ResumeDetailModal
        resume={selectedResume}
        isOpen={showModal}
        onClose={handleCloseModal}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
