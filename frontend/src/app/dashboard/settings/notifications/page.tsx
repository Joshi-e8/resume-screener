"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Save, 
  Mail,
  Smartphone,
  Monitor,
  Users,
  Briefcase,
  BarChart3,
  Shield,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import Link from "next/link";

interface NotificationSettings {
  email: {
    newApplications: boolean;
    interviewReminders: boolean;
    teamUpdates: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  push: {
    newApplications: boolean;
    interviewReminders: boolean;
    teamUpdates: boolean;
    systemAlerts: boolean;
    urgentOnly: boolean;
  };
  inApp: {
    newApplications: boolean;
    interviewReminders: boolean;
    teamUpdates: boolean;
    systemAlerts: boolean;
    soundEnabled: boolean;
  };
  schedule: {
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
    weekendsEnabled: boolean;
    timezone: string;
  };
}

const initialSettings: NotificationSettings = {
  email: {
    newApplications: true,
    interviewReminders: true,
    teamUpdates: true,
    systemAlerts: true,
    weeklyReports: true,
    marketingEmails: false
  },
  push: {
    newApplications: true,
    interviewReminders: true,
    teamUpdates: false,
    systemAlerts: true,
    urgentOnly: false
  },
  inApp: {
    newApplications: true,
    interviewReminders: true,
    teamUpdates: true,
    systemAlerts: true,
    soundEnabled: true
  },
  schedule: {
    quietHoursEnabled: true,
    quietStart: '22:00',
    quietEnd: '08:00',
    weekendsEnabled: false,
    timezone: 'America/Los_Angeles'
  }
};



export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (category: keyof NotificationSettings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[typeof category]]
      }
    }));
  };

  const handleScheduleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log('Notification settings saved:', settings);
  };



  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Notification Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure how and when you receive notifications
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2 inline" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Notification Channels Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">Delivered to your inbox</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">Mobile and desktop alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">In-App Notifications</h3>
              <p className="text-sm text-gray-600">Within the dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-600 mt-1">Choose which notifications you want to receive for each channel</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Notification Type</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Push
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <Monitor className="w-4 h-4" />
                    In-App
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">New Applications</p>
                      <p className="text-sm text-gray-600">When someone applies to your jobs</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.newApplications}
                      onChange={() => handleToggle('email', 'newApplications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.newApplications}
                      onChange={() => handleToggle('push', 'newApplications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.inApp.newApplications}
                      onChange={() => handleToggle('inApp', 'newApplications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Interview Reminders</p>
                      <p className="text-sm text-gray-600">Upcoming interview notifications</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.interviewReminders}
                      onChange={() => handleToggle('email', 'interviewReminders')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.interviewReminders}
                      onChange={() => handleToggle('push', 'interviewReminders')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.inApp.interviewReminders}
                      onChange={() => handleToggle('inApp', 'interviewReminders')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Updates</p>
                      <p className="text-sm text-gray-600">Team member activities and updates</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.teamUpdates}
                      onChange={() => handleToggle('email', 'teamUpdates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.teamUpdates}
                      onChange={() => handleToggle('push', 'teamUpdates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.inApp.teamUpdates}
                      onChange={() => handleToggle('inApp', 'teamUpdates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">System Alerts</p>
                      <p className="text-sm text-gray-600">Important system and security notifications</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.systemAlerts}
                      onChange={() => handleToggle('email', 'systemAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.systemAlerts}
                      onChange={() => handleToggle('push', 'systemAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.inApp.systemAlerts}
                      onChange={() => handleToggle('inApp', 'systemAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Analytics and performance summaries</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.weeklyReports}
                      onChange={() => handleToggle('email', 'weeklyReports')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Schedule</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Quiet Hours</h3>
              <p className="text-sm text-gray-600">Pause non-urgent notifications during specified hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schedule.quietHoursEnabled}
                onChange={(e) => handleScheduleChange('quietHoursEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          {settings.schedule.quietHoursEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l-2 border-yellow-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  value={settings.schedule.quietStart}
                  onChange={(e) => handleScheduleChange('quietStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  value={settings.schedule.quietEnd}
                  onChange={(e) => handleScheduleChange('quietEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Weekend Notifications</h3>
              <p className="text-sm text-gray-600">Receive notifications on weekends</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schedule.weekendsEnabled}
                onChange={(e) => handleScheduleChange('weekendsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Sound Notifications</h3>
              <p className="text-sm text-gray-600">Play sound for in-app notifications</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.inApp.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inApp.soundEnabled}
                  onChange={() => handleToggle('inApp', 'soundEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Additional Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Emails</h3>
              <p className="text-sm text-gray-600">Receive product updates and marketing communications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email.marketingEmails}
                onChange={() => handleToggle('email', 'marketingEmails')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Urgent Only Mode</h3>
              <p className="text-sm text-gray-600">Only receive critical and urgent push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.push.urgentOnly}
                onChange={() => handleToggle('push', 'urgentOnly')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
