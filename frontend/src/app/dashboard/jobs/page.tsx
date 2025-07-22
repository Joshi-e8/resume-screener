"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Grid, List } from "lucide-react";
import Link from "next/link";
import { mockJobs, jobStatuses } from "@/data/mockJobs";
import { JobCard } from "@/components/jobs/JobCard";
import { JobListView } from "@/components/jobs/JobListView";

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'date' | 'applicants' | 'department';
type SortOrder = 'asc' | 'desc';

export default function JobsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Get unique departments
  const departments = useMemo(() => {
    const depts = Array.from(new Set(mockJobs.map(job => job.department)));
    return depts.sort();
  }, []);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    const filtered = mockJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
      const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'date':
          aValue = new Date(a.postedDate).getTime();
          bValue = new Date(b.postedDate).getTime();
          break;
        case 'applicants':
          aValue = a.applicants;
          bValue = b.applicants;
          break;
        case 'department':
          aValue = a.department;
          bValue = b.department;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [searchQuery, selectedStatus, selectedDepartment, sortBy, sortOrder]);

  const handleJobAction = (jobId: string, action: string) => {
    console.log(`Action ${action} on job ${jobId}`);
    // TODO: Implement job actions
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Job Postings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your job postings and track applications
          </p>
        </div>
        
        <Link
          href="/dashboard/jobs/create"
          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {jobStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="applicants-desc">Most Applicants</option>
              <option value="applicants-asc">Least Applicants</option>
              <option value="department-asc">Department A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''}
          </h2>
          
          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <Search className="w-4 h-4" />
              <span>&quot;{searchQuery}&quot;</span>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jobs Grid/List */}
      {filteredJobs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAction={handleJobAction}
              />
            ))}
          </div>
        ) : (
          <JobListView
            jobs={filteredJobs}
            onAction={handleJobAction}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedDepartment !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first job posting.'
              }
            </p>
            {!searchQuery && selectedStatus === 'all' && selectedDepartment === 'all' && (
              <Link
                href="/dashboard/jobs/create"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
