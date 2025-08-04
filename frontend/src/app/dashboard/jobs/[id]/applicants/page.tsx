"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, Users, Download, Mail, Phone, MapPin, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { mockJobs } from "@/data/mockJobs";
import { mockResumes } from "@/data/mockResumes";
import { formatDistanceToNow } from "date-fns";

export default function JobApplicantsPage() {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'match'>('date');
  
  const jobId = params.id as string;
  const job = mockJobs.find(j => j.id === jobId);

  // For demo purposes, we'll use some of the mock resumes as applicants
  const applicants = mockResumes.slice(0, job?.applicants || 0).map((resume) => ({
    ...resume,
    appliedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: Math.floor(Math.random() * 40) + 60, // 60-100% match
    applicationStatus: ['pending', 'reviewed', 'shortlisted', 'rejected'][Math.floor(Math.random() * 4)] as 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  }));

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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            Applicants for {job.title}
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
                {applicants.filter(a => a.applicationStatus === 'pending').length}
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
                {Math.round(applicants.reduce((sum, a) => sum + a.matchScore, 0) / applicants.length)}%
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
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
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
                    <Link
                      href={`/dashboard/resumes/${applicant.id}`}
                      className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                    >
                      View Resume
                    </Link>
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
    </div>
  );
}
