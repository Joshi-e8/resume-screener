"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { setStats, setRecentActivity } from "@/store/slices/dashboardSlice";
import { MOCK_USER_DATA } from "@/lib/auth";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { stats, recentActivity } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    // Load mock data (in real app, this would be API calls)
    dispatch(setStats({
      totalResumes: MOCK_USER_DATA.totalResumes,
      activeJobs: MOCK_USER_DATA.activeJobs,
      totalMatches: MOCK_USER_DATA.totalMatches,
      pendingReviews: MOCK_USER_DATA.pendingReviews,
    }));
    
    dispatch(setRecentActivity(MOCK_USER_DATA.recentActivity));
  }, [dispatch]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your resume screening.
        </p>
      </div>

      {/* Search Component */}
      <DashboardSearch />

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
