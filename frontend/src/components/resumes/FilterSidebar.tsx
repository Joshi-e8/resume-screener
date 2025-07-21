"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Resume } from "@/data/mockResumes";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status?: Resume['status'][];
    experience?: [number, number];
    skills?: string[];
    location?: string[];
    dateRange?: [Date | null, Date | null];
  };
  onFiltersChange: (filters: FilterSidebarProps['filters']) => void;
  onClearAll: () => void;
}

const statusOptions: { value: Resume['status']; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-800' },
  { value: 'interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
];

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C#', '.NET',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Tailwind',
  'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Express', 'Django', 'Flask',
  'Spring', 'Laravel', 'Rails', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GraphQL', 'REST'
];

const locationOptions = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
  'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Portland, OR', 'Miami, FL'
];

export function FilterSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onClearAll 
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    experience: true,
    skills: true,
    location: true,
    date: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStatusChange = (status: Resume['status']) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    
    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined
    });
  };

  const handleExperienceChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      experience: [min, max]
    });
  };

  const handleSkillChange = (skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    onFiltersChange({
      ...filters,
      skills: newSkills.length > 0 ? newSkills : undefined
    });
  };

  const handleLocationChange = (location: string) => {
    const currentLocations = filters.location || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];
    
    onFiltersChange({
      ...filters,
      location: newLocations.length > 0 ? newLocations : undefined
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.experience) count++;
    if (filters.skills?.length) count++;
    if (filters.location?.length) count++;
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:w-full lg:shadow-none border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
          {/* Status Filter */}
          <div>
            <button
              onClick={() => toggleSection('status')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">Status</h4>
              {expandedSections.status ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.status && (
              <div className="mt-3 space-y-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={() => handleStatusChange(option.value)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Experience Filter */}
          <div>
            <button
              onClick={() => toggleSection('experience')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">Experience</h4>
              {expandedSections.experience ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.experience && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Min"
                    value={filters.experience?.[0] || ''}
                    onChange={(e) => handleExperienceChange(
                      parseInt(e.target.value) || 0,
                      filters.experience?.[1] || 20
                    )}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Max"
                    value={filters.experience?.[1] || ''}
                    onChange={(e) => handleExperienceChange(
                      filters.experience?.[0] || 0,
                      parseInt(e.target.value) || 20
                    )}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">years</span>
                </div>
              </div>
            )}
          </div>

          {/* Skills Filter */}
          <div>
            <button
              onClick={() => toggleSection('skills')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">Skills</h4>
              {expandedSections.skills ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.skills && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {skillOptions.map((skill) => (
                  <label key={skill} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.skills?.includes(skill) || false}
                      onChange={() => handleSkillChange(skill)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Location Filter */}
          <div>
            <button
              onClick={() => toggleSection('location')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">Location</h4>
              {expandedSections.location ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.location && (
              <div className="mt-3 space-y-2">
                {locationOptions.map((location) => (
                  <label key={location} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.location?.includes(location) || false}
                      onChange={() => handleLocationChange(location)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-700">{location}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
