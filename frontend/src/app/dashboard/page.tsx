"use client";

import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InteractiveChart, resumeAnalyticsData, skillsAnalyticsData } from "@/components/dashboard/InteractiveChart";
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
              Dashboard
            </h1>
            <InfoTooltip content="Your main dashboard showing key metrics and recent activity. Use keyboard shortcuts for quick navigation." />
          </div>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your resume screening.
          </p>
        </div>
      </div>

      {/* Search Component */}
      <DashboardSearch />

      {/* Stats Cards */}
      <DashboardStats />

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

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}
