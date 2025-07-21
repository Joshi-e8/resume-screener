import { FileText, Users, Briefcase, CheckCircle } from "lucide-react";
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {currentActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500">
              Activity will appear here as you use the platform
            </p>
          </div>
        ) : (
          currentActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 transition-all duration-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
