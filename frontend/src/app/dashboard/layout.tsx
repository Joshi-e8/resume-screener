"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { KeyboardShortcutsProvider, CommonShortcuts } from "@/components/ui/KeyboardShortcuts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
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
  );
}
