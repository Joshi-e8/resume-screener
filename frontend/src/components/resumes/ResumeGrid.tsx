"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Grid, List, Filter, SortAsc, Search } from "lucide-react";
import { Resume } from "@/data/mockResumes";
import { ResumeCard } from "./ResumeCard";
import { ResumeListView } from "./ResumeListView";
import { useAppSelector } from "@/store/store";
import useResumeServices from "@/lib/services/resumeServices";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

import { EnhancedSearch } from "./EnhancedSearch";
import { ResumeDetailModal } from "./ResumeDetailModal";
import { AdvancedSearchModal } from "./AdvancedSearchModal";
import { MobileFloatingActionButton } from "@/components/ui/FloatingActionButton";
import {
  filterResumesAdvanced,
  generateSearchSuggestions,
  saveSearchToHistory,
  getSearchHistory,
  clearSearchHistory
} from "@/lib/searchUtils";

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'experience' | 'match';
type SortOrder = 'asc' | 'desc';

interface ResumeGridProps {
  initialSearchQuery?: string;
}

export function ResumeGrid({ initialSearchQuery = '' }: ResumeGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const [selectedFilters, setSelectedFilters] = useState<{
    status?: Resume['status'][];
    experience?: [number, number];
    skills?: string[];
    location?: string[];
    dateRange?: [Date | null, Date | null];
  }>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedResumeIds, setSelectedResumeIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const itemsPerPage = 12;

  // Use ref to track if API has been called to prevent infinite loops
  const hasCalledApi = useRef(false);
  // Track if we have ever loaded data (to distinguish from empty after deletions)
  const hasLoadedData = useRef(false);

  // Load recent searches on mount

  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    setRecentSearches(getSearchHistory());
  }, []);

  const { getResumesByJob, getAllResumes, downloadResume, searchResumes, bulkDeleteResumes, bulkUpdateStatus, deleteResume, updateResumeStatus, bulkDownloadResumes } = useResumeServices();
  const deriveNameFromEmail = (email?: string) => {
    if (!email) return undefined;
    const local = email.split('@')[0];
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (!parts.length) return undefined;
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };
  const deriveNameFromFilename = (filename?: string) => {
    if (!filename) return undefined;
    const base = filename.replace(/\.[^/.]+$/, '');
    const parts = base.split(/[._-]+/).filter(Boolean).slice(0, 3);
    if (!parts.length) return undefined;
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const [apiResumes, setApiResumes] = useState<any[] | null>(null);

  // TODO: select a job to fetch by. For now, if cached has job_id, fetch that.

  const processingProgress = useAppSelector((s) => s.resumeUpload.processingProgress);
  const uploadSuccess = useAppSelector((s) => s.resumeUpload.uploadSuccess);

  const [cachedResults, setCachedResults] = useState<any[] | null>(null);

  // Build runtime resumes list from processing results when available
  const runtimeResumes = useMemo(() => {
    const results = processingProgress?.results;
    if (results && Array.isArray(results) && results.length > 0) {
      return results
        .filter((r: any) => r && r.success)
        .map((r: any, idx: number) => ({
          id: r.file_id || String(idx),
          name: r.parsed_data?.contact_info?.name || r.parsed_data?.name || r.filename || `Candidate ${idx + 1}`,
          email: r.parsed_data?.contact_info?.email || r.parsed_data?.email || "",
          phone: r.parsed_data?.contact_info?.phone || "",
          location: r.parsed_data?.contact_info?.location || "",
          title:
            r.parsed_data?.title ||
            (Array.isArray(r.parsed_data?.experience) && r.parsed_data.experience.length > 0
              ? r.parsed_data.experience[0]?.title || ""
              : r.parsed_data?.designation || ""),
          experience: Number(r.parsed_data?.total_experience_years || 0),
          skills: Array.isArray(r.parsed_data?.skills) ? r.parsed_data.skills : [],
          education: Array.isArray(r.parsed_data?.education)
            ? r.parsed_data.education.map((e: any) => ({
                degree: e?.degree || "",
                school: e?.institution || e?.school || "",
                year: Number(e?.year || 0),
              }))
            : [],
          summary: r.parsed_data?.summary || "",
          status: "reviewed" as Resume["status"],
          uploadDate: new Date().toISOString(),
          fileType: "pdf" as const,
          fileSize: 0,
          matchScore: (r as any).ai_overall_score ?? undefined,
          tags: [],
          lastActivity: new Date().toISOString(),
          source: "Google Drive",
          filename: r.filename,
          ai_overall_score: (r as any).ai_overall_score,
          ai_scoring: (r as any).ai_scoring,
        }));
    }
    return null;
  }, [processingProgress, uploadSuccess]);

  // If no live progress results, map from cachedResults too
  const runtimeFromCache = useMemo(() => {
    if (cachedResults && cachedResults.length > 0 && (!processingProgress?.results || processingProgress.results.length === 0)) {
      return cachedResults
        .filter((r: any) => r && r.success)
        .map((r: any, idx: number) => ({
          id: r.file_id || String(idx),
          name: r.parsed_data?.contact_info?.name || r.parsed_data?.name || r.filename || `Candidate ${idx + 1}`,
          email: r.parsed_data?.contact_info?.email || r.parsed_data?.email || "",
          phone: r.parsed_data?.contact_info?.phone || "",
          location: r.parsed_data?.contact_info?.location || "",
          title:
            r.parsed_data?.title ||
            (Array.isArray(r.parsed_data?.experience) && r.parsed_data.experience.length > 0
              ? r.parsed_data.experience[0]?.title || ""
              : r.parsed_data?.designation || ""),
          experience: Number(r.parsed_data?.total_experience_years || 0),
          skills: Array.isArray(r.parsed_data?.skills) ? r.parsed_data.skills : [],
          education: Array.isArray(r.parsed_data?.education)
            ? r.parsed_data.education.map((e: any) => ({ degree: e?.degree || "", school: e?.institution || e?.school || "", year: Number(e?.year || 0) }))
            : [],
          summary: r.parsed_data?.summary || "",
          status: "reviewed" as Resume["status"],
          uploadDate: new Date().toISOString(),
          fileType: "pdf" as const,
          fileSize: 0,
          matchScore: (r as any).ai_overall_score ?? undefined,
          tags: [],
          lastActivity: new Date().toISOString(),
          source: "Google Drive",
          filename: r.filename,
          ai_overall_score: (r as any).ai_overall_score,
          ai_scoring: (r as any).ai_scoring,
        }));
    }
    return null;
  }, [cachedResults, processingProgress?.results]);

  // Map from API list when present and no live/cached results
  const runtimeFromApi = useMemo(() => {
    if (!apiResumes || apiResumes.length === 0) return null;
    return apiResumes.map((rec: any, idx: number) => {
      const fallbackName = deriveNameFromEmail(rec.candidate_email) || deriveNameFromFilename(rec.filename);

      return {
        id: rec.id || rec.file_id || String(idx),
        name: rec.candidate_name || fallbackName || rec.filename || `Candidate ${idx + 1}`,
        email: rec.candidate_email || "",
        phone: rec.phone || "",
        location: rec.location || "",
        title: rec.title || "",
        experience: Number(rec.total_experience_years || 0),
        skills: Array.isArray(rec.key_skills) ? rec.key_skills : [],
        education: Array.isArray(rec.education)
          ? rec.education.map((e: any) => ({ degree: e?.degree || '', school: e?.institution || e?.school || '', year: Number(e?.year || 0) }))
          : [],
        summary: rec.summary || "",
        status: (rec.ui_status || "new") as Resume["status"],
        uploadDate: rec.created_at || new Date().toISOString(),
        fileType: (rec.mime_type?.includes('pdf') ? 'pdf' : rec.mime_type?.includes('word') ? 'docx' : undefined) as 'pdf' | 'doc' | 'docx' | undefined as any,
        fileSize: typeof rec.file_size === 'number' ? rec.file_size : 0,
        matchScore: rec.ai_overall_score ?? undefined,
        tags: Array.isArray(rec.tags) ? rec.tags : [],
        lastActivity: rec.created_at || new Date().toISOString(),
        source: rec.source || 'Google Drive',
        filename: rec.filename, // Add filename for downloads
        ai_overall_score: rec.ai_overall_score,
        ai_scoring: rec.ai_scoring,
        // Add the experience array for detailed view
        experience_array: Array.isArray(rec.experience) ? rec.experience : [],
        projects: Array.isArray(rec.projects) ? rec.projects : [],
      } as Resume & {
        ai_overall_score?: number;
        ai_scoring?: any;
        experience_array?: any[];
        projects?: any[];
      };
    });
  }, [apiResumes, processingProgress?.results, cachedResults]);

  // On mount, if we have no in-memory results, hydrate from localStorage persisted results
  useEffect(() => {
    if (!processingProgress?.results) {
      try {
        const cached = localStorage.getItem('latestResumeResults');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCachedResults(parsed);
          }
        }
      } catch {}
    }
  }, [processingProgress?.results]);

  // Try fetching by jobId found in cached or live results
  useEffect(() => {
    const runtimeWithJob = ((processingProgress?.results as any[]) || []).find((r: any) => r?.job_id);
    const jobIdFromRuntime = (runtimeWithJob as any)?.job_id as string | undefined;
    const jobIdFromCache = (cachedResults || []).find((r: any) => r?.job_id)?.job_id as string | undefined;
    const jobId = jobIdFromRuntime || jobIdFromCache;

    console.debug('[ResumeGrid] Job fetch effect', { status, jobId, hasApiResumes: Boolean(apiResumes) });

    if (!hasLoadedData.current && jobId && status === 'authenticated' && session && !hasCalledApi.current) {
      hasCalledApi.current = true;
      (async () => {
        try {
          console.debug('[ResumeGrid] Fetching resumes by job', jobId);
          const data = await getResumesByJob(jobId);
          if (data?.records) {
            setApiResumes(data.records);
            hasLoadedData.current = true;
          }
        } catch (e) {
          console.warn('Failed to fetch resumes by job', e);
          hasCalledApi.current = false; // Reset on error
        }
      })();
    }
  }, [processingProgress?.results, cachedResults, getResumesByJob, apiResumes, status, session]);

  // If no jobId is present, fetch recent resumes across jobs
  useEffect(() => {
    const runtimeWithJob = ((processingProgress?.results as any[]) || []).find((r: any) => r?.job_id);
    const jobIdFromRuntime = (runtimeWithJob as any)?.job_id as string | undefined;
    const jobIdFromCache = (cachedResults || []).find((r: any) => r?.job_id)?.job_id as string | undefined;
    const jobId = jobIdFromRuntime || jobIdFromCache;

    if (!jobId && !hasLoadedData.current && status === 'authenticated' && session && !hasCalledApi.current) {
      hasCalledApi.current = true; // Mark as called to prevent multiple calls
      (async () => {
        try {
          const data = await getAllResumes();
          if (data?.records) {
            setApiResumes(data.records);
            hasLoadedData.current = true;
          }
        } catch (e) {
          console.warn('Failed to fetch all resumes', e);
          hasCalledApi.current = false; // Reset on error so user can retry
        }
      })();
    }
  }, [processingProgress?.results, cachedResults, apiResumes, status, session]); // Removed getAllResumes from deps
  // Choose data source: only real data; no mock fallback
  const baseResumes: Resume[] = useMemo(() =>
    runtimeResumes ?? runtimeFromCache ?? runtimeFromApi ?? [],
    [runtimeResumes, runtimeFromCache, runtimeFromApi]
  );

  // Generate search suggestions based on current data source
  const searchSuggestions = useMemo(() => generateSearchSuggestions(baseResumes), [baseResumes]);

  // Filter and search resumes with advanced search
  const filteredResumes = useMemo(() => {
    let results = filterResumesAdvanced(baseResumes, searchQuery);

    // Apply additional filters
    results = results.filter(resume => {
      // Status filter
      if (selectedFilters.status?.length && !selectedFilters.status.includes(resume.status)) {
        return false;
      }

      // Experience filter
      if (selectedFilters.experience) {
        const [minExp, maxExp] = selectedFilters.experience;
        if (resume.experience < minExp || resume.experience > maxExp) {
          return false;
        }
      }

      // Skills filter
      if (selectedFilters.skills?.length) {
        const hasMatchingSkill = selectedFilters.skills.some(skill =>
          resume.skills.some(resumeSkill =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasMatchingSkill) return false;
      }

      // Location filter
      if (selectedFilters.location?.length) {
        const hasMatchingLocation = selectedFilters.location.some(location =>
          resume.location.toLowerCase().includes(location.toLowerCase())
        );
        if (!hasMatchingLocation) return false;
      }

      // Date range filter
      if (selectedFilters.dateRange?.[0] || selectedFilters.dateRange?.[1]) {
        const uploadDate = new Date(resume.uploadDate);
        const startDate = selectedFilters.dateRange[0];
        const endDate = selectedFilters.dateRange[1];

        if (startDate && uploadDate < startDate) return false;
        if (endDate && uploadDate > endDate) return false;
      }

      return true;
    });

    return results;
  }, [baseResumes, searchQuery, selectedFilters]);

  // Sort resumes
  const sortedResumes = [...filteredResumes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        break;
      case 'experience':
        comparison = a.experience - b.experience;
        break;
      case 'match':
        comparison = ((a.matchScore ?? (a as any).ai_overall_score ?? 0) as number)
          - ((b.matchScore ?? (b as any).ai_overall_score ?? 0) as number);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedResumes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResumes = sortedResumes.slice(startIndex, startIndex + itemsPerPage);

  // Handler functions
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value.trim()) {
      saveSearchToHistory(value);
      setRecentSearches(getSearchHistory());
    }
  };



  const handleRemoveFilter = (filterType: string, value?: string) => {
    const newFilters = { ...selectedFilters };

    if (filterType === 'status' && value) {
      newFilters.status = newFilters.status?.filter(s => s !== value);
      if (newFilters.status?.length === 0) delete newFilters.status;
    } else if (filterType === 'experience') {
      delete newFilters.experience;
    } else if (filterType === 'skills' && value) {
      newFilters.skills = newFilters.skills?.filter(s => s !== value);
      if (newFilters.skills?.length === 0) delete newFilters.skills;
    } else if (filterType === 'location' && value) {
      newFilters.location = newFilters.location?.filter(l => l !== value);
      if (newFilters.location?.length === 0) delete newFilters.location;
    } else if (filterType === 'dateRange') {
      delete newFilters.dateRange;
    }

    setSelectedFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedFilters({});
    setCurrentPage(1);
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const handleClearRecentSearches = () => {
    clearSearchHistory();
    setRecentSearches([]);
  };

  const handleAdvancedSearch = async (filters: {
    keywords: string;
    location: string;
    experience: { min: number; max: number };
    skills: string[];
    education: string;
    jobTitle: string;
    salary: { min: number; max: number };
    dateRange: string;
    status: string[];
  }) => {
    try {
      // Build search request for backend API
      const searchRequest = {
        query: filters.keywords,
        filters: {
          ...(filters.location && { location: filters.location }),
          ...(filters.skills.length > 0 && { skills: filters.skills }),
          ...(filters.status.length > 0 && { status: filters.status }),
          ...(filters.dateRange !== 'all' && { date_range: filters.dateRange }),
          // Add file type filter for common resume formats
          file_types: ['pdf', 'docx', 'doc', 'txt']
        },
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 50
      };

      console.log('Advanced search request:', searchRequest);

      // Call backend search API
      const response = await searchResumes(searchRequest);

      if (response?.result === 'success' && response.records) {
        // Update the API resumes with search results
        setApiResumes(response.records);
        hasLoadedData.current = true;
        console.log(`Advanced search found ${response.total} results`);
      } else {
        console.warn('Advanced search returned no results');
        setApiResumes([]);
        hasLoadedData.current = true;
      }

      // Also update local search query for UI consistency
      if (filters.keywords) {
        setSearchQuery(filters.keywords);
      }

      setCurrentPage(1);

    } catch (error) {
      console.error('Advanced search failed:', error);

      // Fallback to local filtering if API search fails
      const newFilters: {
        location?: string[];
        experience?: [number, number];
        skills?: string[];
        status?: Resume['status'][];
      } = {};

      if (filters.keywords) {
        setSearchQuery(filters.keywords);
      }

      if (filters.location) {
        newFilters.location = [filters.location];
      }

      if (filters.experience.min > 0 || filters.experience.max < 20) {
        newFilters.experience = [filters.experience.min, filters.experience.max];
      }

      if (filters.skills.length > 0) {
        newFilters.skills = filters.skills;
      }

      if (filters.status.length > 0) {
        newFilters.status = filters.status as Resume['status'][];
      }

      setSelectedFilters(newFilters);
      setCurrentPage(1);
    }
  };

  const handleView = (resume: Resume) => {
    setSelectedResume(resume);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResume(null);
  };

  const handleDownload = async (resume: Resume) => {
    console.log('🔥 handleDownload called with resume:', resume.id, resume.filename);
    try {
      console.log('Downloading resume:', resume.id);

      // Check if user is authenticated
      if (status !== 'authenticated') {
        console.error('User not authenticated, status:', status);
        showToast({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to download resumes'
        });
        return;
      }

      console.log('User is authenticated, proceeding with download...');
      const result = await downloadResume(resume.id, resume.filename);

      if (result?.success) {
        console.log('Download completed for:', resume.filename);
        showToast({
          type: 'success',
          title: 'Download Complete',
          message: `Successfully downloaded ${resume.filename}`
        });
      } else {
        console.error('Download failed:', result);
        showToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Please check your connection and try again.'
      });
    }
  };

  const handleDelete = async (resume: Resume) => {
    const confirmed = await confirm({
      title: 'Delete Resume',
      message: `Are you sure you want to delete the resume for ${resume.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteResume(resume.id);
      if (result?.result === 'success') {
        // Remove from local state using functional updates
        setApiResumes(prevApiResumes =>
          prevApiResumes?.filter(r => r.id !== resume.id) || []
        );

        // Also remove from cached results if present
        setCachedResults(prevCachedResults =>
          prevCachedResults?.filter(r => r.file_id !== resume.id) || []
        );

        showToast({
          type: 'success',
          title: 'Resume Deleted',
          message: `Successfully deleted resume for ${resume.name}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: result?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Please try again.'
      });
    }
  };

  const handleStatusChange = async (resume: Resume, status: Resume['status']) => {
    try {
      const result = await updateResumeStatus(resume.id, status);

      if (result?.result === 'success') {
        // Update local state - update the API response data which will trigger useMemo re-run
        if (apiResumes) {
          setApiResumes(prevApiResumes =>
            prevApiResumes ? prevApiResumes.map(r =>
              r.id === resume.id ? { ...r, ui_status: status } : r
            ) : prevApiResumes
          );
        }

        // Also update cached results if present
        if (cachedResults) {
          setCachedResults(prevCachedResults =>
            prevCachedResults ? prevCachedResults.map(r =>
              r.file_id === resume.id ? { ...r, ui_status: status } : r
            ) : prevCachedResults
          );
        }

        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `Resume status updated to ${status}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: result?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Status update failed:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update resume status. Please try again.'
      });
    }
  };

  // Bulk operation handlers
  const handleSelectResume = (resumeId: string, selected: boolean) => {
    const newSelected = new Set(selectedResumeIds);
    if (selected) {
      newSelected.add(resumeId);
    } else {
      newSelected.delete(resumeId);
    }
    setSelectedResumeIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(paginatedResumes.map(r => r.id));
      setSelectedResumeIds(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedResumeIds(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedResumeIds.size === 0) return;

    try {
      const resumeIds = Array.from(selectedResumeIds);
      const result = await bulkDownloadResumes(resumeIds);

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Bulk Download Complete',
          message: `Downloaded ${resumeIds.length} resumes as ZIP file`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Bulk Download Failed',
          message: result.error || 'Failed to download resumes'
        });
      }
    } catch (error) {
      console.error('Bulk download error:', error);
      showToast({
        type: 'error',
        title: 'Bulk Download Failed',
        message: 'Please try again.'
      });
    }
  };

  const handleBulkDelete = async (resumeIdsToDelete?: string[]) => {
    // Use provided IDs or fall back to selected IDs
    const idsToDelete = resumeIdsToDelete || Array.from(selectedResumeIds);

    console.log('🔍 handleBulkDelete called with resumeIdsToDelete:', resumeIdsToDelete);
    console.log('🔍 handleBulkDelete selectedResumeIds:', Array.from(selectedResumeIds));
    console.log('🔍 handleBulkDelete final idsToDelete:', idsToDelete);
    console.log('🔍 handleBulkDelete idsToDelete length:', idsToDelete.length);

    if (idsToDelete.length === 0) {
      console.log('❌ No IDs to delete, returning');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Multiple Resumes',
      message: `Are you sure you want to delete ${idsToDelete.length} resume${idsToDelete.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      console.log('🚀 Calling bulkDeleteResumes API with:', idsToDelete);

      const response = await bulkDeleteResumes(idsToDelete);
      console.log('📡 API response:', response);

      if (response?.result === 'success') {
        console.log(`Successfully deleted ${response.deleted_count} resumes`);

        // Remove deleted resumes from local state using functional updates
        if (apiResumes) {
          const deletedIdsSet = new Set(idsToDelete);
          setApiResumes(prevApiResumes =>
            prevApiResumes ? prevApiResumes.filter(r => !deletedIdsSet.has(r.id)) : prevApiResumes
          );
        }

        // Clear selection
        setSelectedResumeIds(new Set());
        setShowBulkActions(false);

        showToast({
          type: 'success',
          title: 'Bulk Delete Complete',
          message: `Successfully deleted ${response.deleted_count} resume${response.deleted_count > 1 ? 's' : ''}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Bulk Delete Failed',
          message: response?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      showToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: 'Please try again.'
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string, resumeIdsToUpdate?: string[]) => {
    // Use provided IDs or fall back to selected IDs
    const idsToUpdate = resumeIdsToUpdate || Array.from(selectedResumeIds);

    if (idsToUpdate.length === 0) return;

    try {
      console.log('Bulk updating status:', idsToUpdate, newStatus);

      const response = await bulkUpdateStatus(idsToUpdate, newStatus);

      if (response?.result === 'success') {
        console.log(`Successfully updated ${response.updated_count} resumes`);

        // Update status in local state
        if (apiResumes) {
          const updatedIdsSet = new Set(idsToUpdate);
          const updatedResumes = apiResumes.map(r =>
            updatedIdsSet.has(r.id) ? { ...r, ui_status: newStatus } : r
          );
          setApiResumes(updatedResumes);
        }

        // Also update cached results if present
        if (cachedResults) {
          const updatedIdsSet = new Set(idsToUpdate);
          const updatedCached = cachedResults.map(r =>
            updatedIdsSet.has(r.file_id) ? { ...r, ui_status: newStatus } : r
          );
          setCachedResults(updatedCached);
        }

        // Clear selection
        setSelectedResumeIds(new Set());
        setShowBulkActions(false);

        showToast({
          type: 'success',
          title: 'Bulk Status Update Complete',
          message: `Successfully updated ${response.updated_count} resume${response.updated_count > 1 ? 's' : ''} to ${newStatus}`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Bulk Status Update Failed',
          message: response?.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Bulk status update failed:', error);
      showToast({
        type: 'error',
        title: 'Bulk Status Update Failed',
        message: 'Please try again.'
      });
    }
  };

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view resumes</p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Mobile-Friendly Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <EnhancedSearch
            value={searchQuery}
            onChange={handleSearchChange}
            suggestions={searchSuggestions}
            recentSearches={recentSearches}
            onRecentSearchClick={handleRecentSearchClick}
            onClearRecentSearches={handleClearRecentSearches}
            onAdvancedSearch={() => setShowAdvancedSearch(true)}
          />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-3 border border-yellow-500 text-yellow-600 bg-yellow-50 rounded-xl font-medium transition-all duration-200 touch-manipulation hover:bg-yellow-100"
            >
              <Filter className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Advanced Search</span>
              {Object.keys(selectedFilters).length > 0 && (
                <span className="ml-1 sm:ml-2 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {Object.keys(selectedFilters).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(selectedFilters).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Active Filters</h3>
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
              >
                {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="hover:text-yellow-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Mobile-Friendly Header Controls */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Select All Checkbox */}
            {paginatedResumes.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedResumeIds.size === paginatedResumes.length && paginatedResumes.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {filteredResumes.length} Resume{filteredResumes.length !== 1 ? 's' : ''}
            </h2>

            {searchQuery && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm">
                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate max-w-[120px] sm:max-w-none">&quot;{searchQuery}&quot;</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-500 hidden sm:block" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-2 touch-manipulation"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="experience-desc">Most Experience</option>
                <option value="experience-asc">Least Experience</option>
                <option value="match-desc">Best Match</option>
                <option value="match-asc">Lowest Match</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 touch-manipulation ${
                  viewMode === 'grid'
                    ? 'bg-yellow-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 touch-manipulation ${
                  viewMode === 'list'
                    ? 'bg-yellow-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-yellow-800">
                {selectedResumeIds.size} resume{selectedResumeIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setSelectedResumeIds(new Set());
                  setShowBulkActions(false);
                }}
                className="text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Download */}
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Download Selected
              </button>

              {/* Bulk Status Update */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-sm border border-yellow-300 rounded-lg bg-white text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Update Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>

              {/* Bulk Delete */}
              <button
                onClick={() => handleBulkDelete()}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Resume Grid/List */}
        <div className="flex-1">
          {paginatedResumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
              <p className="text-gray-600">
                {searchQuery || Object.keys(selectedFilters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Upload some resumes to get started'
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {paginatedResumes.map((resume) => (
                    <ResumeCard
                      key={resume.id}
                      resume={resume}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      isSelected={selectedResumeIds.has(resume.id)}
                      onSelect={handleSelectResume}
                    />
                  ))}
                </div>
              ) : (
                <ResumeListView
                    resumes={paginatedResumes}
                    onView={handleView}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onBulkDownload={async (resumeIds) => {
                      try {
                        const result = await bulkDownloadResumes(resumeIds);
                        if (result.success) {
                          showToast({
                            type: 'success',
                            title: 'Download Complete',
                            message: `Downloaded ${resumeIds.length} resumes as ZIP file`
                          });
                        } else {
                          showToast({
                            type: 'error',
                            title: 'Download Failed',
                            message: result.error || 'Failed to download resumes'
                          });
                        }
                      } catch (error) {
                        console.error('Bulk download error:', error);
                        showToast({
                          type: 'error',
                          title: 'Download Failed',
                          message: 'Failed to download resumes'
                        });
                      }
                    }}
                    onBulkDelete={(resumeIds) => {
                      console.log('🔍 ResumeGrid onBulkDelete called with:', resumeIds);
                      console.log('🔍 ResumeGrid resumeIds length:', resumeIds.length);
                      console.log('🔍 ResumeGrid resumeIds type:', typeof resumeIds, Array.isArray(resumeIds));
                      handleBulkDelete(resumeIds);
                    }}
                    onBulkStatusChange={(resumeIds, status) => {
                      handleBulkStatusUpdate(status, resumeIds);
                    }}
                  />
              )}

              {/* Enhanced Mobile-Friendly Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all duration-200"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg touch-manipulation transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-yellow-500 text-white shadow-sm'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Resume Detail Modal */}
      <ResumeDetailModal
        resume={selectedResume}
        isOpen={showModal}
        onClose={handleCloseModal}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
      />

      {/* Mobile Floating Action Button */}
      <MobileFloatingActionButton
        actions={[
          {
            icon: () => <span className="text-lg">📤</span>,
            label: "Upload Resume",
            href: "/dashboard/resumes/upload",
            color: "bg-blue-500 hover:bg-blue-600"
          },
          {
            icon: () => <span className="text-lg">🔍</span>,
            label: "Advanced Search",
            onClick: () => setShowAdvancedSearch(true),
            color: "bg-green-500 hover:bg-green-600"
          },
          {
            icon: () => <span className="text-lg">🔧</span>,
            label: "Advanced Search",
            onClick: () => setShowAdvancedSearch(true),
            color: "bg-purple-500 hover:bg-purple-600"
          }
        ]}
      />
    </div>
  );
}
