"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Download,
  Calendar,
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import Link from "next/link";

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'hiring' | 'performance' | 'pipeline' | 'custom';
  createdBy: string;
  createdAt: string;
  lastRun: string;
  status: 'ready' | 'running' | 'scheduled';
  views: number;
  isShared: boolean;
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Monthly Hiring Report',
    description: 'Comprehensive overview of hiring metrics and performance',
    type: 'hiring',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-01-15',
    lastRun: '2024-01-20',
    status: 'ready',
    views: 45,
    isShared: true
  },
  {
    id: '2',
    name: 'Department Performance Analysis',
    description: 'Performance metrics broken down by department',
    type: 'performance',
    createdBy: 'Mike Chen',
    createdAt: '2024-01-10',
    lastRun: '2024-01-19',
    status: 'ready',
    views: 32,
    isShared: false
  },
  {
    id: '3',
    name: 'Candidate Pipeline Funnel',
    description: 'Detailed analysis of candidate progression through hiring stages',
    type: 'pipeline',
    createdBy: 'Emily Davis',
    createdAt: '2024-01-12',
    lastRun: '2024-01-18',
    status: 'scheduled',
    views: 28,
    isShared: true
  },
  {
    id: '4',
    name: 'Skills Gap Analysis',
    description: 'Analysis of skill requirements vs available talent',
    type: 'custom',
    createdBy: 'John Smith',
    createdAt: '2024-01-08',
    lastRun: '2024-01-17',
    status: 'running',
    views: 19,
    isShared: false
  }
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hiring': return <Users className="w-4 h-4" />;
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      case 'pipeline': return <BarChart3 className="w-4 h-4" />;
      case 'custom': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hiring': return 'bg-blue-100 text-blue-700';
      case 'performance': return 'bg-green-100 text-green-700';
      case 'pipeline': return 'bg-purple-100 text-purple-700';
      case 'custom': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReportAction = (reportId: string, action: string) => {
    setActiveMenu(null);
    console.log(`Report ${reportId}: ${action}`);
    // TODO: Implement report actions
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
            Custom Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage custom analytics reports
          </p>
        </div>

        <Link
          href="/dashboard/analytics/reports/create"
          className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Create Report
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="hiring">Hiring Reports</option>
              <option value="performance">Performance Reports</option>
              <option value="pipeline">Pipeline Reports</option>
              <option value="custom">Custom Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === report.id ? null : report.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {activeMenu === report.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <div className="py-1">
                          <button
                            onClick={() => handleReportAction(report.id, 'edit')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Report
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'duplicate')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'download')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => handleReportAction(report.id, 'delete')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <Link
                  href={`/dashboard/analytics/reports/${report.id}`}
                  className="block group-hover:text-yellow-600 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {report.name}
                  </h3>
                </Link>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {report.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Last run: {new Date(report.lastRun).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{report.views} views</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  By {report.createdBy}
                </div>
                
                <div className="flex items-center gap-2">
                  {report.isShared && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Shared
                    </span>
                  )}
                  <Link
                    href={`/dashboard/analytics/reports/${report.id}`}
                    className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                  >
                    View Report →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first custom report.'
              }
            </p>
            {!searchQuery && typeFilter === 'all' && (
              <Link
                href="/dashboard/analytics/reports/create"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Report
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
