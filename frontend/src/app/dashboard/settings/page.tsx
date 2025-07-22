"use client";

import { useState } from "react";
import { 
  User, 
  Building2, 
  Users, 
  Key, 
  Bell, 
  Shield, 
  CreditCard, 
  Palette,
  Globe,
  ChevronRight,
  Settings as SettingsIcon,
  Check,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status?: 'complete' | 'incomplete' | 'warning';
  badge?: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Manage your personal profile, password, and account preferences',
    icon: User,
    href: '/dashboard/settings/account',
    status: 'complete'
  },
  {
    id: 'company',
    title: 'Company Settings',
    description: 'Configure your organization details, branding, and company information',
    icon: Building2,
    href: '/dashboard/settings/company',
    status: 'incomplete'
  },
  {
    id: 'team',
    title: 'Team Management',
    description: 'Manage team members, roles, permissions, and user access',
    icon: Users,
    href: '/dashboard/settings/team',
    status: 'complete',
    badge: '5 members'
  },
  {
    id: 'integrations',
    title: 'Integrations & API',
    description: 'Connect third-party services and manage API keys',
    icon: Key,
    href: '/dashboard/settings/integrations',
    status: 'warning',
    badge: '3 connected'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure email alerts, push notifications, and communication preferences',
    icon: Bell,
    href: '/dashboard/settings/notifications',
    status: 'complete'
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Manage security settings, two-factor authentication, and privacy controls',
    icon: Shield,
    href: '/dashboard/settings/security',
    status: 'warning'
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    description: 'View your subscription, usage, and manage payment methods',
    icon: CreditCard,
    href: '/dashboard/settings/billing',
    status: 'complete',
    badge: 'Pro Plan'
  },
  {
    id: 'preferences',
    title: 'System Preferences',
    description: 'Customize theme, language, timezone, and display preferences',
    icon: Palette,
    href: '/dashboard/settings/preferences',
    status: 'complete'
  }
];

const quickStats = [
  { label: 'Team Members', value: '5', change: '+1 this month' },
  { label: 'API Calls', value: '12.4K', change: 'This month' },
  { label: 'Storage Used', value: '2.1 GB', change: 'of 10 GB' },
  { label: 'Active Integrations', value: '3', change: 'Connected' }
];

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = settingsSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'incomplete':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'incomplete':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-yellow-500" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account, team, and system preferences
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <SettingsIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className={`block p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group ${getStatusColor(section.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <section.icon className="w-6 h-6 text-gray-700" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors duration-200">
                      {section.title}
                    </h3>
                    {getStatusIcon(section.status)}
                    {section.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 transition-colors duration-200 flex-shrink-0 ml-2" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/settings/team/invite"
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-blue-600">Invite Team Member</p>
              <p className="text-xs text-gray-500">Add new user</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings/integrations"
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-green-600">Generate API Key</p>
              <p className="text-xs text-gray-500">Create new key</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings/security"
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-purple-600">Enable 2FA</p>
              <p className="text-xs text-gray-500">Secure account</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings/billing"
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-orange-600">Upgrade Plan</p>
              <p className="text-xs text-gray-500">View options</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Settings Changes</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Password updated</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New team member added</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">API key generated</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
