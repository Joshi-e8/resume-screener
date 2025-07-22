"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Plus, X } from "lucide-react";
import Link from "next/link";
import { Job, mockJobs, jobDepartments, jobTypes, experienceLevels } from "@/data/mockJobs";

interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: Job['type'];
  experience: Job['experience'];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  closingDate: string;
  status: Job['status'];
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<JobFormData | null>(null);
  const [currentSkill, setCurrentSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobId = params.id as string;
  const job = mockJobs.find(j => j.id === jobId);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experience: job.experience,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        skills: job.skills,
        closingDate: job.closingDate,
        status: job.status
      });
    }
  }, [job]);

  if (!job || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you&apos;re trying to edit doesn&apos;t exist.</p>
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

  const handleInputChange = (field: keyof JobFormData, value: string | number) => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleSalaryChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }) : null);
  };

  const handleArrayFieldChange = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }) : null);
  };

  const addArrayField = (field: 'requirements' | 'responsibilities' | 'benefits') => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: [...prev[field], '']
    }) : null);
  };

  const removeArrayField = (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    setFormData(prev => prev ? ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }) : null);
  };

  const addSkill = () => {
    if (currentSkill.trim() && formData && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => prev ? ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }) : null);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }) : null);
  };

  const handleSubmit = async (newStatus?: Job['status']) => {
    if (!formData) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedData = newStatus ? { ...formData, status: newStatus } : formData;
    console.log('Updating job:', updatedData);
    
    // Redirect to job detail page
    router.push(`/dashboard/jobs/${jobId}`);
  };

  const isFormValid = formData.title && formData.department && formData.location && formData.description;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            Edit Job: {formData.title}
          </h1>
          <p className="text-gray-600 mt-1">
            Update job details and requirements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit()}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            Save Changes
          </button>
          
          {formData.status === 'draft' && (
            <button
              onClick={() => handleSubmit('active')}
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4 mr-2 inline" />
              Publish Job
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {jobDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as Job['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value as Job['experience'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Date
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleInputChange('closingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  value={formData.salary.min || ''}
                  onChange={(e) => handleSalaryChange('min', parseInt(e.target.value) || 0)}
                  placeholder="50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  value={formData.salary.max || ''}
                  onChange={(e) => handleSalaryChange('max', parseInt(e.target.value) || 0)}
                  placeholder="80000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.salary.currency}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, salary: { ...prev.salary, currency: e.target.value } }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the role, company culture, and what makes this position exciting..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <div className="space-y-3">
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                    placeholder="e.g., 3+ years of experience in React"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      onClick={() => removeArrayField('requirements', index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addArrayField('requirements')}
                className="flex items-center gap-2 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="e.g., React, TypeScript, Node.js"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                >
                  Add
                </button>
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-yellow-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
