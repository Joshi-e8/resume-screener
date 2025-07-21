"use client";

import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InteractiveChart, resumeAnalyticsData, skillsAnalyticsData } from "@/components/dashboard/InteractiveChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
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
