"use client";

import { useState } from "react";
import { FileText, Users, Briefcase, CheckCircle, Clock, MoreHorizontal, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: 'resume_uploaded' | 'match_found' | 'job_created' | 'review_completed';
  message: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'resume_uploaded':
      return FileText;
    case 'match_found':
      return Users;
    case 'job_created':
      return Briefcase;
    case 'review_completed':
      return CheckCircle;
    default:
      return FileText;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'resume_uploaded':
      return 'text-blue-600 bg-blue-50';
    case 'match_found':
      return 'text-green-600 bg-green-50';
    case 'job_created':
      return 'text-purple-600 bg-purple-50';
    case 'review_completed':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function RecentActivity({ activities }: RecentActivityProps) {
  const [filter, setFilter] = useState<'all' | ActivityItem['type']>('all');

  // Default activities if none provided
  const defaultActivities: ActivityItem[] = [
    {
      id: 1,
      type: 'resume_uploaded',
      message: 'New resume uploaded: John Smith - Software Engineer',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      type: 'match_found',
      message: 'Match found for Senior Developer position',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: 3,
      type: 'job_created',
      message: 'New job posting: Frontend Developer',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
    {
      id: 4,
      type: 'review_completed',
      message: 'Resume review completed for Sarah Johnson',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
  ];

  const currentActivities = activities || defaultActivities;
  const filteredActivities = filter === 'all'
    ? currentActivities
    : currentActivities.filter(activity => activity.type === filter);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'resume_uploaded' | 'match_found' | 'job_created' | 'review_completed')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="resume_uploaded">Uploads</option>
            <option value="match_found">Matches</option>
            <option value="job_created">Jobs</option>
            <option value="review_completed">Reviews</option>
          </select>
          <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200">
            View All →
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600">No activities found</p>
            <p className="text-sm text-gray-500">
              {filter === 'all' ? 'Activity will appear here as you use the platform' : 'No activities match the selected filter'}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group cursor-pointer"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className={`p-2 rounded-lg ${colorClasses} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                      {activity.message}
                    </p>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all duration-200">
                      <MoreHorizontal className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
