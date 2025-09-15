"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, Users, Download, Mail, Phone, MapPin, Calendar, Star } from "lucide-react";
import Link from "next/link";
import useResumeServices from "@/lib/services/resumeServices";
import useJobServices from "@/lib/services/jobServices";
import { ResumeDetailModal } from "@/components/resumes/ResumeDetailModal";
import { formatDistanceToNow } from "date-fns";

export default function JobApplicantsPage() {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'match'>('date');

  const jobId = params.id as string;
  const { getResumesByJob, getResumeById, updateResumeStatus, downloadResume } = useResumeServices();
  const { getJobById } = useJobServices();
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalResume, setModalResume] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [jobResp, resResp] = await Promise.all([
          getJobById(jobId),
          getResumesByJob(jobId),
        ]);
        if (cancelled) return;
        if (jobResp?.result === "success") {
          setJob(jobResp.records);
        }
        if (resResp?.result === "success") {
          const mapped = (resResp.records || []).map((r: any) => {
            const ai = r.ai_scoring || {};
            const derived = (ai && typeof ai === 'object' ? ai.derived : {}) || {};
            const expYears = derived?.total_experience_years || 0;
            return {
              id: r.id,
              name: r.candidate_name || "Unknown",
              email: r.candidate_email || "",
              phone: r.phone || "",
              location: r.location || "",
              title: r.title || "",
              experience: expYears || 0,
              appliedDate: r.created_at,
              skills: Array.isArray(r.key_skills) ? r.key_skills : [],
              matchScore: Math.round(r.ai_overall_score || 0),
              applicationStatus: (r.ui_status || 'new'),
              filename: r.filename,
              fileSize: r.file_size || 0,
              mimeType: r.mime_type || '',
              summary: r.summary || '',
              education: Array.isArray(r.education) ? r.education : [],
              ai_scoring: r.ai_scoring || null,
            };
          });
          setApplicants(mapped);
        }
      } catch (e) {
        // keep UI resilient
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

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

  // Filter and sort applicants
  const filteredApplicants = applicants
    .filter(applicant => {
      const matchesSearch = applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || applicant.applicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'match':
          return b.matchScore - a.matchScore;
        case 'date':
        default:
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // Helpers: modal mapping and handlers
  const deriveFileType = (filename?: string, mime?: string) => {
    if (mime) {
      if (mime.includes('word') || mime.includes('docx')) return 'docx';
      if (mime.includes('msword')) return 'doc';
    }
    const f = (filename || '').toLowerCase();
    if (f.endsWith('.docx')) return 'docx';
    if (f.endsWith('.doc')) return 'doc';
    return 'pdf';
  };

  const buildModalResume = (a: any) => {
    const fileType = deriveFileType(a?.filename, a?.mimeType);
    return {
      id: a.id,
      name: a.name,
      title: a.title,
      status: a.applicationStatus || 'new',
      matchScore: a.matchScore,
      email: a.email,
      phone: a.phone,
      location: a.location,
      experience: a.experience,
      summary: a.summary || '',
      skills: Array.isArray(a.skills) ? a.skills : [],
      tags: Array.isArray(a.skills) ? a.skills.slice(0, 3) : [],
      education: Array.isArray(a.education) ? a.education : [],
      fileType,
      fileSize: a.fileSize || 0,
      uploadDate: a.appliedDate,
      ai_scoring: a.ai_scoring || null,
      // experience_array optional; component supports fallback
    } as any;
  };

  const handleOpenResume = (applicant: any) => {
    setModalResume(buildModalResume(applicant));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleStatusChange = async (resumeObj: any, newStatus: string) => {
    try {
      const resp = await updateResumeStatus(resumeObj.id, newStatus);
      // Optimistically update UI
      setModalResume((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
      setApplicants((prev) => prev.map((a) => a.id === resumeObj.id ? { ...a, applicationStatus: newStatus } : a));
    } catch (e) {
      // no-op; could add toast later
    }
  };

  const handleDownload = async (resumeObj: any) => {
    try {
      await downloadResume(resumeObj.id, resumeObj?.filename || undefined);
    } catch (e) {
      // no-op
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/jobs/${jobId}`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Applicants for {job?.title || 'Job'}
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredApplicants.length} of {applicants.length} applicants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Download className="w-4 h-4 mr-2 inline" />
            Export
          </button>

          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200">
            <Mail className="w-4 h-4 mr-2 inline" />
            Bulk Email
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Applicants</p>
              <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicants.filter(a => a.applicationStatus === 'new').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicants.filter(a => a.applicationStatus === 'shortlisted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Match Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicants.length ? Math.round(applicants.reduce((sum, a) => sum + a.matchScore, 0) / applicants.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search applicants by name, email, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'match')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="match">Sort by Match Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applicants List */}
      {filteredApplicants.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredApplicants.map((applicant) => (
              <div key={applicant.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/dashboard/resumes/${applicant.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-yellow-600 transition-colors duration-200"
                      >
                        {applicant.name}
                      </Link>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(applicant.applicationStatus)}`}>
                        {applicant.applicationStatus}
                      </span>
                      <span className={`text-sm font-medium ${getMatchScoreColor(applicant.matchScore)}`}>
                        {applicant.matchScore}% match
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{applicant.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{applicant.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{applicant.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{applicant.title}</span>
                      <span>•</span>
                      <span>{applicant.experience} years experience</span>
                      <span>•</span>
                      <span>Applied {formatDistanceToNow(new Date(applicant.appliedDate), { addSuffix: true })}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {applicant.skills.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                          +{applicant.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenResume(applicant)}
                      className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                    >
                      View Resume
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No one has applied to this job yet.'
              }
            </p>
          </div>
        </div>
      )}

      <ResumeDetailModal
        resume={modalResume}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDownload={handleDownload}
        onStatusChange={handleStatusChange}
      />

    </div>
  );
}
