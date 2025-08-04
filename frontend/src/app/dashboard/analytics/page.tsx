"use client";

import { useState } from "react";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Users,
  Target,
  Clock,
  Award
} from "lucide-react";
import Link from "next/link";
import { 
  mockAnalyticsMetrics, 
  mockAnalyticsCharts, 
  mockHiringFunnel, 
  mockTopPerformers,
  timePeriods,
  exportFormats 
} from "@/data/mockAnalytics";
import {
  AnalyticsMetricCard,
  AnalyticsChartComponent,
  HiringFunnelChart,
  TopPerformersCard
} from "@/components/analytics";

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format: string) => {
    console.log(`Exporting analytics in ${format} format`);
    setShowExportMenu(false);
    // TODO: Implement actual export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Track your hiring performance and key metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
          >
            {timePeriods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105"
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    {exportFormats.map(format => (
                      <button
                        key={format.value}
                        onClick={() => handleExport(format.value)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Link
            href="/dashboard/analytics/reports"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            Custom Reports
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {mockAnalyticsMetrics.map((metric) => (
          <AnalyticsMetricCard
            key={metric.id}
            metric={metric}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {mockAnalyticsCharts.map((chart) => (
          <AnalyticsChartComponent
            key={chart.id}
            chart={chart}
          />
        ))}
      </div>

      {/* Hiring Funnel and Top Performers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HiringFunnelChart
          data={mockHiringFunnel}
          title="Hiring Funnel"
          period={selectedPeriod}
        />
        
        <TopPerformersCard
          performers={mockTopPerformers}
          title="Top Performers"
          period={selectedPeriod}
        />
      </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-yellow-500" />
          Quick Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Best Performing Job</h3>
            <p className="text-sm text-gray-600">Senior Frontend Developer</p>
            <p className="text-xs text-blue-600 font-medium mt-1">89 applications</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Fastest Hire</h3>
            <p className="text-sm text-gray-600">UX Designer Position</p>
            <p className="text-xs text-green-600 font-medium mt-1">8 days</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Top Source</h3>
            <p className="text-sm text-gray-600">LinkedIn</p>
            <p className="text-xs text-purple-600 font-medium mt-1">42% of hires</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Quality Score</h3>
            <p className="text-sm text-gray-600">Candidate Match Rate</p>
            <p className="text-xs text-orange-600 font-medium mt-1">87% accuracy</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-500" />
          Recent Activity Summary
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New hire completed onboarding</span>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">45 new resumes submitted</span>
            </div>
            <span className="text-xs text-gray-500">4 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Interview scheduled for Product Manager role</span>
            </div>
            <span className="text-xs text-gray-500">6 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New job posting published: Data Scientist</span>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/analytics/activity"
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
          >
            View All Activity →
          </Link>
        </div>
      </div>
    </div>
  );
}
