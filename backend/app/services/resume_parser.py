"""
Resume parsing service using PDFPlumber and other libraries
"""

import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiofiles
import pdfplumber
import PyPDF2
from docx import Document


class ResumeParser:
    """Service for parsing resumes from various file formats"""

    def __init__(self):
        self.supported_formats = [".pdf", ".docx", ".doc", ".txt"]

        # Common patterns for extracting information
        self.email_pattern = re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        )
        self.phone_pattern = re.compile(
            r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
        )
        self.linkedin_pattern = re.compile(r"linkedin\.com/in/[\w-]+", re.IGNORECASE)
        self.github_pattern = re.compile(r"github\.com/[\w-]+", re.IGNORECASE)

        # Skills patterns (can be expanded)
        self.tech_skills = [
            "python",
            "java",
            "javascript",
            "typescript",
            "react",
            "angular",
            "vue",
            "node.js",
            "express",
            "django",
            "flask",
            "fastapi",
            "spring",
            "hibernate",
            "sql",
            "mysql",
            "postgresql",
            "mongodb",
            "redis",
            "elasticsearch",
            "aws",
            "azure",
            "gcp",
            "docker",
            "kubernetes",
            "jenkins",
            "git",
            "html",
            "css",
            "sass",
            "bootstrap",
            "tailwind",
            "figma",
            "photoshop",
            "machine learning",
            "ai",
            "data science",
            "pandas",
            "numpy",
            "tensorflow",
            "pytorch",
            "scikit-learn",
            "r",
            "matlab",
            "tableau",
            "power bi",
        ]

        # Education keywords
        self.education_keywords = [
            "bachelor",
            "master",
            "phd",
            "doctorate",
            "degree",
            "university",
            "college",
            "institute",
            "school",
            "education",
            "graduated",
            "gpa",
        ]

        # Experience keywords
        self.experience_keywords = [
            "experience",
            "work",
            "employment",
            "job",
            "position",
            "role",
            "responsibilities",
            "achievements",
            "projects",
            "internship",
        ]

        # Pre-compile regex patterns for better performance
        self.job_title_pattern = re.compile(
            r"(manager|engineer|developer|analyst|specialist|coordinator|director|lead|senior|junior)",
            re.IGNORECASE
        )
        self.year_pattern = re.compile(r"(19|20)\d{2}")
        self.skills_section_pattern = re.compile(
            r"(?:skills?|technologies?|technical skills?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)",
            re.IGNORECASE | re.DOTALL
        )

    async def parse_resume_from_memory(self, file_content: bytes, filename: str, file_extension: str) -> Dict[str, Any]:
        """
        Parse resume directly from memory (much faster than file I/O)
        """
        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Extract text based on file type directly from memory
        if file_extension == ".pdf":
            text = await self._extract_pdf_text_from_memory(file_content)
        elif file_extension in [".docx", ".doc"]:
            text = await self._extract_docx_text_from_memory(file_content)
        elif file_extension == ".txt":
            text = file_content.decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Handle empty text gracefully
        if not text or not text.strip():
            print(f"Warning: No text extracted from {filename}")
            return {
                "raw_text": "",
                "file_type": file_extension,
                "parsed_at": datetime.now(timezone.utc).isoformat(),
                "contact_info": {},
                "skills": [],
                "education": [],
                "experience": [],
                "summary": "",
                "certifications": [],
                "languages": [],
                "projects": [],
                "extraction_warning": "No text could be extracted from this file"
            }

        # Always use fast mode for bulk processing
        fast_mode = True
        if len(text) > 10000:  # Even more aggressive text limiting
            text = text[:10000]

        # Parse structured data from text (fast mode only)
        parsed_data = await self._parse_text_content(text, fast_mode)
        parsed_data["raw_text"] = text
        parsed_data["file_type"] = file_extension
        parsed_data["parsed_at"] = datetime.now(timezone.utc).isoformat()
        parsed_data["processing_mode"] = "fast_bulk"

        return parsed_data

    async def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """
        Parse resume from file path and extract structured data
        """
        file_extension = os.path.splitext(file_path)[1].lower()

        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Extract text based on file type
        if file_extension == ".pdf":
            text = await self._extract_pdf_text(file_path)
        elif file_extension in [".docx", ".doc"]:
            text = await self._extract_docx_text(file_path)
        elif file_extension == ".txt":
            text = await self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Handle empty text gracefully
        if not text or not text.strip():
            print(f"Warning: No text extracted from {file_path}")
            return {
                "raw_text": "",
                "file_type": file_extension,
                "parsed_at": datetime.now(timezone.utc).isoformat(),
                "contact_info": {},
                "skills": [],
                "education": [],
                "experience": [],
                "summary": "",
                "certifications": [],
                "languages": [],
                "projects": [],
                "extraction_warning": "No text could be extracted from this file"
            }

        # Limit text size to prevent performance issues (max 20KB for fast processing)
        fast_mode = False
        if len(text) > 20000:
            print(f"Warning: Large text file ({len(text)} chars), enabling fast mode for {file_path}")
            text = text[:20000]
            fast_mode = True

        # Parse structured data from text
        parsed_data = await self._parse_text_content(text, fast_mode)
        parsed_data["raw_text"] = text
        parsed_data["file_type"] = file_extension
        parsed_data["parsed_at"] = datetime.now(timezone.utc).isoformat()
        if fast_mode:
            parsed_data["processing_mode"] = "fast"

        return parsed_data

    async def _extract_pdf_text_from_memory(self, file_content: bytes) -> str:
        """
        Extract text from PDF file content in memory (faster)
        """
        try:
            # Try PDFPlumber first (most reliable)
            import io
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text_parts = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)

                if text_parts:
                    return "\n".join(text_parts)
        except Exception as e:
            print(f"PDFPlumber failed for memory content: {e}")

        # Fallback to PyPDF2
        try:
            import io
            from PyPDF2 import PdfReader

            pdf_reader = PdfReader(io.BytesIO(file_content))
            text_parts = []

            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

            if text_parts:
                return "\n".join(text_parts)
        except Exception as e:
            print(f"PyPDF2 failed for memory content: {e}")

        print("Warning: Could not extract text from PDF memory content, returning empty string")
        return ""

    async def _extract_docx_text_from_memory(self, file_content: bytes) -> str:
        """
        Extract text from DOCX file content in memory (faster)
        """
        try:
            import io
            from docx import Document

            doc = Document(io.BytesIO(file_content))
            text_parts = []

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)

            return "\n".join(text_parts)
        except Exception as e:
            print(f"DOCX extraction failed for memory content: {e}")
            return ""

    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF using multiple methods"""
        text = ""

        # Method 1: Try PDFPlumber first (best for complex layouts)
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"PDFPlumber failed for {file_path}: {str(e)}")

        # Method 2: Fallback to PyPDF2
        try:
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"PyPDF2 failed for {file_path}: {str(e)}")

        # Method 3: Try with different PyPDF2 settings
        try:
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file, strict=False)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"PyPDF2 (non-strict) failed for {file_path}: {str(e)}")

        # If all methods fail, return empty string instead of raising exception
        print(f"Warning: Could not extract text from PDF {file_path}, returning empty string")
        return ""

    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file with improved error handling"""
        text = ""

        try:
            doc = Document(file_path)

            # Extract text from paragraphs
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"

            # Also extract text from tables if any
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text += cell.text + " "
                    text += "\n"

            if text.strip():
                return text.strip()
            else:
                print(f"Warning: No text content found in DOCX {file_path}")
                return ""

        except Exception as e:
            print(f"DOCX extraction failed for {file_path}: {str(e)}")
            # Return empty string instead of raising exception
            return ""

    async def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as file:
                text = await file.read()
            return text.strip()
        except Exception as e:  # noqa: E722
            raise Exception(f"Failed to extract TXT text: {str(e)}")

    async def _parse_text_content(self, text: str, fast_mode: bool = False) -> Dict[str, Any]:
        """Parse structured data from resume text"""
        import time

        # Clean and normalize text
        start_time = time.time()
        cleaned_text = self._clean_text(text)
        lines = cleaned_text.split("\n")

        # Limit number of lines to process for performance (max 500 lines)
        if len(lines) > 500:
            print(f"Warning: Large file with {len(lines)} lines, limiting to 500 lines for processing")
            lines = lines[:500]

        print(f"Text cleaning: {int((time.time() - start_time) * 1000)}ms, {len(lines)} lines")

        parsed_data = {}

        # Time each extraction method
        start_time = time.time()
        parsed_data["contact_info"] = self._extract_contact_info(cleaned_text)
        print(f"Contact info extraction: {int((time.time() - start_time) * 1000)}ms")

        start_time = time.time()
        parsed_data["skills"] = self._extract_skills(cleaned_text)
        print(f"Skills extraction: {int((time.time() - start_time) * 1000)}ms")

        start_time = time.time()
        parsed_data["education"] = self._extract_education(lines)
        print(f"Education extraction: {int((time.time() - start_time) * 1000)}ms")

        if fast_mode:
            # In fast mode, skip expensive operations
            print("Fast mode: skipping detailed experience, summary, certifications, languages, and projects extraction")
            parsed_data["experience"] = []
            parsed_data["summary"] = ""
            parsed_data["certifications"] = []
            parsed_data["languages"] = []
            parsed_data["projects"] = []
        else:
            start_time = time.time()
            parsed_data["experience"] = self._extract_experience(lines)
            print(f"Experience extraction: {int((time.time() - start_time) * 1000)}ms")

            start_time = time.time()
            parsed_data["summary"] = self._extract_summary(lines)
            print(f"Summary extraction: {int((time.time() - start_time) * 1000)}ms")

            start_time = time.time()
            parsed_data["certifications"] = self._extract_certifications(cleaned_text)
            print(f"Certifications extraction: {int((time.time() - start_time) * 1000)}ms")

            start_time = time.time()
            parsed_data["languages"] = self._extract_languages(cleaned_text)
            print(f"Languages extraction: {int((time.time() - start_time) * 1000)}ms")

            start_time = time.time()
            parsed_data["projects"] = self._extract_projects(lines)
            print(f"Projects extraction: {int((time.time() - start_time) * 1000)}ms")

        return parsed_data

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r"[^\w\s@.-]", " ", text)
        return text.strip()

    def _extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """Extract contact information"""
        contact_info = {
            "email": None,
            "phone": None,
            "linkedin": None,
            "github": None,
            "location": None,
        }

        # Extract email
        email_match = self.email_pattern.search(text)
        if email_match:
            contact_info["email"] = email_match.group()

        # Extract phone
        phone_match = self.phone_pattern.search(text)
        if phone_match:
            contact_info["phone"] = phone_match.group()

        # Extract LinkedIn
        linkedin_match = self.linkedin_pattern.search(text)
        if linkedin_match:
            contact_info["linkedin"] = linkedin_match.group()

        # Extract GitHub
        github_match = self.github_pattern.search(text)
        if github_match:
            contact_info["github"] = github_match.group()

        # Extract location (simple heuristic)
        location_patterns = [
            r"([A-Z][a-z]+,\s*[A-Z]{2})",  # City, State
            r"([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})",  # City Name, State
        ]

        for pattern in location_patterns:
            location_match = re.search(pattern, text)
            if location_match:
                contact_info["location"] = location_match.group()
                break

        return contact_info

    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills"""
        found_skills = []
        text_lower = text.lower()

        for skill in self.tech_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)

        # Look for skills sections using pre-compiled pattern
        skills_match = self.skills_section_pattern.search(text)

        if skills_match:
            skills_text = skills_match.group(1)
            # Extract comma-separated or bullet-pointed skills
            additional_skills = re.findall(
                r"[•\-\*]?\s*([A-Za-z][A-Za-z0-9\s\.\+\#]{2,20})", skills_text
            )
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
                degree_pattern = r"(bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?)"
                degree_match = re.search(degree_pattern, line, re.IGNORECASE)

                if degree_match:
                    if current_education:
                        education.append(current_education)

                    current_education = {
                        "degree": line,
                        "institution": "",
                        "year": "",
                        "field": "",
                    }

            elif education_section and line:
                # Look for years
                year_pattern = r"(19|20)\d{2}"
                year_match = re.search(year_pattern, line)
                if year_match and "year" not in current_education:
                    current_education["year"] = year_match.group()

                # If it looks like an institution name
                if not current_education.get("institution") and len(line) > 10:
                    current_education["institution"] = line

        if current_education:
            education.append(current_education)

        return education

    def _extract_experience(self, lines: List[str]) -> List[Dict[str, str]]:
        """Extract work experience with performance optimization"""
        experience = []
        experience_section = False
        current_job = {}

        # Limit processing to first 200 lines for performance
        lines_to_process = lines[:200] if len(lines) > 200 else lines

        for line in lines_to_process:
            line = line.strip()
            if not line:
                continue

            # Check if we're in experience section
            if any(keyword in line.lower() for keyword in self.experience_keywords):
                experience_section = True

            elif experience_section:
                # Look for job titles and companies using pre-compiled pattern
                if self.job_title_pattern.search(line):
                    if current_job:
                        experience.append(current_job)

                    current_job = {
                        "title": line,
                        "company": "",
                        "duration": "",
                        "description": "",
                    }

                # Look for years/duration using pre-compiled pattern
                elif self.year_pattern.search(line) and current_job:
                    current_job["duration"] = line

                # Add to description (limit description length)
                elif current_job and len(line) > 20:
                    if len(current_job.get("description", "")) < 500:  # Limit description length
                        if current_job["description"]:
                            current_job["description"] += " " + line
                        else:
                            current_job["description"] = line

        if current_job:
            experience.append(current_job)

        return experience

    def _extract_summary(self, lines: List[str]) -> str:
        """Extract professional summary"""
        summary_keywords = ["summary", "objective", "profile", "about"]

        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Get next few lines as summary
                summary_lines = []
                for j in range(i + 1, min(i + 5, len(lines))):
                    if lines[j].strip() and not any(
                        keyword in lines[j].lower()
                        for keyword in self.experience_keywords
                        + self.education_keywords
                    ):
                        summary_lines.append(lines[j].strip())
                    else:
                        break

                return " ".join(summary_lines)

        return ""

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications"""
        cert_keywords = ["certification", "certified", "certificate"]
        certifications = []

        for keyword in cert_keywords:
            pattern = rf"{keyword}[:\s]*(.*?)(?:\n|$)"
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match.strip():
                    certifications.append(match.strip())

        return certifications

    def _extract_languages(self, text: str) -> List[str]:
        """Extract languages"""
        language_pattern = r"(?:languages?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)"
        language_match = re.search(language_pattern, text, re.IGNORECASE | re.DOTALL)

        if language_match:
            languages_text = language_match.group(1)
            languages = re.findall(r"([A-Z][a-z]+)", languages_text)
            return [lang for lang in languages if len(lang) > 2]

        return []

    def _extract_projects(self, lines: List[str]) -> List[Dict[str, str]]:
        """Extract project information"""
        projects = []
        project_keywords = ["project", "portfolio"]
        project_section = False
        current_project = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if any(keyword in line.lower() for keyword in project_keywords):
                project_section = True

            elif project_section and line:
                if current_project and (line.startswith("•") or line.startswith("-")):
                    if current_project["description"]:
                        current_project["description"] += " " + line
                    else:
                        current_project["description"] = line
                else:
                    if current_project:
                        projects.append(current_project)

                    current_project = {
                        "name": line,
                        "description": "",
                        "technologies": "",
                    }

        if current_project:
            projects.append(current_project)

        return projects
