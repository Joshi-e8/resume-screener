"""
LLM-based Universal Resume Parser
Uses contextual analysis without hardcoded extraction rules
"""

import json
import os
import time
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path

import aiofiles
import pdfplumber
import PyPDF2
from docx import Document
from loguru import logger

from app.core.config import settings


class LLMResumeParser:
    """Universal resume parser using LLM contextual analysis"""

    def __init__(self):
        self.supported_formats = [".pdf", ".docx", ".doc", ".txt"]
        
        # Initialize LLM client based on configuration
        self.llm_client = None
        self._init_llm_client()

    def _init_llm_client(self):
        """Initialize the appropriate LLM client"""
        try:
            provider = getattr(settings, "PROVIDER", "openai").lower()
            
            if provider == "openai":
                from openai import OpenAI
                api_key = getattr(settings, "OPENAI_API_KEY", "")
                base_url = getattr(settings, "OPENAI_BASE_URL", None)
                self.llm_client = OpenAI(api_key=api_key, base_url=base_url)
                self.model = getattr(settings, "OPENAI_MODEL", "gpt-4o")
                self.provider = "openai"
            elif provider == "groq":
                from groq import Groq
                api_key = getattr(settings, "GROQ_API_KEY", "")
                self.llm_client = Groq(api_key=api_key)
                self.model = getattr(settings, "GROQ_MODEL", "llama-3.1-70b-versatile")
                self.provider = "groq"
            else:
                logger.warning(f"Unsupported LLM provider: {provider}")
                self.llm_client = None
                
        except Exception as e:
            logger.error(f"Failed to initialize LLM client: {e}")
            self.llm_client = None

    async def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """
        Parse resume using LLM contextual analysis
        """
        start_time = time.time()
        
        # Extract file metadata
        filename = os.path.basename(file_path)
        file_extension = os.path.splitext(filename)[1].lower()
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        logger.info(f"[llm_parser] Starting parse for {filename} ({file_size} bytes)")
        
        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Extract raw text
        text_start = time.time()
        raw_text = await self._extract_raw_text(file_path, file_extension)
        text_time = int((time.time() - text_start) * 1000)
        
        if not raw_text or not raw_text.strip():
            logger.warning(f"No text extracted from {filename}")
            return self._create_empty_result(filename, file_extension, file_size)

        logger.info(f"[llm_parser] Text extraction: {text_time}ms, {len(raw_text)} chars")

        # Parse with LLM (check for fast mode setting)
        fast_mode = getattr(settings, "PARSER_LLM_FAST_MODE", True)
        llm_start = time.time()
        parsed_result = await self._parse_with_llm(raw_text, filename, file_extension, file_size, fast_mode)
        llm_time = int((time.time() - llm_start) * 1000)
        
        total_time = int((time.time() - start_time) * 1000)
        logger.info(f"[llm_parser] LLM parsing: {llm_time}ms, Total: {total_time}ms")
        
        # Log parsed data for debugging
        self._log_parsed_data(parsed_result, filename)
        
        return parsed_result

    async def parse_batch_resumes(self, resume_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parse multiple resumes in parallel for better throughput
        """
        import asyncio

        async def parse_single(file_data):
            try:
                if 'file_path' in file_data:
                    return await self.parse_resume(file_data['file_path'])
                else:
                    return await self.parse_resume_from_memory(
                        file_data['content'],
                        file_data['filename'],
                        file_data['extension']
                    )
            except Exception as e:
                logger.error(f"Failed to parse {file_data.get('filename', 'unknown')}: {e}")
                return self._create_empty_result(
                    file_data.get('filename', 'unknown'),
                    file_data.get('extension', '.pdf'),
                    len(file_data.get('content', b''))
                )

        # Process up to 3 resumes in parallel to avoid API rate limits
        semaphore = asyncio.Semaphore(3)

        async def parse_with_semaphore(file_data):
            async with semaphore:
                return await parse_single(file_data)

        tasks = [parse_with_semaphore(file_data) for file_data in resume_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Batch processing error for file {i}: {result}")
                processed_results.append(self._create_empty_result("error", ".pdf", 0))
            else:
                processed_results.append(result)

        return processed_results

    async def parse_resume_from_memory(self, file_content: bytes, filename: str, file_extension: str) -> Dict[str, Any]:
        """
        Parse resume directly from memory using LLM contextual analysis
        """
        start_time = time.time()
        file_size = len(file_content)
        
        logger.info(f"[llm_parser] Starting memory parse for {filename} ({file_size} bytes)")
        
        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Extract raw text from memory
        text_start = time.time()
        raw_text = await self._extract_raw_text_from_memory(file_content, file_extension)
        text_time = int((time.time() - text_start) * 1000)
        
        if not raw_text or not raw_text.strip():
            logger.warning(f"No text extracted from {filename}")
            return self._create_empty_result(filename, file_extension, file_size)

        logger.info(f"[llm_parser] Memory text extraction: {text_time}ms, {len(raw_text)} chars")

        # Parse with LLM (check for fast mode setting)
        fast_mode = getattr(settings, "PARSER_LLM_FAST_MODE", True)
        llm_start = time.time()
        parsed_result = await self._parse_with_llm(raw_text, filename, file_extension, file_size, fast_mode)
        llm_time = int((time.time() - llm_start) * 1000)
        
        total_time = int((time.time() - start_time) * 1000)
        logger.info(f"[llm_parser] LLM parsing: {llm_time}ms, Total: {total_time}ms")
        
        # Log parsed data for debugging
        self._log_parsed_data(parsed_result, filename)
        
        return parsed_result

    async def _extract_raw_text(self, file_path: str, file_extension: str) -> str:
        """Extract raw text from file"""
        if file_extension == ".pdf":
            return await self._extract_pdf_text(file_path)
        elif file_extension in [".docx", ".doc"]:
            return await self._extract_docx_text(file_path)
        elif file_extension == ".txt":
            return await self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

    async def _extract_raw_text_from_memory(self, file_content: bytes, file_extension: str) -> str:
        """Extract raw text from file content in memory"""
        if file_extension == ".pdf":
            return await self._extract_pdf_text_from_memory(file_content)
        elif file_extension in [".docx", ".doc"]:
            return await self._extract_docx_text_from_memory(file_content)
        elif file_extension == ".txt":
            return file_content.decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

    def _create_empty_result(self, filename: str, file_extension: str, file_size: int) -> Dict[str, Any]:
        """Create empty result when no text can be extracted"""
        return {
            "prompt_passed": False,
            "prompt_metadata": {
                "filename": filename,
                "mime_type": self._get_mime_type(file_extension),
                "file_size_bytes": file_size,
                "source": "llm_parser",
                "ingested_at_iso": datetime.now(timezone.utc).isoformat()
            },
            "document_overview": {
                "detected_language": None,
                "page_count": None,
                "structure_notes": ["No text could be extracted from this file"]
            },
            "sections": {},
            "contact_cluster": {},
            "semantic_highlights": [],
            "quality": {
                "coverage_ratio": 0.0,
                "missing_signals": ["All resume signals missing - no text extracted"],
                "cautions": ["File could not be processed or contains no readable text"]
            },
            "logs": [
                "Step 1: Failed to extract readable text from the provided file.",
                "Step 2: Returning empty result structure."
            ],
            # Legacy compatibility fields
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

    def _get_mime_type(self, file_extension: str) -> str:
        """Get MIME type from file extension"""
        mime_types = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".doc": "application/msword",
            ".txt": "text/plain"
        }
        return mime_types.get(file_extension, "application/octet-stream")

    def _log_parsed_data(self, parsed_result: Dict[str, Any], filename: str):
        """Log parsed data for debugging"""
        try:
            # Log key extracted information
            contact_info = parsed_result.get("contact_cluster", {})
            name = contact_info.get("name_text", {}).get("value", "N/A")
            emails = contact_info.get("email_texts", {}).get("values", [])
            phones = contact_info.get("phone_texts", {}).get("values", [])
            
            logger.info(f"[llm_parser] Parsed {filename}: name='{name}', emails={len(emails)}, phones={len(phones)}")
            
            # Log sections found
            sections = parsed_result.get("sections", {})
            section_names = []
            for k, v in sections.items():
                if v:  # If section has content
                    if isinstance(v, dict) and v.get("raw_block"):
                        section_names.append(k)
                    elif isinstance(v, str) and v.strip():  # Handle string sections from fast mode
                        section_names.append(k)
                    elif isinstance(v, list) and v:
                        section_names.append(k)
            logger.info(f"[llm_parser] Sections found: {section_names}")
            
            # Log using structured JSON format
            from app.core.json_logging import log_parsed_resume

            # Extract skills from legacy format
            skills = []
            if "skills" in parsed_result:
                skills = parsed_result["skills"]
            elif "skills_like" in sections:
                skills_text = sections.get("skills_like", {}).get("text", "")
                if skills_text:
                    # Basic skill extraction from text
                    skills = [s.strip() for s in skills_text.split(",") if s.strip()]

            # Extract experience years
            experience_years = parsed_result.get("total_experience_years", 0)

            # Extract education
            education = []
            if "education" in sections:
                edu_text = sections.get("education", {}).get("text", "")
                if edu_text:
                    education = [{"text": edu_text}]

            # Extract quality score
            quality = parsed_result.get("quality", {})
            quality_score = quality.get("coverage_ratio", 0)

            # Extract semantic highlights for additional context
            highlights = parsed_result.get("semantic_highlights", [])
            key_capabilities = [h.get("verbatim", "")[:60] for h in highlights[:3]]

            # Log using structured JSON format
            log_parsed_resume(
                filename=filename,
                candidate_name=name if name != "N/A" else None,
                candidate_email=emails[0] if emails else None,
                candidate_phone=phones[0] if phones else None,
                skills=skills,
                experience_years=experience_years,
                education=education,
                sections_found=section_names,
                quality_score=quality_score,
                key_capabilities=key_capabilities,
                highlights_count=len(highlights),
                emails_count=len(emails),
                phones_count=len(phones)
            )
            
        except Exception as e:
            logger.warning(f"Failed to log parsed data for {filename}: {e}")

    async def _parse_with_llm(self, raw_text: str, filename: str, file_extension: str, file_size: int, fast_mode: bool = True) -> Dict[str, Any]:
        """Parse resume text using LLM with universal prompt"""
        if not self.llm_client:
            logger.warning("No LLM client available, falling back to empty result")
            return self._create_empty_result(filename, file_extension, file_size)

        try:
            # Create the universal parsing prompt (optimized for speed)
            prompt = self._create_fast_prompt(raw_text, filename, file_extension, file_size) if fast_mode else self._create_universal_prompt(raw_text, filename, file_extension, file_size)

            # Debug: Log the text being sent to AI
            logger.info(f"[llm_parser] Sending {len(raw_text)} chars to AI for {filename}")
            logger.info(f"[llm_parser] Text preview: {raw_text[:200]}...")

            # Call LLM based on provider - optimized for speed
            system_msg = "Extract resume data quickly and accurately. Return only JSON." if fast_mode else "You are an expert resume parser. Analyze the provided resume text using contextual understanding without relying on hardcoded patterns. Return ONLY valid JSON that matches the specified schema."
            max_tokens = 2000 if fast_mode else 4000

            if self.provider == "openai":
                response = self.llm_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": system_msg
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.0,  # Faster with 0 temperature
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"}
                )
                response_text = response.choices[0].message.content
            elif self.provider == "groq":
                response = self.llm_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": system_msg
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.0,  # Faster with 0 temperature
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"}
                )
                response_text = response.choices[0].message.content
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")

            # Log the AI response for debugging (if enabled)
            log_responses = getattr(settings, "LOG_AI_RESPONSES", True)
            if log_responses:
                logger.info("AI response received for resume parsing",
                           event_type="ai_parsing",
                           event="response_received",
                           filename=filename,
                           provider=self.provider,
                           model=self.model,
                           response_length=len(response_text) if response_text else 0,
                           response_preview=response_text[:200] if response_text else None)

            # Parse JSON response
            parsed_json = json.loads(response_text)

            # Check if response is empty or invalid
            if not parsed_json or not isinstance(parsed_json, dict):
                logger.warning(f"[llm_parser] Empty or invalid AI response for {filename}, using fallback")
                return self._create_fallback_result(raw_text, filename, file_extension, file_size)

            # Add legacy compatibility fields
            legacy_data = self._convert_to_legacy_format(parsed_json, filename)
            parsed_json.update(legacy_data)

            # Add metadata
            parsed_json["raw_text"] = raw_text
            parsed_json["file_type"] = file_extension
            parsed_json["parsed_at"] = datetime.now(timezone.utc).isoformat()
            parsed_json["processing_mode"] = "llm_universal"

            return parsed_json

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response for {filename}: {e}")
            return self._create_fallback_result(raw_text, filename, file_extension, file_size)
        except Exception as e:
            logger.error(f"LLM parsing failed for {filename}: {e}")
            return self._create_fallback_result(raw_text, filename, file_extension, file_size)

    def _create_universal_prompt(self, raw_text: str, filename: str, file_extension: str, file_size: int) -> str:
        """Create the universal resume parsing prompt - optimized for speed"""
        # Limit text size for faster processing (keep first 4000 chars)
        limited_text = raw_text[:4000] if len(raw_text) > 4000 else raw_text

        prompt = f"""# Fast Resume Parser - Extract key information quickly

## Instructions:
- Extract contact info, skills, and key sections using contextual understanding
- Provide confidence scores for extracted data
- Be concise but accurate

## Resume Text to Analyze:
```
{limited_text}
```

## File Metadata:
- Filename: {filename}
- File Type: {file_extension}
- File Size: {file_size} bytes
- Ingested At: {datetime.now(timezone.utc).isoformat()}

## Required Output Structure (JSON only):

{{
  "prompt_passed": true,
  "prompt_metadata": {{
    "filename": "{filename}",
    "mime_type": "{self._get_mime_type(file_extension)}",
    "file_size_bytes": {file_size},
    "source": "llm_universal_parser",
    "ingested_at_iso": "{datetime.now(timezone.utc).isoformat()}"
  }},

  "document_overview": {{
    "detected_language": "<BCP-47 code or null>",
    "page_count": <integer or null>,
    "structure_notes": [
      "High-level notes on layout and sections as seen in text (no extraction rules)."
    ]
  }},

  "sections": {{
    "header": {{
      "raw_block": "<verbatim lines that look like the header/contact area>",
      "notes": "Why this block was considered a header."
    }},
    "summary": {{
      "raw_block": "<verbatim lines that read like a professional summary or objective>",
      "notes": "Why this block was considered a summary."
    }},
    "skills_like": {{
      "raw_block": "<verbatim lines that look like skill/tool lists regardless of domain>",
      "notes": "Why this block was considered skills-like content."
    }},
    "experience_like": {{
      "raw_block": "<verbatim lines that describe roles/tenure/achievements>",
      "notes": "Why this block was considered experience-like content."
    }},
    "projects_like": {{
      "raw_block": "<verbatim lines that describe projects/initiatives>",
      "notes": "Why this block was considered projects-like content."
    }},
    "education_like": {{
      "raw_block": "<verbatim lines that describe education/courses>",
      "notes": "Why this block was considered education-like content."
    }},
    "other_blocks": [
      {{
        "label": "custom",
        "raw_block": "<verbatim lines of any other recognizable block (awards, languages, certs, publications, links, etc.)>",
        "notes": "Why this block was identified."
      }}
    ]
  }},

  "contact_cluster": {{
    "name_text": {{
      "value": "<if a candidate name is semantically apparent, copy it verbatim; else null>",
      "evidence_spans": ["<verbatim line(s) backing the value>"],
      "confidence": 0.0
    }},
    "email_texts": {{
      "values": ["<copy verbatim tokens that look like emails; if ambiguous or broken, return empty>"],
      "evidence_spans": ["<verbatim line(s)>"],
      "confidence": 0.0
    }},
    "phone_texts": {{
      "values": ["<copy verbatim tokens that look like phones; no normalization>"],
      "evidence_spans": ["<verbatim line(s)>"],
      "confidence": 0.0
    }},
    "link_texts": {{
      "values": ["<verbatim URLs/usernames as they appear>"],
      "evidence_spans": ["<verbatim line(s)>"],
      "confidence": 0.0
    }},
    "location_text": {{
      "value": "<verbatim location string if clearly indicated; else null>",
      "evidence_spans": ["<verbatim line(s)>"],
      "confidence": 0.0
    }}
  }},

  "semantic_highlights": [
    {{
      "label": "capability_or_focus",
      "verbatim": "<short verbatim bullet or sentence from the input>",
      "why_it_matters": "Short justification in plain language.",
      "confidence": 0.0
    }}
  ],

  "quality": {{
    "coverage_ratio": 0.0,
    "missing_signals": [
      "List what typical resume signals appear absent in the provided text (purely observational; no guessing)."
    ],
    "cautions": [
      "Ambiguities/risks (e.g., broken tokens, overlapping lines, truncated content)."
    ]
  }},

  "logs": [
    "Step 1: Located visible header by proximity to top and presence of contact-like cues (e.g., '@', country code, URLs).",
    "Step 2: Grouped lines into blocks based on blank-line boundaries and section-like headers.",
    "Step 3: Marked skills-like content due to comma/bullet separated terms and tool-like phrasing.",
    "Step 4: Recorded evidence spans for each returned field/value.",
    "Step 5: Left uncertain fields null; avoided normalization or guessing."
  ]
}}

Return ONLY the JSON object, no additional text or formatting."""

        return prompt

    def _create_fast_prompt(self, raw_text: str, filename: str, file_extension: str, file_size: int) -> str:
        """Create a fast, concise parsing prompt for speed"""
        # Limit text even more for speed (first 3000 chars)
        limited_text = raw_text[:3000] if len(raw_text) > 3000 else raw_text

        prompt = f"""You are a resume parser. Extract information from this resume text and return ONLY valid JSON.

Resume Text:
{limited_text}

Return this exact JSON structure (fill with actual data from the resume):
{{
  "prompt_passed": true,
  "contact_cluster": {{
    "name_text": {{"value": "CANDIDATE_NAME_HERE", "confidence": 0.9}},
    "email_texts": {{"values": ["email@example.com"], "confidence": 0.9}},
    "phone_texts": {{"values": ["+1234567890"], "confidence": 0.9}},
    "location_text": {{"value": "City, State", "confidence": 0.8}}
  }},
  "sections": {{
    "summary": "Professional summary from resume",
    "skills_like": "List of technical skills and technologies",
    "experience_like": "Work experience details",
    "education_like": "Education background"
  }},
  "semantic_highlights": [
    {{"label": "key_skill", "verbatim": "Important skill or technology", "confidence": 0.8}}
  ],
  "quality": {{"coverage_ratio": 0.85}}
}}

IMPORTANT: Return ONLY the JSON object. No explanations, no markdown, no extra text."""

        return prompt

    def _create_fallback_result(self, raw_text: str, filename: str, file_extension: str, file_size: int) -> Dict[str, Any]:
        """Create fallback result when LLM parsing fails - extract basic info from raw text"""
        import re

        # Try to extract basic info from raw text
        name = ""
        email = ""
        phone = ""
        skills = []

        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', raw_text)
        if email_match:
            email = email_match.group()

        # Extract phone
        phone_match = re.search(r'[\+]?[1-9]?[\d\s\-\(\)]{8,15}', raw_text)
        if phone_match:
            phone = phone_match.group().strip()

        # Extract name (first line that looks like a name)
        lines = raw_text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if line and len(line.split()) <= 4 and not '@' in line and not any(char.isdigit() for char in line):
                if len(line) > 3:  # Reasonable name length
                    name = line
                    break

        # Extract common skills
        skill_keywords = ['Python', 'Java', 'JavaScript', 'React', 'Django', 'Flask', 'SQL', 'MySQL', 'PostgreSQL', 'HTML', 'CSS', 'Git', 'AWS', 'Docker']
        for skill in skill_keywords:
            if skill.lower() in raw_text.lower():
                skills.append(skill)

        # Create structured result
        result = {
            "prompt_passed": False,
            "contact_cluster": {
                "name_text": {"value": name, "confidence": 0.5},
                "email_texts": {"values": [email] if email else [], "confidence": 0.7},
                "phone_texts": {"values": [phone] if phone else [], "confidence": 0.6},
                "location_text": {"value": "", "confidence": 0.0}
            },
            "sections": {
                "summary": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
                "skills_like": ", ".join(skills),
                "experience_like": "",
                "education_like": ""
            },
            "semantic_highlights": [
                {"label": "fallback_extraction", "verbatim": "Basic regex extraction", "confidence": 0.3}
            ],
            "quality": {"coverage_ratio": 0.3},
            "raw_text": raw_text,
            "file_type": file_extension,
            "parsed_at": datetime.now(timezone.utc).isoformat(),
            "processing_mode": "llm_fallback",
            "extraction_warning": "LLM parsing failed, used regex fallback extraction"
        }

        # Add legacy compatibility
        legacy_data = self._convert_to_legacy_format(result, filename)
        result.update(legacy_data)

        return result

    def _convert_to_legacy_format(self, parsed_json: Dict[str, Any], filename: str = "unknown") -> Dict[str, Any]:
        """Convert universal parser output to legacy format for compatibility"""
        legacy_data = {}

        # Extract contact info
        contact_cluster = parsed_json.get("contact_cluster", {})

        # Extract emails and phones as single values (not lists) for legacy compatibility
        emails = contact_cluster.get("email_texts", {}).get("values", [])
        phones = contact_cluster.get("phone_texts", {}).get("values", [])

        legacy_data["contact_info"] = {
            "name": contact_cluster.get("name_text", {}).get("value", ""),
            "email": emails[0] if emails else "",  # Take first email as string
            "phone": phones[0] if phones else "",  # Take first phone as string
            "location": contact_cluster.get("location_text", {}).get("value", ""),
            "links": contact_cluster.get("link_texts", {}).get("values", [])
        }

        # Extract skills from skills_like section
        sections = parsed_json.get("sections", {})
        skills_section = sections.get("skills_like", {})
        # Handle both dict format {"raw_block": "..."} and string format
        if isinstance(skills_section, dict):
            skills_text = skills_section.get("raw_block", "")
        else:
            skills_text = str(skills_section) if skills_section else ""
        legacy_data["skills"] = self._extract_skills_from_text(skills_text)

        # Debug logging
        logger.info(f"[llm_parser] Legacy conversion for {filename}:")
        logger.info(f"  - Name: {legacy_data['contact_info']['name']}")
        logger.info(f"  - Email: {legacy_data['contact_info']['email']}")
        logger.info(f"  - Skills: {len(legacy_data['skills'])} found")
        logger.info(f"  - Summary length: {len(legacy_data.get('summary', ''))}")

        # Extract summary
        summary_section = sections.get("summary", {})
        if isinstance(summary_section, dict):
            legacy_data["summary"] = summary_section.get("raw_block", "")
        else:
            legacy_data["summary"] = str(summary_section) if summary_section else ""

        # Extract experience (simplified)
        experience_section = sections.get("experience_like", {})
        if isinstance(experience_section, dict):
            experience_text = experience_section.get("raw_block", "")
        else:
            experience_text = str(experience_section) if experience_section else ""
        legacy_data["experience"] = [{"description": experience_text}] if experience_text else []

        # Extract education (simplified)
        education_section = sections.get("education_like", {})
        if isinstance(education_section, dict):
            education_text = education_section.get("raw_block", "")
        else:
            education_text = str(education_section) if education_section else ""
        legacy_data["education"] = [{"description": education_text}] if education_text else []

        # Extract projects (simplified)
        projects_section = sections.get("projects_like", {})
        if isinstance(projects_section, dict):
            projects_text = projects_section.get("raw_block", "")
        else:
            projects_text = str(projects_section) if projects_section else ""
        legacy_data["projects"] = [{"description": projects_text}] if projects_text else []

        # Extract other fields from other_blocks
        other_blocks = sections.get("other_blocks", [])
        legacy_data["certifications"] = []
        legacy_data["languages"] = []

        for block in other_blocks:
            if isinstance(block, dict):
                label = block.get("label", "").lower()
                raw_block = block.get("raw_block", "")

                if "cert" in label or "license" in label:
                    legacy_data["certifications"].append({"name": raw_block})
                elif "lang" in label:
                    legacy_data["languages"].append({"name": raw_block})

        return legacy_data

    def _extract_skills_from_text(self, skills_text: str) -> List[str]:
        """Extract individual skills from skills text block"""
        if not skills_text:
            return []

        # Simple extraction - split by common delimiters
        import re
        skills = []

        # Split by common delimiters
        parts = re.split(r'[,;•\n\r\t]', skills_text)

        for part in parts:
            skill = part.strip()
            if skill and len(skill) > 1 and len(skill) < 50:
                # Remove common prefixes/suffixes
                skill = re.sub(r'^[-•\s]+', '', skill)
                skill = re.sub(r'[-•\s]+$', '', skill)
                if skill:
                    skills.append(skill)

        return skills[:20]  # Limit to 20 skills

    # Text extraction methods (reuse from existing parser)
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
            logger.warning(f"PDFPlumber failed for {file_path}: {str(e)}")

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
            logger.warning(f"PyPDF2 failed for {file_path}: {str(e)}")

        logger.warning(f"Could not extract text from PDF {file_path}")
        return ""

    async def _extract_pdf_text_from_memory(self, file_content: bytes) -> str:
        """Extract text from PDF file content in memory"""
        try:
            # Try PDFPlumber first
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
            logger.warning(f"PDFPlumber failed for memory content: {e}")

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
            logger.warning(f"PyPDF2 failed for memory content: {e}")

        logger.warning("Could not extract text from PDF memory content")
        return ""

    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text_parts = []

            # Extract text from paragraphs
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)

            # Also extract text from tables if any
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text_parts.append(cell.text)

            return "\n".join(text_parts) if text_parts else ""

        except Exception as e:
            logger.warning(f"DOCX extraction failed for {file_path}: {str(e)}")
            return ""

    async def _extract_docx_text_from_memory(self, file_content: bytes) -> str:
        """Extract text from DOCX file content in memory"""
        try:
            import io
            doc = Document(io.BytesIO(file_content))
            text_parts = []

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)

            return "\n".join(text_parts)
        except Exception as e:
            logger.warning(f"DOCX extraction failed for memory content: {e}")
            return ""

    async def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as file:
                text = await file.read()
            return text.strip()
        except Exception as e:
            logger.error(f"Failed to extract TXT text: {str(e)}")
            return ""
