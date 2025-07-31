"use client";

import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { EnhancedStatsCard, PlatformStatsCard } from "@/components/dashboard/EnhancedStatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InteractiveChart, resumeAnalyticsData, skillsAnalyticsData } from "@/components/dashboard/InteractiveChart";
import { ExternalJobWorkflowGuide } from "@/components/dashboard/ExternalJobWorkflowGuide";
import { AIScreeningFeatures } from "@/components/dashboard/AIScreeningFeatures";
import { CompleteEcosystem } from "@/components/dashboard/CompleteEcosystem";
import { useToast } from "@/components/ui/Toast";
import { useShortcut } from "@/components/ui/KeyboardShortcuts";
import { InfoTooltip } from "@/components/ui/Tooltip";

export default function DashboardPage() {
  const { showToast } = useToast();

  // Keyboard shortcuts
  useShortcut('ctrl+n', () => {
    showToast({
      type: 'info',
      title: 'Quick Action',
      message: 'Use Ctrl+N to create new items quickly!'
    });
  }, {
    description: 'Show quick actions',
    category: 'Dashboard',
    dependencies: [showToast]
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Hire Top Candidates Faster with AI
            </h1>
            <InfoTooltip content="AI-powered recruiting software that automates screening and matches the right candidates to jobs." />
          </div>
          <p className="text-gray-600 mt-1">
            Source from LinkedIn/Indeed → AI Screen & Match → Hire the Best Candidates
          </p>

          {/* 3-Step Process Indicator */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <span className="text-gray-700 font-medium">Source</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <span className="text-gray-700 font-medium">Screen</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
              <span className="text-gray-700 font-medium">Hire</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <DashboardSearch />

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCard />

      {/* Platform Performance */}
      <PlatformStatsCard />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InteractiveChart
          title="Resume Pipeline"
          data={resumeAnalyticsData}
          type="bar"
        />
        <InteractiveChart
          title="Top Skills"
          data={skillsAnalyticsData}
          type="bar"
        />
      </div>

      {/* AI-Powered Screening Features */}
      <AIScreeningFeatures />

      {/* Complete Ecosystem Overview */}
      <CompleteEcosystem />

      {/* External Job Posting Workflow Guide */}
      <ExternalJobWorkflowGuide />

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}
