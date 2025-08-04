"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Search,
  Clock,
  User,
  FileText,
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Download
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'hire' | 'application' | 'job_posted' | 'report_generated' | 'interview' | 'system' | 'user_action';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'hire',
    title: 'New hire completed onboarding',
    description: 'John Smith successfully completed the onboarding process for Senior Frontend Developer position',
    user: 'Sarah Johnson',
    timestamp: '2024-01-20T14:30:00Z',
    metadata: { department: 'Engineering', position: 'Senior Frontend Developer' }
  },
  {
    id: '2',
    type: 'application',
    title: '45 new resume submissions',
    description: 'Received 45 new applications across 8 different job postings',
    user: 'System',
    timestamp: '2024-01-20T12:15:00Z',
    metadata: { count: 45, jobs: 8 }
  },
  {
    id: '3',
    type: 'interview',
    title: 'Interview scheduled',
    description: 'Technical interview scheduled for Product Manager role with candidate Jane Doe',
    user: 'Mike Chen',
    timestamp: '2024-01-20T10:45:00Z',
    metadata: { candidate: 'Jane Doe', position: 'Product Manager', type: 'Technical' }
  },
  {
    id: '4',
    type: 'job_posted',
    title: 'New job posting published',
    description: 'Data Scientist position has been published and is now accepting applications',
    user: 'Emily Davis',
    timestamp: '2024-01-19T16:20:00Z',
    metadata: { position: 'Data Scientist', department: 'Data' }
  },
  {
    id: '5',
    type: 'report_generated',
    title: 'Monthly hiring report generated',
    description: 'Automated monthly hiring performance report has been generated and sent to stakeholders',
    user: 'System',
    timestamp: '2024-01-19T09:00:00Z',
    metadata: { reportType: 'Monthly Hiring', recipients: 5 }
  },
  {
    id: '6',
    type: 'user_action',
    title: 'Candidate status updated',
    description: 'Moved candidate Alex Wilson from "Interview" to "Offer" stage for UX Designer position',
    user: 'Lisa Wang',
    timestamp: '2024-01-19T14:30:00Z',
    metadata: { candidate: 'Alex Wilson', from: 'Interview', to: 'Offer', position: 'UX Designer' }
  },
  {
    id: '7',
    type: 'system',
    title: 'System maintenance completed',
    description: 'Scheduled system maintenance and database optimization completed successfully',
    user: 'System',
    timestamp: '2024-01-19T02:00:00Z',
    metadata: { duration: '2 hours', type: 'maintenance' }
  },
  {
    id: '8',
    type: 'application',
    title: 'High-priority application received',
    description: 'Received application from senior candidate with 10+ years experience for Engineering Manager role',
    user: 'System',
    timestamp: '2024-01-18T15:45:00Z',
    metadata: { priority: 'high', experience: '10+ years', position: 'Engineering Manager' }
  }
];

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const filteredActivity = mockActivityData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const itemDate = new Date(item.timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      
      switch (dateFilter) {
        case 'today': return diffHours <= 24;
        case 'week': return diffHours <= 168; // 7 days
        case 'month': return diffHours <= 720; // 30 days
        default: return true;
      }
    })();
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hire': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'application': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'job_posted': return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'report_generated': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'interview': return <Users className="w-5 h-5 text-indigo-500" />;
      case 'user_action': return <User className="w-5 h-5 text-yellow-500" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'hire': return 'bg-green-50 border-green-200';
      case 'application': return 'bg-blue-50 border-blue-200';
      case 'job_posted': return 'bg-purple-50 border-purple-200';
      case 'report_generated': return 'bg-orange-50 border-orange-200';
      case 'interview': return 'bg-indigo-50 border-indigo-200';
      case 'user_action': return 'bg-yellow-50 border-yellow-200';
      case 'system': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const exportActivity = () => {
    const csv = [
      'Timestamp,Type,Title,Description,User',
      ...filteredActivity.map(item => 
        `"${item.timestamp}","${item.type}","${item.title}","${item.description}","${item.user}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/analytics"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Activity Log
          </h1>
          <p className="text-gray-600 mt-1">
            Track all system activities and user actions
          </p>
        </div>

        <button
          onClick={exportActivity}
          className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200"
        >
          <Download className="w-4 h-4 mr-2 inline" />
          Export Log
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="hire">Hires</option>
              <option value="application">Applications</option>
              <option value="job_posted">Job Postings</option>
              <option value="interview">Interviews</option>
              <option value="report_generated">Reports</option>
              <option value="user_action">User Actions</option>
              <option value="system">System</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <span className="text-sm text-gray-500">
              {filteredActivity.length} activities
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredActivity.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg border ${getActivityColor(item.type)}`}>
                  {getActivityIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{item.user}</span>
                    </div>
                    
                    {item.metadata && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivity.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">
              {searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No activities have been recorded yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
