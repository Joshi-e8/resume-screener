"use client";

import { useState, ReactNode } from "react";
import { Check, ChevronDown, X, Download, Trash2, Archive, Tag, Mail, UserPlus } from "lucide-react";

interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (selectedItems: unknown[]) => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface BulkActionsProps {
  selectedItems: unknown[];
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  actions,
  className = ""
}: BulkActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (selectedItems.length === 0) {
    return null;
  }

  const isAllSelected = selectedItems.length === totalItems;

  const handleActionClick = (action: BulkAction) => {
    if (action.disabled) return;
    action.onClick(selectedItems);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={isAllSelected ? onClearSelection : onSelectAll}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              {selectedItems.length > 0 && selectedItems.length < totalItems && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 bg-yellow-500 rounded-sm" />
                </div>
              )}
            </div>
            
            <span className="text-sm font-medium text-gray-900">
              {selectedItems.length} of {totalItems} selected
            </span>
          </div>

          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Clear selection
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Primary actions (first 2-3 actions shown as buttons) */}
          {actions.slice(0, 2).map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={`
                flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                ${action.destructive
                  ? 'text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                }
                disabled:cursor-not-allowed
              `}
            >
              {action.icon && <div className="w-4 h-4">{action.icon}</div>}
              {action.label}
            </button>
          ))}

          {/* More actions dropdown */}
          {actions.length > 2 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                More
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    {actions.slice(2).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        disabled={action.disabled}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors duration-200
                          ${action.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : action.destructive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {action.icon && <div className="w-4 h-4">{action.icon}</div>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClearSelection}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

// Pre-built bulk actions for common scenarios
export function useResumeBulkActions() {
  return {
    download: (onDownload: (items: unknown[]) => void): BulkAction => ({
      id: 'download',
      label: 'Download',
      icon: <Download className="w-4 h-4" />,
      onClick: onDownload
    }),

    archive: (onArchive: (items: unknown[]) => void): BulkAction => ({
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: onArchive
    }),

    tag: (onTag: (items: unknown[]) => void): BulkAction => ({
      id: 'tag',
      label: 'Add Tags',
      icon: <Tag className="w-4 h-4" />,
      onClick: onTag
    }),

    delete: (onDelete: (items: unknown[]) => void): BulkAction => ({
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      destructive: true
    })
  };
}

export function useJobBulkActions() {
  return {
    archive: (onArchive: (items: unknown[]) => void): BulkAction => ({
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: onArchive
    }),

    publish: (onPublish: (items: unknown[]) => void): BulkAction => ({
      id: 'publish',
      label: 'Publish',
      icon: <Check className="w-4 h-4" />,
      onClick: onPublish
    }),

    delete: (onDelete: (items: unknown[]) => void): BulkAction => ({
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      destructive: true
    })
  };
}

export function useCandidateBulkActions() {
  return {
    email: (onEmail: (items: unknown[]) => void): BulkAction => ({
      id: 'email',
      label: 'Send Email',
      icon: <Mail className="w-4 h-4" />,
      onClick: onEmail
    }),

    invite: (onInvite: (items: unknown[]) => void): BulkAction => ({
      id: 'invite',
      label: 'Invite to Interview',
      icon: <UserPlus className="w-4 h-4" />,
      onClick: onInvite
    }),

    reject: (onReject: (items: unknown[]) => void): BulkAction => ({
      id: 'reject',
      label: 'Reject',
      icon: <X className="w-4 h-4" />,
      onClick: onReject,
      destructive: true
    }),

    archive: (onArchive: (items: unknown[]) => void): BulkAction => ({
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: onArchive
    })
  };
}

// Floating bulk actions bar (sticks to bottom of screen)
interface FloatingBulkActionsProps extends BulkActionsProps {
  show: boolean;
}

export function FloatingBulkActions({
  show,
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  actions,
  className = ""
}: FloatingBulkActionsProps) {
  if (!show || selectedItems.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <BulkActions
          selectedItems={selectedItems}
          totalItems={totalItems}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          actions={actions}
        />
      </div>
    </div>
  );
}

// Compact bulk actions for smaller spaces
interface CompactBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

export function CompactBulkActions({
  selectedCount,
  onClearSelection,
  actions,
  className = ""
}: CompactBulkActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">
        {selectedCount} selected
      </span>

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
        >
          Actions
          <ChevronDown className="w-3 h-3" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick([]);
                    setIsDropdownOpen(false);
                  }}
                  disabled={action.disabled}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-200
                    ${action.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : action.destructive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {action.icon && <div className="w-3 h-3">{action.icon}</div>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
