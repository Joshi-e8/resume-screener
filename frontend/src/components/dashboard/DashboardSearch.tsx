"use client";

import { useState } from "react";
import { Search, Filter, X, Calendar, User, Briefcase } from "lucide-react";

interface SearchFilters {
  dateRange: string;
  status: string;
  type: string;
}

export function DashboardSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: "all",
    status: "all",
    type: "all",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log("Searching for:", searchQuery, "with filters:", filters);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: "all",
      status: "all",
      type: "all",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resumes, candidates, jobs, or skills..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm bg-gray-50 hover:bg-white transition-colors duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Filter Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
              hasActiveFilters
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="quarter">This quarter</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
              >
                <option value="all">All types</option>
                <option value="resume">Resumes</option>
                <option value="job">Jobs</option>
                <option value="candidate">Candidates</option>
                <option value="match">Matches</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick filters:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "High matches (90%+)", value: "high-match" },
                { label: "Recent uploads", value: "recent" },
                { label: "Pending review", value: "pending" },
                { label: "Frontend developers", value: "frontend" },
                { label: "Senior level", value: "senior" },
              ].map((tag) => (
                <button
                  key={tag.value}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
