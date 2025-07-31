"""
Resume parsing service using PDFPlumber and other libraries
"""

import os
import re
import tempfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiofiles
import pdfplumber
import PyPDF2
from docx import Document


class ResumeParser:
    """Service for parsing resumes from various file formats"""
    
    def __init__(self):
        self.supported_formats = ['.pdf', '.docx', '.doc', '.txt']
        
        # Common patterns for extracting information
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
        self.linkedin_pattern = re.compile(r'linkedin\.com/in/[\w-]+', re.IGNORECASE)
        self.github_pattern = re.compile(r'github\.com/[\w-]+', re.IGNORECASE)
        
        # Skills patterns (can be expanded)
        self.tech_skills = [
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'hibernate',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git',
            'html', 'css', 'sass', 'bootstrap', 'tailwind', 'figma', 'photoshop',
            'machine learning', 'ai', 'data science', 'pandas', 'numpy', 'tensorflow',
            'pytorch', 'scikit-learn', 'r', 'matlab', 'tableau', 'power bi'
        ]
        
        # Education keywords
        self.education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university',
            'college', 'institute', 'school', 'education', 'graduated', 'gpa'
        ]
        
        # Experience keywords
        self.experience_keywords = [
            'experience', 'work', 'employment', 'job', 'position', 'role',
            'responsibilities', 'achievements', 'projects', 'internship'
        ]
    
    async def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """
        Parse resume from file path and extract structured data
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")
        
        # Extract text based on file type
        if file_extension == '.pdf':
            text = await self._extract_pdf_text(file_path)
        elif file_extension in ['.docx', '.doc']:
            text = await self._extract_docx_text(file_path)
        elif file_extension == '.txt':
            text = await self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
        
        # Parse structured data from text
        parsed_data = await self._parse_text_content(text)
        parsed_data['raw_text'] = text
        parsed_data['file_type'] = file_extension
        parsed_data['parsed_at'] = datetime.now(timezone.utc).isoformat()
        
        return parsed_data
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF using PDFPlumber"""
        text = ""
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            # Fallback to PyPDF2 if PDFPlumber fails
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
            except Exception as fallback_error:
                raise Exception(f"Failed to extract PDF text: {e}, Fallback error: {fallback_error}")
        
        return text.strip()
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract DOCX text: {e}")
    
    async def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                text = await file.read()
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract TXT text: {e}")
    
    async def _parse_text_content(self, text: str) -> Dict[str, Any]:
        """Parse structured data from resume text"""
        
        # Clean and normalize text
        cleaned_text = self._clean_text(text)
        lines = cleaned_text.split('\n')
        
        parsed_data = {
            'contact_info': self._extract_contact_info(cleaned_text),
            'skills': self._extract_skills(cleaned_text),
            'education': self._extract_education(lines),
            'experience': self._extract_experience(lines),
            'summary': self._extract_summary(lines),
            'certifications': self._extract_certifications(cleaned_text),
            'languages': self._extract_languages(cleaned_text),
            'projects': self._extract_projects(lines)
        }
        
        return parsed_data
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s@.-]', ' ', text)
        return text.strip()
    
    def _extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """Extract contact information"""
        contact_info = {
            'email': None,
            'phone': None,
            'linkedin': None,
            'github': None,
            'location': None
        }
        
        # Extract email
        email_match = self.email_pattern.search(text)
        if email_match:
            contact_info['email'] = email_match.group()
        
        # Extract phone
        phone_match = self.phone_pattern.search(text)
        if phone_match:
            contact_info['phone'] = phone_match.group()
        
        # Extract LinkedIn
        linkedin_match = self.linkedin_pattern.search(text)
        if linkedin_match:
            contact_info['linkedin'] = linkedin_match.group()
        
        # Extract GitHub
        github_match = self.github_pattern.search(text)
        if github_match:
            contact_info['github'] = github_match.group()
        
        # Extract location (simple heuristic)
        location_patterns = [
            r'([A-Z][a-z]+,\s*[A-Z]{2})',  # City, State
            r'([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})',  # City Name, State
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, text)
            if location_match:
                contact_info['location'] = location_match.group()
                break
        
        return contact_info
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills"""
        found_skills = []
        text_lower = text.lower()
        
        for skill in self.tech_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        # Look for skills sections
        skills_section_pattern = r'(?:skills?|technologies?|technical skills?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)'
        skills_match = re.search(skills_section_pattern, text, re.IGNORECASE | re.DOTALL)
        
        if skills_match:
            skills_text = skills_match.group(1)
            # Extract comma-separated or bullet-pointed skills
            additional_skills = re.findall(r'[•\-\*]?\s*([A-Za-z][A-Za-z0-9\s\.\+\#]{2,20})', skills_text)
            for skill in additional_skills:
                skill = skill.strip()
                if len(skill) > 2 and skill not in found_skills:
                    found_skills.append(skill)
        
        return list(set(found_skills))  # Remove duplicates
    
    def _extract_education(self, lines: List[str]) -> List[Dict[str, str]]:
        """Extract education information"""
        education = []
        education_section = False
        current_education = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if we're in education section
            if any(keyword in line.lower() for keyword in self.education_keywords):
                education_section = True
                
                # Look for degree patterns
                degree_pattern = r'(bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?)'
                degree_match = re.search(degree_pattern, line, re.IGNORECASE)
                
                if degree_match:
                    if current_education:
                        education.append(current_education)
                    
                    current_education = {
                        'degree': line,
                        'institution': '',
                        'year': '',
                        'field': ''
                    }
            
            elif education_section and line:
                # Look for years
                year_pattern = r'(19|20)\d{2}'
                year_match = re.search(year_pattern, line)
                if year_match and 'year' not in current_education:
                    current_education['year'] = year_match.group()
                
                # If it looks like an institution name
                if not current_education.get('institution') and len(line) > 10:
                    current_education['institution'] = line
        
        if current_education:
            education.append(current_education)
        
        return education
    
    def _extract_experience(self, lines: List[str]) -> List[Dict[str, str]]:
        """Extract work experience"""
        experience = []
        experience_section = False
        current_job = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if we're in experience section
            if any(keyword in line.lower() for keyword in self.experience_keywords):
                experience_section = True
            
            elif experience_section:
                # Look for job titles and companies
                if re.search(r'(manager|engineer|developer|analyst|specialist|coordinator)', line, re.IGNORECASE):
                    if current_job:
                        experience.append(current_job)
                    
                    current_job = {
                        'title': line,
                        'company': '',
                        'duration': '',
                        'description': ''
                    }
                
                # Look for years/duration
                elif re.search(r'(19|20)\d{2}', line) and current_job:
                    current_job['duration'] = line
                
                # Add to description
                elif current_job and len(line) > 20:
                    if current_job['description']:
                        current_job['description'] += ' ' + line
                    else:
                        current_job['description'] = line
        
        if current_job:
            experience.append(current_job)
        
        return experience
    
    def _extract_summary(self, lines: List[str]) -> str:
        """Extract professional summary"""
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Get next few lines as summary
                summary_lines = []
                for j in range(i + 1, min(i + 5, len(lines))):
                    if lines[j].strip() and not any(keyword in lines[j].lower() for keyword in self.experience_keywords + self.education_keywords):
                        summary_lines.append(lines[j].strip())
                    else:
                        break
                
                return ' '.join(summary_lines)
        
        return ""
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications"""
        cert_keywords = ['certification', 'certified', 'certificate']
        certifications = []
        
        for keyword in cert_keywords:
            pattern = rf'{keyword}[:\s]*(.*?)(?:\n|$)'
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match.strip():
                    certifications.append(match.strip())
        
        return certifications
    
    def _extract_languages(self, text: str) -> List[str]:
        """Extract languages"""
        language_pattern = r'(?:languages?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)'
        language_match = re.search(language_pattern, text, re.IGNORECASE | re.DOTALL)
        
        if language_match:
            languages_text = language_match.group(1)
            languages = re.findall(r'([A-Z][a-z]+)', languages_text)
            return [lang for lang in languages if len(lang) > 2]
        
        return []
    
    def _extract_projects(self, lines: List[str]) -> List[Dict[str, str]]:
        """Extract project information"""
        projects = []
        project_keywords = ['project', 'portfolio']
        project_section = False
        current_project = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if any(keyword in line.lower() for keyword in project_keywords):
                project_section = True
            
            elif project_section and line:
                if current_project and (line.startswith('•') or line.startswith('-')):
                    if current_project['description']:
                        current_project['description'] += ' ' + line
                    else:
                        current_project['description'] = line
                else:
                    if current_project:
                        projects.append(current_project)
                    
                    current_project = {
                        'name': line,
                        'description': '',
                        'technologies': ''
                    }
        
        if current_project:
            projects.append(current_project)
        
        return projects
