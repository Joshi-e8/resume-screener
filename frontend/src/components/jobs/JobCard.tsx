"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Eye, 
  MoreHorizontal, 
  Edit, 
  Pause, 
  Play, 
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Job, jobStatuses } from "@/data/mockJobs";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: Job;
  onAction: (jobId: string, action: string) => void;
}

export function JobCard({ job, onAction }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = jobStatuses.find(s => s.value === job.status);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    onAction(job.id, action);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
              {statusConfig?.label}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {job.type.replace('-', ' ')}
            </span>
          </div>
          
          <Link 
            href={`/dashboard/jobs/${job.id}`}
            className="block group-hover:text-yellow-600 transition-colors duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {job.title}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-600 mb-2">{job.department}</p>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <Link
                    href={`/dashboard/jobs/${job.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Job
                  </Link>
                  
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowMenu(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </Link>

                  <button
                    onClick={() => handleMenuAction('duplicate')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>

                  {job.status === 'active' ? (
                    <button
                      onClick={() => handleMenuAction('pause')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pause className="w-4 h-4" />
                      Pause Job
                    </button>
                  ) : job.status === 'paused' ? (
                    <button
                      onClick={() => handleMenuAction('activate')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Play className="w-4 h-4" />
                      Activate Job
                    </button>
                  ) : null}

                  <div className="border-t border-gray-100 my-1" />
                  
                  <button
                    onClick={() => handleMenuAction('delete')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Job
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}</span>
        </div>

        <div className="text-sm font-medium text-gray-900">
          {formatSalary(job.salary)}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{job.applicants} applicants</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{job.views} views</span>
          </div>
        </div>

        <Link
          href={`/dashboard/jobs/${job.id}/applicants`}
          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
        >
          View Applicants
        </Link>
      </div>
    </div>
  );
}
