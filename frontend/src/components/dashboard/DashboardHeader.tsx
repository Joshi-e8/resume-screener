"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, User, Settings, ChevronDown, Mail, Shield, Menu } from "lucide-react";
// import { Moon, Sun } from "lucide-react"; // Commented out for theme toggle
import { showToast } from "@/utils/toast";

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  // const [isDarkMode, setIsDarkMode] = useState(false); // Commented out for theme toggle

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Theme loading commented out for now
  /*
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);
  */

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock user data for now
  const mockUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    image: null,
    role: "HR Manager",
    company: "TechCorp Inc.",
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "New resume uploaded",
      message: "Sarah Johnson - Frontend Developer",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: 2,
      title: "High match found",
      message: "95% match for Senior Developer position",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Interview scheduled",
      message: "Meeting with Alex Chen tomorrow at 2 PM",
      time: "3 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSignOut = async () => {
    try {
      showToast.success("Successfully signed out!");
      // For now, just redirect to home
      window.location.href = "/";
    } catch {
      showToast.error("Failed to sign out. Please try again.");
    }
  };

  // Theme toggle function commented out for now
  /*
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    showToast.info(`Switched to ${isDarkMode ? 'light' : 'dark'} mode`);
  };
  */

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Side - Hamburger + Welcome Message */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Welcome Message - Desktop */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900">
              Good morning, {mockUser.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-gray-600">
              {mockUser.role} at {mockUser.company}
            </p>
          </div>

          {/* Welcome Message - Mobile */}
          <div className="lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              Hi, {mockUser.name.split(' ')[0]}! 👋
            </h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle - Commented out for now, will be implemented in final phase */}
          {/*
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          */}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold text-white rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">{unreadCount} unread messages</p>
                </div>
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notification.unread ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.unread ? 'bg-blue-400' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {mockUser.name || "User"}
                </p>
                <p className="text-xs text-gray-600">
                  {mockUser.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors hidden md:block" />
            </button>

            {/* Enhanced Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50">
                {/* Profile Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' }}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {mockUser.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {mockUser.role}
                      </p>
                      <div className="flex items-center mt-1">
                        <Mail className="w-3 h-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {mockUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      showToast.info('Profile settings coming soon!');
                    }}
                    className="w-full flex items-center px-6 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Profile Settings</div>
                      <div className="text-xs text-gray-500">Manage your account</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      showToast.info('Account settings coming soon!');
                    }}
                    className="w-full flex items-center px-6 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Account Settings</div>
                      <div className="text-xs text-gray-500">Preferences & privacy</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      showToast.info('Security settings coming soon!');
                    }}
                    className="w-full flex items-center px-6 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-3 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Security</div>
                      <div className="text-xs text-gray-500">Password & 2FA</div>
                    </div>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-6 py-3 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Sign Out</div>
                      <div className="text-xs text-red-500">End your session</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
