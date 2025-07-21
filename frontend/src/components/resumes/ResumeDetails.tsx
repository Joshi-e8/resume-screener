"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Save,
  X,
  Calendar,
  Building
} from "lucide-react";

interface WorkHistory {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Resume {
  id: string;
  fileName: string;
  candidateName: string;
  email: string;
  phone?: string;
  location?: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error' | 'pending';
  summary?: string;
  experience?: number;
  education?: string;
  skills: string[];
  workHistory?: WorkHistory[];
  fileSize: number;
  fileType: string;
}

interface ResumeDetailsProps {
  resume: Resume;
  isEditing: boolean;
}

export function ResumeDetails({ resume, isEditing }: ResumeDetailsProps) {
  const [editedResume, setEditedResume] = useState(resume);

  const handleSave = () => {
    // Mock save functionality
    console.log('Saving resume:', editedResume);
  };

  const handleCancel = () => {
    setEditedResume(resume);
  };

  const updateField = (field: string, value: string | string[]) => {
    setEditedResume(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (skill && !editedResume.skills.includes(skill)) {
      setEditedResume(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditedResume(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
          </div>
          
          {isEditing ? (
            <textarea
              value={editedResume.summary || ''}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Enter professional summary..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">
              {resume.summary || 'No summary available'}
            </p>
          )}
        </div>

        {/* Work Experience */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
          </div>

          {resume.workHistory && resume.workHistory.length > 0 ? (
            <div className="space-y-6">
              {resume.workHistory.map((work, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-gray-200 last:border-l-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-yellow-500 rounded-full"></div>
                  
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900">{work.position}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Building className="w-4 h-4" />
                      <span>{work.company}</span>
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{work.duration}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {work.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No work experience information available</p>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Education</h2>
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={editedResume.education || ''}
              onChange={(e) => updateField('education', e.target.value)}
              placeholder="Enter education details..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-700">
              {resume.education || 'No education information available'}
            </p>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {editedResume.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a skill and press Enter..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">File Information</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">File Name:</span>
              <span className="font-medium text-gray-900">{resume.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Type:</span>
              <span className="font-medium text-gray-900">{resume.fileType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Size:</span>
              <span className="font-medium text-gray-900">{resume.fileSize} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upload Date:</span>
              <span className="font-medium text-gray-900">
                {resume.uploadDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File Upload</span>
              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Text Extraction</span>
              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Skills Analysis</span>
              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Experience Parsing</span>
              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
