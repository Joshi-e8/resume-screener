"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { KeyboardShortcutsProvider, CommonShortcuts } from "@/components/ui/KeyboardShortcuts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mobile sidebar state (for overlay)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Desktop sidebar state (for collapse)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    // On mobile: toggle overlay
    // On desktop: toggle collapse
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <KeyboardShortcutsProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <CommonShortcuts />
              <div className="min-h-screen bg-gray-50">
                <div className="flex">
                  {/* Sidebar */}
                  <DashboardSidebar
                    isMobileOpen={isMobileSidebarOpen}
                    isDesktopCollapsed={isDesktopSidebarCollapsed}
                    onClose={closeSidebar}
                  />

                  {/* Main Content */}
                  <div className="flex-1 flex flex-col min-h-screen">
                    {/* Header */}
                    <DashboardHeader onToggleSidebar={toggleSidebar} />

                    {/* Page Content */}
                    <main className="flex-1 p-6 lg:p-8">
                      {children}
                    </main>
                  </div>
                </div>
              </div>
            </ConfirmDialogProvider>
          </ToastProvider>
        </KeyboardShortcutsProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
