"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar, 
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Settings,
  Mail,
  Filter
} from "lucide-react";
import Link from "next/link";
import { AnalyticsChartComponent, AnalyticsMetricCard, DataTable } from "@/components/analytics";
import { mockAnalyticsMetrics, mockAnalyticsCharts } from "@/data/mockAnalytics";

// Mock report data
const mockReportData = {
  id: '1',
  name: 'Monthly Hiring Report',
  description: 'Comprehensive overview of hiring metrics and performance for January 2024',
  type: 'hiring',
  createdBy: 'Sarah Johnson',
  createdAt: '2024-01-15',
  lastRun: '2024-01-20T10:30:00Z',
  nextRun: '2024-02-01T09:00:00Z',
  status: 'ready',
  isScheduled: true,
  recipients: ['hr@company.com', 'manager@company.com'],
  filters: {
    dateRange: 'last-30-days',
    departments: ['Engineering', 'Product', 'Design'],
    jobTypes: ['full-time', 'contract']
  }
};

const mockTableData = [
  { id: 1, department: 'Engineering', applications: 156, interviews: 45, hires: 12, conversionRate: '7.7%' },
  { id: 2, department: 'Product', applications: 89, interviews: 28, hires: 8, conversionRate: '9.0%' },
  { id: 3, department: 'Design', applications: 67, interviews: 22, hires: 6, conversionRate: '9.0%' },
  { id: 4, department: 'Marketing', applications: 45, interviews: 15, hires: 4, conversionRate: '8.9%' },
  { id: 5, department: 'Sales', applications: 34, interviews: 12, hires: 3, conversionRate: '8.8%' }
];

export default function ReportDetailPage() {
  const params = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const reportId = params.id as string;
  const report = mockReportData; // In real app, fetch by reportId

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting report in ${format} format`);
    // TODO: Implement export functionality
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report not found</h2>
          <p className="text-gray-600 mb-4">The report you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/analytics/reports"
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/analytics/reports"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {report.name}
            </h1>
            <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              {report.status}
            </span>
          </div>
          <p className="text-gray-600">
            {report.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date(report.lastRun).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Created by {report.createdBy}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 inline ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Share2 className="w-4 h-4 mr-2 inline" />
            Share
          </button>

          <div className="relative group">
            <button className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200">
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>
            
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
              <div className="py-1">
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  PDF Report
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Excel Spreadsheet
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  CSV Data
                </button>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/analytics/reports/${reportId}/edit`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            Configure
          </Link>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Report Period</p>
              <p className="font-semibold text-gray-900">Last 30 days</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Data Points</p>
              <p className="font-semibold text-gray-900">1,247 records</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="font-semibold text-gray-900">{report.filters.departments.length} selected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="font-semibold text-green-600">+12.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {mockAnalyticsMetrics.map((metric) => (
            <AnalyticsMetricCard
              key={metric.id}
              metric={metric}
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visual Analysis</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {mockAnalyticsCharts.slice(0, 2).map((chart) => (
            <AnalyticsChartComponent
              key={chart.id}
              chart={chart}
            />
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Data</h2>
        <DataTable
          data={mockTableData}
          columns={[
            { key: 'department', label: 'Department', sortable: true },
            { key: 'applications', label: 'Applications', sortable: true },
            { key: 'interviews', label: 'Interviews', sortable: true },
            { key: 'hires', label: 'Hires', sortable: true },
            { key: 'conversionRate', label: 'Conversion Rate', sortable: true }
          ]}
        />
      </div>

      {/* Schedule Info */}
      {report.isScheduled && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Scheduled Report</h3>
              <p className="text-sm text-blue-700">This report runs automatically</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-600 mb-1">Next Run</p>
              <p className="font-medium text-blue-900">{new Date(report.nextRun).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 mb-1">Recipients</p>
              <div className="flex flex-wrap gap-2">
                {report.recipients.map((email, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowShareModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Report</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Recipients
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email addresses..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500" />
                    <span className="text-sm text-gray-700">Include raw data</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log('Sharing report...');
                      setShowShareModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4 mr-2 inline" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
