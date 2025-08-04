"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Check, 
  X,
  ExternalLink,
  Zap,
  Settings,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: string;
  website: string;
  features: string[];
  isPopular?: boolean;
}

const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API',
    key: 'sk_live_51H7...',
    permissions: ['read', 'write'],
    createdAt: '2024-01-15T00:00:00Z',
    lastUsed: '2024-01-20T14:30:00Z',
    isActive: true
  },
  {
    id: '2',
    name: 'Development API',
    key: 'sk_test_51H7...',
    permissions: ['read'],
    createdAt: '2024-01-10T00:00:00Z',
    lastUsed: '2024-01-19T10:15:00Z',
    isActive: true
  },
  {
    id: '3',
    name: 'Analytics API',
    key: 'sk_analytics_51H7...',
    permissions: ['read'],
    createdAt: '2024-01-05T00:00:00Z',
    lastUsed: '2024-01-18T16:45:00Z',
    isActive: false
  }
];

const mockIntegrations: Integration[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Import candidate profiles and post jobs to LinkedIn',
    category: 'Recruitment',
    status: 'connected',
    icon: '💼',
    website: 'https://linkedin.com',
    features: ['Profile Import', 'Job Posting', 'Candidate Search'],
    isPopular: true
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates in your Slack workspace',
    category: 'Communication',
    status: 'connected',
    icon: '💬',
    website: 'https://slack.com',
    features: ['Notifications', 'Team Updates', 'Bot Commands']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule interviews and sync calendar events',
    category: 'Productivity',
    status: 'disconnected',
    icon: '📅',
    website: 'https://calendar.google.com',
    features: ['Interview Scheduling', 'Calendar Sync', 'Reminders']
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Analyze candidate code repositories and contributions',
    category: 'Development',
    status: 'error',
    icon: '🐙',
    website: 'https://github.com',
    features: ['Code Analysis', 'Repository Access', 'Contribution History']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Create and manage video interview sessions',
    category: 'Communication',
    status: 'disconnected',
    icon: '📹',
    website: 'https://zoom.us',
    features: ['Video Interviews', 'Meeting Scheduling', 'Recording']
  }
];

export default function IntegrationsPage() {
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCreateAPIKey = () => {
    if (!newKeyName) return;
    
    console.log('Creating API key:', { name: newKeyName, permissions: newKeyPermissions });
    setShowCreateKey(false);
    setNewKeyName('');
    setNewKeyPermissions(['read']);
    // TODO: Implement API key creation
  };

  const handleDeleteAPIKey = (keyId: string) => {
    console.log('Deleting API key:', keyId);
    // TODO: Implement API key deletion
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleIntegrationToggle = (integrationId: string) => {
    console.log('Toggling integration:', integrationId);
    // TODO: Implement integration toggle
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Check className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <X className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <X className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
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
            Integrations & API
          </h1>
          <p className="text-gray-600 mt-1">
            Connect third-party services and manage API access
          </p>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-600">Manage API keys for programmatic access</p>
          </div>
          <button
            onClick={() => setShowCreateKey(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create API Key
          </button>
        </div>

        <div className="space-y-4">
          {mockAPIKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <span>•</span>
                    <span>Permissions: {apiKey.permissions.join(', ')}</span>
                    <span>•</span>
                    <span>Last used {formatDistanceToNow(new Date(apiKey.lastUsed), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteAPIKey(apiKey.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Create API Key Modal */}
        {showCreateKey && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowCreateKey(false)} />
              <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create API Key</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      {['read', 'write', 'delete'].map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyPermissions(prev => [...prev, permission]);
                              } else {
                                setNewKeyPermissions(prev => prev.filter(p => p !== permission));
                              }
                            }}
                            className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateKey(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAPIKey}
                      disabled={!newKeyName || newKeyPermissions.length === 0}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      Create Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integrations Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Available Integrations</h2>
          <p className="text-sm text-gray-600">Connect with popular tools and services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockIntegrations.map((integration) => (
            <div key={integration.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      {integration.isPopular && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{integration.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {integration.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <a
                  href={integration.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  Learn more
                  <ExternalLink className="w-3 h-3" />
                </a>
                
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' && (
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleIntegrationToggle(integration.id)}
                    className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                      integration.status === 'connected'
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
            <p className="text-sm text-gray-600">Configure webhook endpoints for real-time notifications</p>
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
            <Zap className="w-4 h-4 mr-2 inline" />
            Add Webhook
          </button>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
          <p className="text-gray-500 mb-4">Set up webhooks to receive real-time notifications about events in your account.</p>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200">
            Create Your First Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
