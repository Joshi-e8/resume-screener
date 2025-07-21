"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar,

  Filter,
  RotateCcw,
  Sparkles
} from "lucide-react";

interface AdvancedSearchFilters {
  keywords: string;
  location: string;
  experience: {
    min: number;
    max: number;
  };
  skills: string[];
  education: string;
  jobTitle: string;
  salary: {
    min: number;
    max: number;
  };
  dateRange: string;
  status: string[];
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  initialFilters?: Partial<AdvancedSearchFilters>;
}

const defaultFilters: AdvancedSearchFilters = {
  keywords: '',
  location: '',
  experience: { min: 0, max: 20 },
  skills: [],
  education: '',
  jobTitle: '',
  salary: { min: 0, max: 200000 },
  dateRange: 'all',
  status: []
};

const popularSkills = [
  'JavaScript', 'React', 'Python', 'Node.js', 'TypeScript', 'AWS',
  'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'Git', 'Agile',
  'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Project Management'
];

const educationLevels = [
  'High School', 'Associate Degree', 'Bachelor\'s Degree', 
  'Master\'s Degree', 'PhD', 'Professional Certification'
];

export function AdvancedSearchModal({ 
  isOpen, 
  onClose, 
  onSearch, 
  initialFilters = {} 
}: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    ...defaultFilters,
    ...initialFilters
  });

  const [skillInput, setSkillInput] = useState('');

  if (!isOpen) return null;

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: string | number | { min: number; max: number } | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSkillInput('');
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-all duration-300"
        style={{ backgroundColor: '#04050587' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Advanced Search</h2>
                <p className="text-sm text-gray-600">Find the perfect candidates with detailed filters</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Keywords */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.keywords}
                      onChange={(e) => handleFilterChange('keywords', e.target.value)}
                      placeholder="Enter keywords, job titles, or company names..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      placeholder="City, state, or remote"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.jobTitle}
                      onChange={(e) => handleFilterChange('jobTitle', e.target.value)}
                      placeholder="e.g., Software Engineer, Product Manager"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Experience Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Years of Experience
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={filters.experience.min}
                        onChange={(e) => handleFilterChange('experience', {
                          ...filters.experience,
                          min: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={filters.experience.max}
                        onChange={(e) => handleFilterChange('experience', {
                          ...filters.experience,
                          max: parseInt(e.target.value) || 20
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Skills */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Skills
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(skillInput);
                          }
                        }}
                        placeholder="Add skills (press Enter to add)"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Selected Skills */}
                    {filters.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {filters.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                          >
                            {skill}
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="hover:text-yellow-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Popular Skills */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Popular skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularSkills.slice(0, 8).map((skill) => (
                          <button
                            key={skill}
                            onClick={() => handleAddSkill(skill)}
                            disabled={filters.skills.includes(skill)}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Education Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={filters.education}
                      onChange={(e) => handleFilterChange('education', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Any education level</option>
                      {educationLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Resume Status
                  </label>
                  <div className="space-y-2">
                    {['pending', 'reviewed', 'shortlisted', 'rejected'].map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('status', [...filters.status, status]);
                            } else {
                              handleFilterChange('status', filters.status.filter(s => s !== status));
                            }
                          }}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Resume Upload Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">Any time</option>
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Resumes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
