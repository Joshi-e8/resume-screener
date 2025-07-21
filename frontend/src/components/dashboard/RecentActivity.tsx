import { FileText, Users, Briefcase, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: 'resume_uploaded' | 'match_found' | 'job_created' | 'review_completed';
  message: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
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
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-dark">
          Recent Activity
        </h2>
        <button className="text-sm text-accent-pink hover:text-accent-pink/80 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-text-light" />
            </div>
            <p className="text-text-gray">No recent activity</p>
            <p className="text-sm text-text-light">
              Activity will appear here as you use the platform
            </p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-dark">
                    {activity.message}
                  </p>
                  <p className="text-xs text-text-light mt-1">
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
