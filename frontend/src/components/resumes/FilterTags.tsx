"use client";

import { X } from "lucide-react";
import { Resume } from "@/data/mockResumes";

interface FilterTagsProps {
  filters: {
    status?: Resume['status'][];
    experience?: [number, number];
    skills?: string[];
    location?: string[];
    dateRange?: [Date | null, Date | null];
  };
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

export function FilterTags({ filters, onRemoveFilter, onClearAll }: FilterTagsProps) {
  const hasActiveFilters = Boolean(
    filters.status?.length ||
    filters.experience ||
    filters.skills?.length ||
    filters.location?.length ||
    (filters.dateRange?.[0] || filters.dateRange?.[1])
  );

  if (!hasActiveFilters) return null;

  const getStatusLabel = (status: Resume['status']) => {
    const labels: Record<Resume['status'], string> = {
      new: 'New',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
      interviewed: 'Interviewed',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return labels[status];
  };

  const getStatusColor = (status: Resume['status']) => {
    const colors: Record<Resume['status'], string> = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      reviewed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      shortlisted: 'bg-green-100 text-green-800 border-green-200',
      interviewed: 'bg-purple-100 text-purple-800 border-purple-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      hired: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[status];
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Active filters:</span>
      
      {/* Status Tags */}
      {filters.status?.map((status) => (
        <div
          key={status}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
        >
          <span>Status: {getStatusLabel(status)}</span>
          <button
            onClick={() => onRemoveFilter('status', status)}
            className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Experience Tag */}
      {filters.experience && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full text-xs font-medium">
          <span>
            Experience: {filters.experience[0]}-{filters.experience[1]} years
          </span>
          <button
            onClick={() => onRemoveFilter('experience')}
            className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Skills Tags */}
      {filters.skills?.map((skill) => (
        <div
          key={skill}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-medium"
        >
          <span>Skill: {skill}</span>
          <button
            onClick={() => onRemoveFilter('skills', skill)}
            className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Location Tags */}
      {filters.location?.map((location) => (
        <div
          key={location}
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-medium"
        >
          <span>Location: {location}</span>
          <button
            onClick={() => onRemoveFilter('location', location)}
            className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Date Range Tag */}
      {(filters.dateRange?.[0] || filters.dateRange?.[1]) && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-medium">
          <span>
            Date: {filters.dateRange[0]?.toLocaleDateString() || 'Any'} - {filters.dateRange[1]?.toLocaleDateString() || 'Any'}
          </span>
          <button
            onClick={() => onRemoveFilter('dateRange')}
            className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
      >
        <X className="w-3 h-3" />
        Clear All
      </button>
    </div>
  );
}
