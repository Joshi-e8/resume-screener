"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Save, 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Globe, 

  Eye,
  Layout,
  Zap,
  Database,
  Download,
  Upload,
  RotateCcw
} from "lucide-react";
import Link from "next/link";

interface SystemPreferences {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    compactMode: boolean;
    animations: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  localization: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;
    numberFormat: string;
  };
  dashboard: {
    defaultView: 'grid' | 'list';
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
    showWelcomeMessage: boolean;
    sidebarCollapsed: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    usageData: boolean;
    marketingCookies: boolean;
  };
  advanced: {
    developerMode: boolean;
    debugMode: boolean;
    experimentalFeatures: boolean;
    apiTimeout: number;
  };
}

const initialPreferences: SystemPreferences = {
  appearance: {
    theme: 'light',
    primaryColor: '#F59E0B',
    compactMode: false,
    animations: true,
    fontSize: 'medium'
  },
  localization: {
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    numberFormat: 'en-US'
  },
  dashboard: {
    defaultView: 'grid',
    itemsPerPage: 20,
    autoRefresh: true,
    refreshInterval: 30,
    showWelcomeMessage: true,
    sidebarCollapsed: false
  },
  privacy: {
    analytics: true,
    crashReports: true,
    usageData: false,
    marketingCookies: false
  },
  advanced: {
    developerMode: false,
    debugMode: false,
    experimentalFeatures: false,
    apiTimeout: 30
  }
};

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' }
];

const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

const currencies = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' }
];

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<SystemPreferences>(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (section: keyof SystemPreferences, field: string, value: string | number | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log('Preferences saved:', preferences);
  };

  const handleReset = () => {
    setPreferences(initialPreferences);
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preferences.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setPreferences(imported);
          } catch {
            console.error('Invalid settings file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
            System Preferences
          </h1>
          <p className="text-gray-600 mt-1">
            Customize your dashboard experience and system settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2 inline" />
            Reset
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-600">Customize the look and feel of your dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleChange('appearance', 'theme', 'light')}
                className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                  preferences.appearance.theme === 'light'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                <span className="text-sm font-medium">Light</span>
              </button>
              
              <button
                onClick={() => handleChange('appearance', 'theme', 'dark')}
                className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                  preferences.appearance.theme === 'dark'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-2 text-gray-700" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              
              <button
                onClick={() => handleChange('appearance', 'theme', 'system')}
                className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                  preferences.appearance.theme === 'system'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Monitor className="w-5 h-5 mx-auto mb-2 text-gray-700" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={preferences.appearance.primaryColor}
                onChange={(e) => handleChange('appearance', 'primaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={preferences.appearance.primaryColor}
                onChange={(e) => handleChange('appearance', 'primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              value={preferences.appearance.fontSize}
              onChange={(e) => handleChange('appearance', 'fontSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Compact Mode</h3>
                <p className="text-sm text-gray-600">Reduce spacing and padding</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.appearance.compactMode}
                  onChange={(e) => handleChange('appearance', 'compactMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Animations</h3>
                <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.appearance.animations}
                  onChange={(e) => handleChange('appearance', 'animations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Localization Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Localization</h2>
            <p className="text-sm text-gray-600">Configure language, timezone, and regional settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={preferences.localization.language}
              onChange={(e) => handleChange('localization', 'language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={preferences.localization.timezone}
              onChange={(e) => handleChange('localization', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={preferences.localization.dateFormat}
              onChange={(e) => handleChange('localization', 'dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD MMM YYYY">DD MMM YYYY</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={preferences.localization.timeFormat}
              onChange={(e) => handleChange('localization', 'timeFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={preferences.localization.currency}
              onChange={(e) => handleChange('localization', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>{currency.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Layout className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Customize your dashboard behavior and layout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default View
            </label>
            <select
              value={preferences.dashboard.defaultView}
              onChange={(e) => handleChange('dashboard', 'defaultView', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items Per Page
            </label>
            <select
              value={preferences.dashboard.itemsPerPage}
              onChange={(e) => handleChange('dashboard', 'itemsPerPage', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Refresh Interval (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              value={preferences.dashboard.refreshInterval}
              onChange={(e) => handleChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
              disabled={!preferences.dashboard.autoRefresh}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Auto Refresh</h3>
                <p className="text-sm text-gray-600">Automatically refresh data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dashboard.autoRefresh}
                  onChange={(e) => handleChange('dashboard', 'autoRefresh', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Welcome Message</h3>
                <p className="text-sm text-gray-600">Show welcome message on dashboard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dashboard.showWelcomeMessage}
                  onChange={(e) => handleChange('dashboard', 'showWelcomeMessage', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Collapsed Sidebar</h3>
                <p className="text-sm text-gray-600">Start with sidebar collapsed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dashboard.sidebarCollapsed}
                  onChange={(e) => handleChange('dashboard', 'sidebarCollapsed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Eye className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy & Data</h2>
            <p className="text-sm text-gray-600">Control how your data is used and shared</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Help improve the product by sharing usage analytics</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.privacy.analytics}
                onChange={(e) => handleChange('privacy', 'analytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Crash Reports</h3>
              <p className="text-sm text-gray-600">Automatically send crash reports to help fix issues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.privacy.crashReports}
                onChange={(e) => handleChange('privacy', 'crashReports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Usage Data</h3>
              <p className="text-sm text-gray-600">Share anonymized usage data for product improvement</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.privacy.usageData}
                onChange={(e) => handleChange('privacy', 'usageData', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
              <p className="text-sm text-gray-600">Allow marketing cookies for personalized content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.privacy.marketingCookies}
                onChange={(e) => handleChange('privacy', 'marketingCookies', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Advanced</h2>
            <p className="text-sm text-gray-600">Advanced settings for power users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Timeout (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={preferences.advanced.apiTimeout}
              onChange={(e) => handleChange('advanced', 'apiTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Developer Mode</h3>
                <p className="text-sm text-gray-600">Enable developer tools and features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.advanced.developerMode}
                  onChange={(e) => handleChange('advanced', 'developerMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Debug Mode</h3>
                <p className="text-sm text-gray-600">Show detailed error messages and logs</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.advanced.debugMode}
                  onChange={(e) => handleChange('advanced', 'debugMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Experimental Features</h3>
                <p className="text-sm text-gray-600">Enable beta features and experiments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.advanced.experimentalFeatures}
                  onChange={(e) => handleChange('advanced', 'experimentalFeatures', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Import/Export Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Database className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settings Management</h2>
            <p className="text-sm text-gray-600">Import or export your preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            Export Settings
          </button>
          
          <button
            onClick={handleImportSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Import Settings
          </button>
        </div>
      </div>
    </div>
  );
}
