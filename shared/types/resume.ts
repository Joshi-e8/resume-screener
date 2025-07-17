// Shared TypeScript types for Resume Screener

export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
  relevant_courses?: string[];
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface ParsedResume {
  personal_info: PersonalInfo;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications?: string[];
  languages?: string[];
  projects?: {
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }[];
}

export interface JobDescription {
  id?: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  preferred_skills: string[];
  experience_level: string;
  location?: string;
  created_at?: Date;
}

export interface MatchScore {
  overall_score: number; // 0-100
  skills_match: number;
  experience_match: number;
  education_match: number;
  breakdown: {
    matched_skills: string[];
    missing_skills: string[];
    experience_relevance: string;
    education_relevance: string;
  };
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'SHORTLIST' | 'REJECT' | 'MAYBE';
  reasoning: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  job_description_id: string;
  parsed_resume: ParsedResume;
  match_score: MatchScore;
  ai_analysis: AIAnalysis;
  status: 'PENDING' | 'ANALYZED' | 'SHORTLISTED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
}

export interface UploadedResume {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: Date;
  status: 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'ERROR';
  error_message?: string;
}
