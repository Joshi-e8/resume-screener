"use client";

import { useState } from "react";
import { ResumeCard } from "./ResumeCard";
import { ChevronLeft, ChevronRight, FileX } from "lucide-react";

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
  fileSize: number;
  fileType: string;
}

interface ResumeGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
}

// Mock data - will be replaced with Redux store data
const mockResumes: Resume[] = [
  {
    id: "1",
    fileName: "john_doe_resume.pdf",
    candidateName: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    uploadDate: new Date("2024-01-15"),
    status: "completed",
    summary: "Experienced software engineer with 5+ years in full-stack development",
    experience: 5,
    education: "Bachelor's in Computer Science",
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
    fileSize: 2.4,
    fileType: "PDF"
  },
  {
    id: "2",
    fileName: "jane_smith_cv.pdf",
    candidateName: "Jane Smith",
    email: "jane.smith@email.com",
    phone: "+1 (555) 987-6543",
    location: "New York, NY",
    uploadDate: new Date("2024-01-14"),
    status: "completed",
    summary: "Senior UX Designer with expertise in user research and design systems",
    experience: 7,
    education: "Master's in Design",
    skills: ["Figma", "Sketch", "User Research", "Prototyping", "Design Systems"],
    fileSize: 1.8,
    fileType: "PDF"
  },
  {
    id: "3",
    fileName: "mike_johnson_resume.docx",
    candidateName: "Mike Johnson",
    email: "mike.johnson@email.com",
    location: "Austin, TX",
    uploadDate: new Date("2024-01-13"),
    status: "processing",
    experience: 3,
    skills: ["Java", "Spring Boot", "MySQL", "Docker"],
    fileSize: 1.2,
    fileType: "DOCX"
  },
  {
    id: "4",
    fileName: "sarah_wilson_cv.pdf",
    candidateName: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    phone: "+1 (555) 456-7890",
    location: "Seattle, WA",
    uploadDate: new Date("2024-01-12"),
    status: "error",
    summary: "Data scientist with machine learning and analytics expertise",
    experience: 4,
    education: "PhD in Data Science",
    skills: ["Python", "TensorFlow", "SQL", "R", "Machine Learning"],
    fileSize: 3.1,
    fileType: "PDF"
  },
  {
    id: "5",
    fileName: "alex_brown_resume.pdf",
    candidateName: "Alex Brown",
    email: "alex.brown@email.com",
    location: "Boston, MA",
    uploadDate: new Date("2024-01-11"),
    status: "pending",
    summary: "Product manager with experience in agile development and user analytics",
    experience: 6,
    education: "MBA in Business Administration",
    skills: ["Product Management", "Agile", "Analytics", "Roadmapping"],
    fileSize: 2.0,
    fileType: "PDF"
  },
  {
    id: "6",
    fileName: "emma_davis_cv.pdf",
    candidateName: "Emma Davis",
    email: "emma.davis@email.com",
    phone: "+1 (555) 321-0987",
    location: "Los Angeles, CA",
    uploadDate: new Date("2024-01-10"),
    status: "completed",
    summary: "Frontend developer specializing in React and modern web technologies",
    experience: 3,
    education: "Bachelor's in Computer Science",
    skills: ["React", "TypeScript", "CSS", "Next.js", "Tailwind"],
    fileSize: 1.5,
    fileType: "PDF"
  }
];

export function ResumeGrid({ viewMode, searchQuery }: ResumeGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

  // Filter resumes based on search query
  const filteredResumes = mockResumes.filter(resume => {
    const searchLower = searchQuery.toLowerCase();
    return (
      resume.candidateName.toLowerCase().includes(searchLower) ||
      resume.email.toLowerCase().includes(searchLower) ||
      resume.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
      (resume.summary && resume.summary.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredResumes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResumes = filteredResumes.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (filteredResumes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileX className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes found</h3>
        <p className="text-gray-600 mb-6">
          {searchQuery 
            ? `No resumes match your search for "${searchQuery}"`
            : "No resumes have been uploaded yet"
          }
        </p>
        {!searchQuery && (
          <button className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-all duration-200">
            Upload Your First Resume
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredResumes.length)} of {filteredResumes.length} resumes
        </p>
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Resume Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        {paginatedResumes.map((resume) => (
          <ResumeCard 
            key={resume.id} 
            resume={resume} 
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
