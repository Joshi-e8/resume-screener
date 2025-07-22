"use client";

import { ReactNode } from "react";
import { Search, FileText, Users, Briefcase, BarChart3, Upload, Filter } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'search' | 'upload' | 'data' | 'team' | 'jobs' | 'analytics' | 'filter';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const illustrations = {
  search: (
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
  ),
  upload: (
    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
      <Upload className="w-12 h-12 text-blue-500" />
    </div>
  ),
  data: (
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <FileText className="w-12 h-12 text-green-500" />
    </div>
  ),
  team: (
    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
      <Users className="w-12 h-12 text-purple-500" />
    </div>
  ),
  jobs: (
    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
      <Briefcase className="w-12 h-12 text-yellow-500" />
    </div>
  ),
  analytics: (
    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
      <BarChart3 className="w-12 h-12 text-red-500" />
    </div>
  ),
  filter: (
    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
      <Filter className="w-12 h-12 text-orange-500" />
    </div>
  )
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'md',
  className = ""
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const descriptionSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`text-center ${sizeClasses[size]} ${className}`}>
      {/* Icon or Illustration */}
      {illustration && illustrations[illustration]}
      {icon && !illustration && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className={`font-semibold text-gray-900 mb-2 ${titleSizes[size]}`}>
          {title}
        </h3>
        <p className={`text-gray-600 mb-6 ${descriptionSizes[size]}`}>
          {description}
        </p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors duration-200
                  ${action.variant === 'secondary'
                    ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    : 'text-white bg-yellow-500 hover:bg-yellow-600'
                  }
                `}
              >
                {action.label}
              </button>
            )}
            
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-200"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Pre-built empty states for common scenarios
export function NoSearchResults({ 
  query, 
  onClearSearch 
}: { 
  query: string; 
  onClearSearch: () => void; 
}) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: "Clear search",
        onClick: onClearSearch,
        variant: 'secondary'
      }}
    />
  );
}

export function NoData({ 
  title = "No data available",
  description = "There's no data to display at the moment.",
  actionLabel,
  onAction
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      illustration="data"
      title={title}
      description={description}
      action={actionLabel && onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined}
    />
  );
}

export function NoResumes({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      illustration="upload"
      title="No resumes uploaded yet"
      description="Start building your talent pool by uploading resumes. You can upload individual files or bulk import from a ZIP archive."
      action={{
        label: "Upload resumes",
        onClick: onUpload
      }}
      secondaryAction={{
        label: "Learn more",
        onClick: () => console.log('Learn more clicked')
      }}
    />
  );
}

export function NoJobs({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      illustration="jobs"
      title="No job postings yet"
      description="Create your first job posting to start attracting candidates and building your talent pipeline."
      action={{
        label: "Create job posting",
        onClick: onCreate
      }}
    />
  );
}

export function NoTeamMembers({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      illustration="team"
      title="No team members yet"
      description="Invite team members to collaborate on hiring and manage candidates together."
      action={{
        label: "Invite team members",
        onClick: onInvite
      }}
    />
  );
}

export function NoAnalytics() {
  return (
    <EmptyState
      illustration="analytics"
      title="No analytics data"
      description="Analytics data will appear here once you have some hiring activity. Upload resumes and create jobs to get started."
      size="sm"
    />
  );
}

export function NoFilterResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      illustration="filter"
      title="No results match your filters"
      description="Try adjusting your filter criteria to see more results."
      action={{
        label: "Clear filters",
        onClick: onClearFilters,
        variant: 'secondary'
      }}
      size="sm"
    />
  );
}

// Error states
export function ErrorState({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-white font-bold">!</span>
      </div>}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Try again",
        onClick: onRetry
      } : undefined}
    />
  );
}

// Loading placeholder
export function LoadingState({ 
  title = "Loading...",
  description = "Please wait while we fetch your data."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={
        <div className="w-8 h-8 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin" />
      }
      title={title}
      description={description}
      size="sm"
    />
  );
}
