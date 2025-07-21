"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Briefcase,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, description: "Overview and stats" },
  { name: "Resumes", href: "/dashboard/resumes", icon: FileText, description: "Manage resumes" },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, description: "Job postings" },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, description: "Performance metrics" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, description: "Account settings" },
];

interface DashboardSidebarProps {
  isMobileOpen?: boolean;
  isDesktopCollapsed?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  isMobileOpen = false,
  isDesktopCollapsed = false,
  onClose
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none",
          // Mobile states
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop width states
          isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile width
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={clsx(
            "flex items-center border-b border-gray-100 transition-all duration-300",
            isDesktopCollapsed ? "px-4 py-6 justify-center lg:justify-center" : "px-6 py-6"
          )}>
            <div className={clsx(
              "flex items-center",
              isDesktopCollapsed ? "lg:justify-center" : "space-x-3"
            )}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' }}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              {!isDesktopCollapsed && (
                <div className="lg:block hidden">
                  <h1 className="text-xl font-bold text-gray-900">Resume</h1>
                  <p className="text-sm font-semibold" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Screener</p>
                </div>
              )}
              {/* Always show on mobile */}
              <div className="lg:hidden block">
                <h1 className="text-xl font-bold text-gray-900">Resume</h1>
                <p className="text-sm font-semibold" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Screener</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={clsx(
            "flex-1 py-6 space-y-2",
            isDesktopCollapsed ? "px-2" : "px-4"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "group flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative",
                    isDesktopCollapsed ? "px-3 py-4 lg:justify-center" : "px-4 py-3",
                    isActive
                      ? "text-white shadow-lg hover:shadow-xl"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  )}
                  style={isActive ? { background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' } : {}}
                  title={isDesktopCollapsed ? item.name : undefined}
                >
                  <item.icon className={clsx(
                    "transition-all duration-200",
                    isDesktopCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  {!isDesktopCollapsed && (
                    <div className="lg:block hidden">
                      <div className="font-medium">{item.name}</div>
                      <div className={clsx(
                        "text-xs transition-colors duration-200",
                        isActive ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  )}
                  {/* Always show on mobile */}
                  <div className="lg:hidden block">
                    <div className="font-medium">{item.name}</div>
                    <div className={clsx(
                      "text-xs transition-colors duration-200",
                      isActive ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {/* Tooltip for collapsed state */}
                  {isDesktopCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg lg:block hidden">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-300">{item.description}</div>
                      <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={clsx(
            "border-t border-gray-100 transition-all duration-300",
            isDesktopCollapsed ? "px-4 py-4" : "px-6 py-4"
          )}>
            {!isDesktopCollapsed && (
              <p className="text-xs text-gray-500 text-center lg:block hidden">© 2024 Resume Screener</p>
            )}
            {/* Always show on mobile */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center lg:hidden block">© 2024 Resume Screener</p>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
