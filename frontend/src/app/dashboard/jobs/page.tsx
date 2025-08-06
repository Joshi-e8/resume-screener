"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Plus, Search, Grid, List, Loader2 } from "lucide-react";
import Link from "next/link";
import { jobStatuses } from "@/data/mockJobs";
import { JobCard } from "@/components/jobs/JobCard";
import { JobListView } from "@/components/jobs/JobListView";
import Pagination from "@/components/ui/Pagination";
import useJobServices from "@/lib/services/jobServices";
import { useSession } from "next-auth/react";

// Flexible job type that can handle API responses with optional fields
interface FlexibleJob {
  id: string;
  title?: string;
  department?: string;
  location?: string;
  type?: string;
  experience?: string;
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

type ViewMode = "grid" | "list";
type SortOption = "title" | "date" | "applicants" | "department";
type SortOrder = "asc" | "desc";

export default function JobsPage() {
  const { status } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput] = useDebounce(searchInput, 400);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [jobs, setJobs] = useState<FlexibleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Initialize job services
  const {
    getAllJobs,
    updateJobStatus,
    deleteJob,
  } = useJobServices();

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchInput, selectedStatus, selectedDepartment]);

  // Load jobs on component mount and when filters/pagination change
  useEffect(() => {
    if (status == "authenticated") {
      loadJobs();
    }
  }, [status, debouncedSearchInput, selectedStatus, selectedDepartment, currentPage, pageSize]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters for API call
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      
      if (debouncedSearchInput.trim()) {
        params.append('query', debouncedSearchInput.trim());
      }
      
      if (selectedStatus !== "all") {
        params.append('status', selectedStatus);
      }
      
      if (selectedDepartment !== "all") {
        params.append('department', selectedDepartment);
      }

      const response = await getAllJobs(params);

      if (response?.result == "success") {
        setJobs(response.records || []);
        setTotalJobs(response.total || 0);
        setTotalPages(Math.ceil((response.total || 0) / pageSize));
      } else {
        setError(response?.message || "Failed to load jobs");
      }
    } catch (err) {
      setError("An error occurred while loading jobs");
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments from loaded jobs
  const departments = useMemo(() => {
    const depts = Array.from(
      new Set(jobs.map((job) => job.department).filter(Boolean))
    );
    return depts.sort();
  }, [jobs]);

  // Sort jobs (filtering is now handled server-side)
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Sort jobs (server handles search and filtering)
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "title":
          aValue = a.title || "";
          bValue = b.title || "";
          break;
        case "date":
          aValue = new Date(a.created_at || a.postedDate || 0).getTime();
          bValue = new Date(b.created_at || b.postedDate || 0).getTime();
          break;
        case "applicants":
          aValue = a.applicants || 0;
          bValue = b.applicants || 0;
          break;
        case "department":
          aValue = a.department || "";
          bValue = b.department || "";
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [jobs, sortBy, sortOrder]);

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      switch (action) {
        case "delete":
          const deleteResponse = await deleteJob(jobId);
          // if (deleteResponse?.success) {
          //   setJobs((prev) => prev.filter((job) => job.id !== jobId));
          // } else {
          //   setError(deleteResponse?.message || "Failed to delete job");
          // }
          break;

        case "activate":
          const activateResponse = await updateJobStatus(jobId, "active");
          if (activateResponse?.success) {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === jobId ? { ...job, status: "active" } : job
              )
            );
          } else {
            setError(activateResponse?.message || "Failed to activate job");
          }
          break;

        case "deactivate":
          const deactivateResponse = await updateJobStatus(jobId, "inactive");
          if (deactivateResponse?.success) {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === jobId ? { ...job, status: "inactive" } : job
              )
            );
          } else {
            setError(deactivateResponse?.message || "Failed to deactivate job");
          }
          break;

        default:
          console.log(`Action ${action} on job ${jobId}`);
      }
    } catch (err) {
      setError("An error occurred while performing the action");
      console.error("Error performing job action:", err);
    }
  };

  
  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {jobStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("-") as [
                  SortOption,
                  SortOrder
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {totalJobs} Total Job{totalJobs !== 1 ? "s" : ""}
            </h2>
          </div>

          {debouncedSearchInput && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <Search className="w-4 h-4" />
              <span>&quot;{debouncedSearchInput}&quot;</span>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === "list"
                ? "bg-yellow-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-yellow-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jobs Grid/List */}
      {loading && jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading jobs...
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch your job postings.
            </p>
          </div>
        </div>
      ) : filteredJobs.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onAction={handleJobAction} />
            ))}
          </div>
        ) : (
          <JobListView jobs={filteredJobs} onAction={handleJobAction} />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500 mb-6">
              {debouncedSearchInput ||
              selectedStatus !== "all" ||
              selectedDepartment !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Get started by creating your first job posting."}
            </p>
            {!debouncedSearchInput &&
              selectedStatus === "all" &&
              selectedDepartment === "all" && (
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalJobs}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        loading={loading}
      />
    </div>
  );
}
