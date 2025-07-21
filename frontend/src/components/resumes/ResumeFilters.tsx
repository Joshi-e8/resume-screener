"use client";

import { useState } from "react";
import { Calendar, MapPin, Briefcase, GraduationCap, X } from "lucide-react";

export function ResumeFilters() {
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20]);
  const [dateRange, setDateRange] = useState<string>('all');
  const [location, setLocation] = useState<string>('');

  const statusOptions = [
    { value: 'processing', label: 'Processing', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'error', label: 'Error', color: 'red' },
    { value: 'pending', label: 'Pending Review', color: 'blue' }
  ];

  const skillOptions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 
    'TypeScript', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Vue.js', 'Angular'
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearAllFilters = () => {
    setSelectedStatus([]);
    setSelectedSkills([]);
    setExperienceRange([0, 20]);
    setDateRange('all');
    setLocation('');
  };

  const getStatusColor = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const hasActiveFilters = selectedStatus.length > 0 || selectedSkills.length > 0 || 
    experienceRange[0] > 0 || experienceRange[1] < 20 || dateRange !== 'all' || location;

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filter Resumes</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(option.value)}
                  onChange={() => toggleStatus(option.value)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(option.color)}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Upload Date
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="w-4 h-4 inline mr-2" />
            Location
          </label>
          <input
            type="text"
            placeholder="Enter city or state..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Experience Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Briefcase className="w-4 h-4 inline mr-2" />
          Years of Experience: {experienceRange[0]} - {experienceRange[1] === 20 ? '20+' : experienceRange[1]} years
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            value={experienceRange[0]}
            onChange={(e) => setExperienceRange([parseInt(e.target.value), experienceRange[1]])}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="20"
            value={experienceRange[1]}
            onChange={(e) => setExperienceRange([experienceRange[0], parseInt(e.target.value)])}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Skills Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <GraduationCap className="w-4 h-4 inline mr-2" />
          Skills
        </label>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1 text-sm font-medium rounded-full border transition-all duration-200 ${
                selectedSkills.includes(skill)
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {skill}
              {selectedSkills.includes(skill) && (
                <X className="w-3 h-3 inline ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            <span className="font-medium">
              {selectedStatus.length + selectedSkills.length + 
               (experienceRange[0] > 0 || experienceRange[1] < 20 ? 1 : 0) + 
               (dateRange !== 'all' ? 1 : 0) + 
               (location ? 1 : 0)} applied
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
