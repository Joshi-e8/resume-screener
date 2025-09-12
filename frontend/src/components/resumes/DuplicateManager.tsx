"use client";

import { useState, useEffect } from "react";
import { 
  Copy, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Calendar,
  User,
  Mail
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import useDuplicateServices from "@/lib/services/duplicateServices";
import { formatDistanceToNow } from "date-fns";

interface DuplicateGroup {
  hash: string;
  count: number;
  original: {
    id: string;
    filename: string;
    candidate_name?: string;
    candidate_email?: string;
    created_at: string;
  };
  duplicates: Array<{
    id: string;
    filename: string;
    candidate_name?: string;
    candidate_email?: string;
    created_at: string;
  }>;
}

interface DuplicateManagerProps {
  onDuplicatesChanged?: () => void;
}

export function DuplicateManager({ onDuplicatesChanged }: DuplicateManagerProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_groups: 0,
    total_duplicates: 0,
    potential_space_savings: 0
  });

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { getDuplicateGroups, deleteDuplicateResume, bulkDeleteDuplicates, getDuplicateStats } = useDuplicateServices();

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const [groupsResult, statsResult] = await Promise.all([
        getDuplicateGroups(),
        getDuplicateStats()
      ]);

      if (groupsResult.success) {
        setDuplicateGroups(groupsResult.data.duplicate_groups || []);
      } else {
        showToast({
          type: 'error',
          title: 'Load Failed',
          message: groupsResult.error || 'Failed to load duplicates'
        });
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading duplicates:', error);
      showToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load duplicate information'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDuplicate = async (resumeId: string, filename: string) => {
    const confirmed = await confirm({
      title: 'Delete Duplicate Resume',
      message: `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const result = await deleteDuplicateResume(resumeId);
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Deleted Successfully',
          message: 'Duplicate resume deleted successfully'
        });
        loadDuplicates(); // Reload the list
        onDuplicatesChanged?.();
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: result.error || 'Failed to delete duplicate'
        });
      }
    } catch (error) {
      console.error('Error deleting duplicate:', error);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete duplicate'
      });
    }
  };

  const handleBulkDeleteGroup = async (group: DuplicateGroup) => {
    const duplicateIds = group.duplicates.map(d => d.id);
    const confirmed = await confirm({
      title: 'Delete All Duplicates',
      message: `Are you sure you want to delete all ${duplicateIds.length} duplicate(s) for "${group.original.filename}"? The original will be kept.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const result = await bulkDeleteDuplicates(duplicateIds);
      if (result.success) {
        const { success_count, fail_count } = result.data;
        if (fail_count > 0) {
          showToast({
            type: 'warning',
            title: 'Partial Success',
            message: `Deleted ${success_count} duplicates, ${fail_count} failed`
          });
        } else {
          showToast({
            type: 'success',
            title: 'Bulk Delete Complete',
            message: `Deleted ${success_count} duplicate(s) successfully`
          });
        }
        loadDuplicates();
        onDuplicatesChanged?.();
      } else {
        showToast({
          type: 'error',
          title: 'Bulk Delete Failed',
          message: result.error || 'Failed to delete duplicates'
        });
      }
    } catch (error) {
      console.error('Error bulk deleting duplicates:', error);
      showToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: 'Failed to delete duplicates'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading duplicate information...</p>
      </div>
    );
  }

  if (duplicateGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
        <p className="text-gray-600">Great! You don't have any duplicate resumes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Copy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-gray-900">Duplicate Resumes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.total_groups}</div>
            <div className="text-sm text-yellow-700">Duplicate Groups</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.total_duplicates}</div>
            <div className="text-sm text-red-700">Total Duplicates</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatFileSize(stats.potential_space_savings)}
            </div>
            <div className="text-sm text-blue-700">Potential Space Savings</div>
          </div>
        </div>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-4">
        {duplicateGroups.map((group) => (
          <div key={group.hash} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {group.count} identical files found
                    </h3>
                    <p className="text-sm text-gray-600">
                      Original: {group.original.filename}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleBulkDeleteGroup(group)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Duplicates
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Original */}
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">
                    {group.original.filename} <span className="text-sm text-green-600">(Original)</span>
                  </div>
                  {group.original.candidate_name && (
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <User className="w-3 h-3" />
                      {group.original.candidate_name}
                    </div>
                  )}
                  {group.original.candidate_email && (
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <Mail className="w-3 h-3" />
                      {group.original.candidate_email}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(group.original.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Duplicates */}
              {group.duplicates.map((duplicate) => (
                <div key={duplicate.id} className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <FileText className="w-8 h-8 text-red-600" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{duplicate.filename}</div>
                    {duplicate.candidate_name && (
                      <div className="flex items-center gap-1 text-sm text-red-700">
                        <User className="w-3 h-3" />
                        {duplicate.candidate_name}
                      </div>
                    )}
                    {duplicate.candidate_email && (
                      <div className="flex items-center gap-1 text-sm text-red-700">
                        <Mail className="w-3 h-3" />
                        {duplicate.candidate_email}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(duplicate.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDuplicate(duplicate.id, duplicate.filename)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
