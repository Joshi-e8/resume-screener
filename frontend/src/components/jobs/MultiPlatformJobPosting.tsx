"use client";

import { useState } from "react";
import { CheckCircle, ExternalLink, Settings, Zap, Globe, Users, DollarSign, Clock } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  reach: string;
  cost: string;
  timeToPost: string;
  features: string[];
  connected: boolean;
  premium: boolean;
}

interface MultiPlatformJobPostingProps {
  jobData?: {
    title: string;
    department: string;
    location: string;
    type: string;
  };
  onPlatformToggle: (platformId: string, enabled: boolean) => void;
  onPostToAll: (selectedPlatforms: string[]) => void;
}

export function MultiPlatformJobPosting({ 
  jobData, 
  onPlatformToggle, 
  onPostToAll 
}: MultiPlatformJobPostingProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'linkedin', 'indeed', 'glassdoor'
  ]);

  const platforms: Platform[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'Professional network with quality candidates',
      reach: '900M+ professionals',
      cost: 'Free + Premium',
      timeToPost: '2 minutes',
      features: ['Professional audience', 'Company branding', 'Advanced targeting'],
      connected: true,
      premium: false
    },
    {
      id: 'indeed',
      name: 'Indeed',
      icon: '🔍',
      description: 'World\'s largest job site with broad reach',
      reach: '350M+ visitors/month',
      cost: 'Free + Sponsored',
      timeToPost: '1 minute',
      features: ['Massive reach', 'Resume database', 'Easy application'],
      connected: true,
      premium: false
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      icon: '🏢',
      description: 'Employer branding and company reviews',
      reach: '67M+ users',
      cost: 'Premium',
      timeToPost: '3 minutes',
      features: ['Company reviews', 'Salary insights', 'Employer branding'],
      connected: true,
      premium: true
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      icon: '⚡',
      description: 'AI-powered matching and quick posting',
      reach: '25M+ job seekers',
      cost: 'Premium',
      timeToPost: '30 seconds',
      features: ['AI matching', 'One-click apply', 'Mobile optimized'],
      connected: false,
      premium: true
    },
    {
      id: 'monster',
      name: 'Monster',
      icon: '👹',
      description: 'Established job board with diverse candidates',
      reach: '6M+ active users',
      cost: 'Premium',
      timeToPost: '2 minutes',
      features: ['Resume search', 'Career advice', 'Diversity focus'],
      connected: false,
      premium: true
    },
    {
      id: 'angellist',
      name: 'AngelList',
      icon: '🚀',
      description: 'Startup and tech talent marketplace',
      reach: '8M+ startup professionals',
      cost: 'Free + Premium',
      timeToPost: '2 minutes',
      features: ['Startup focus', 'Equity details', 'Tech talent'],
      connected: true,
      premium: false
    }
  ];

  const handlePlatformToggle = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform?.connected) return;

    const newSelected = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId];
    
    setSelectedPlatforms(newSelected);
    onPlatformToggle(platformId, newSelected.includes(platformId));
  };

  const handlePostToAll = () => {
    onPostToAll(selectedPlatforms);
  };

  const getTotalReach = () => {
    const selectedPlatformData = platforms.filter(p => selectedPlatforms.includes(p.id));
    return selectedPlatformData.length;
  };

  const getEstimatedCost = () => {
    const selectedPlatformData = platforms.filter(p => selectedPlatforms.includes(p.id));
    const premiumCount = selectedPlatformData.filter(p => p.premium).length;
    const freeCount = selectedPlatformData.length - premiumCount;
    
    if (premiumCount === 0) return 'Free';
    if (freeCount === 0) return `$${premiumCount * 299}/month`;
    return `$${premiumCount * 299}/month + ${freeCount} free`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Multi-Platform Job Posting
          </h2>
        </div>
        <p className="text-gray-600">
          Post your job to multiple platforms simultaneously and reach millions of candidates
        </p>
      </div>

      {/* Job Preview */}
      {jobData && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Job Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Title:</span>
              <div className="font-medium">{jobData.title}</div>
            </div>
            <div>
              <span className="text-gray-600">Department:</span>
              <div className="font-medium">{jobData.department}</div>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <div className="font-medium">{jobData.location}</div>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <div className="font-medium">{jobData.type}</div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
              selectedPlatforms.includes(platform.id)
                ? 'border-blue-500 bg-blue-50'
                : platform.connected
                ? 'border-gray-200 hover:border-gray-300 bg-white'
                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => handlePlatformToggle(platform.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                  {platform.premium && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
              </div>
              
              {platform.connected ? (
                selectedPlatforms.includes(platform.id) ? (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )
              ) : (
                <Settings className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">{platform.description}</p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">{platform.reach}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">{platform.cost}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">{platform.timeToPost}</span>
              </div>
            </div>

            {!platform.connected && (
              <button className="w-full mt-3 px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-colors duration-200">
                Connect Platform
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Posting Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Posting Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalReach()}</div>
            <div className="text-sm text-gray-600">Platforms Selected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getEstimatedCost()}</div>
            <div className="text-sm text-gray-600">Estimated Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">~5 min</div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
        </div>
      </div>

      {/* Selected Platforms Features */}
      {selectedPlatforms.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Combined Features</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(
              platforms
                .filter(p => selectedPlatforms.includes(p.id))
                .flatMap(p => p.features)
            )).map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePostToAll}
          disabled={selectedPlatforms.length === 0}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
            selectedPlatforms.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-5 h-5" />
          Post to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
        </button>
        
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2">
          <Settings className="w-5 h-5" />
          Configure Platforms
        </button>
      </div>

      {/* Platform Integration Status */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Platform Integration</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Connect additional platforms in Settings → Integrations to expand your reach. 
              Each platform requires one-time setup and authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
