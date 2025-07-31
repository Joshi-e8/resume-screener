"use client";

import { useState } from "react";
import { Plus, Briefcase, ExternalLink, Tag } from "lucide-react";

interface Job {
  id: string;
  title: string;
  source: string;
  applicants: number;
  status: 'active' | 'draft' | 'closed';
}

interface SmartJobAssociationProps {
  onJobSelect: (jobId: string | null) => void;
  onCreateJob: (jobData: { title: string; source: string }) => void;
}

export function SmartJobAssociation({ onJobSelect, onCreateJob }: SmartJobAssociationProps) {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobSource, setNewJobSource] = useState("linkedin");

  // Mock data - in real app, this would come from API
  const recentJobs: Job[] = [
    { id: "1", title: "Senior Software Engineer", source: "LinkedIn", applicants: 12, status: 'active' },
    { id: "2", title: "Product Manager", source: "Indeed", applicants: 8, status: 'active' },
    { id: "3", title: "Data Scientist", source: "Glassdoor", applicants: 15, status: 'active' },
    { id: "4", title: "UX Designer", source: "LinkedIn", applicants: 6, status: 'active' },
  ];

  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId);
    onJobSelect(jobId || null);
  };

  const handleCreateJob = () => {
    if (newJobTitle.trim()) {
      onCreateJob({
        title: newJobTitle,
        source: newJobSource
      });
      setNewJobTitle("");
      setShowCreateForm(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'linkedin':
        return '💼';
      case 'indeed':
        return '🔍';
      case 'glassdoor':
        return '🏢';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-blue-600" />
        Associate with Job Position (Optional)
      </h3>

      {/* Job Selection */}
      <div className="space-y-4">
        {/* No Association Option */}
        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
          <input
            type="radio"
            name="job-association"
            value=""
            checked={selectedJob === ""}
            onChange={() => handleJobSelect("")}
            className="text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-gray-900">No specific job</div>
            <div className="text-sm text-gray-600">Add to general resume pool for future matching</div>
          </div>
        </label>

        {/* Recent Jobs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Job Postings</h4>
          {recentJobs.map((job) => (
            <label
              key={job.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            >
              <input
                type="radio"
                name="job-association"
                value={job.id}
                checked={selectedJob === job.id}
                onChange={() => handleJobSelect(job.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSourceIcon(job.source)}</span>
                  <div className="font-medium text-gray-900">{job.title}</div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {job.source}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {job.applicants} applicants • {job.status}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </label>
          ))}
        </div>

        {/* Create New Job */}
        <div className="border-t border-gray-200 pt-4">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Create new job position
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posted On
                </label>
                <select
                  value={newJobSource}
                  onChange={(e) => setNewJobSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="company-website">Company Website</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Job
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Job Summary */}
      {selectedJob && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium">
              Resumes will be associated with: {recentJobs.find(j => j.id === selectedJob)?.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
