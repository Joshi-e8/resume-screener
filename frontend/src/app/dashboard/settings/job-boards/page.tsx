"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink, Settings, Key, Zap, Users, DollarSign } from "lucide-react";

interface JobBoard {
  id: string;
  name: string;
  icon: string;
  description: string;
  reach: string;
  cost: string;
  connected: boolean;
  premium: boolean;
  features: string[];
  popularity: number;
}

export default function JobBoardsPage() {
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'Professional network with quality candidates',
      reach: '900M+ professionals',
      cost: 'Free + Premium',
      connected: true,
      premium: false,
      features: ['Professional audience', 'Company branding', 'Advanced targeting', 'InMail messaging'],
      popularity: 95
    },
    {
      id: 'indeed',
      name: 'Indeed',
      icon: '🔍',
      description: 'World\'s largest job site with broad reach',
      reach: '350M+ visitors/month',
      cost: 'Free + Sponsored',
      connected: true,
      premium: false,
      features: ['Massive reach', 'Resume database', 'Easy application', 'Mobile optimized'],
      popularity: 90
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      icon: '🏢',
      description: 'Employer branding and company reviews',
      reach: '67M+ users',
      cost: 'Premium',
      connected: false,
      premium: true,
      features: ['Company reviews', 'Salary insights', 'Employer branding', 'Quality candidates'],
      popularity: 85
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      icon: '⚡',
      description: 'AI-powered matching and distribution',
      reach: '25M+ job seekers',
      cost: 'Premium',
      connected: false,
      premium: true,
      features: ['AI matching', 'One-click apply', '100+ job sites', 'Mobile first'],
      popularity: 80
    },
    {
      id: 'monster',
      name: 'Monster',
      icon: '👹',
      description: 'Established job board with diverse reach',
      reach: '6M+ active users',
      cost: 'Premium',
      connected: false,
      premium: true,
      features: ['Resume search', 'Career advice', 'Diversity focus', 'Global reach'],
      popularity: 70
    },
    {
      id: 'angellist',
      name: 'AngelList',
      icon: '🚀',
      description: 'Startup and tech talent marketplace',
      reach: '8M+ startup professionals',
      cost: 'Free + Premium',
      connected: true,
      premium: false,
      features: ['Startup focus', 'Equity details', 'Tech talent', 'Remote jobs'],
      popularity: 75
    }
  ]);

  const handleConnect = (boardId: string) => {
    setJobBoards(prev => 
      prev.map(board => 
        board.id === boardId 
          ? { ...board, connected: !board.connected }
          : board
      )
    );
  };

  const connectedCount = jobBoards.filter(board => board.connected).length;
  const totalReach = jobBoards
    .filter(board => board.connected)
    .reduce((total, board) => {
      const reach = parseInt(board.reach.replace(/[^\d]/g, ''));
      return total + reach;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Job Board Integrations
          </h1>
          <p className="text-gray-600 mt-1">
            Connect job boards for multi-platform posting and maximum candidate reach
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{connectedCount}</div>
              <div className="text-sm text-gray-600">Connected Boards</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalReach}M+</div>
              <div className="text-sm text-gray-600">Total Reach</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Auto</div>
              <div className="text-sm text-gray-600">Multi-Platform</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Mixed</div>
              <div className="text-sm text-gray-600">Pricing Model</div>
            </div>
          </div>
        </div>
      </div>

      {/* CVViz-Style Feature Highlight */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">🚀 Multi-Platform Job Posting</h2>
          <p className="text-blue-100 mb-6 text-lg">
            Create once, post everywhere. Connect your job boards and reach millions of candidates with a single click.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-2">⚡ One-Click Posting</h3>
              <p className="text-blue-100 text-sm">Post to multiple platforms simultaneously from job creation</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-2">📊 Unified Analytics</h3>
              <p className="text-blue-100 text-sm">Track performance across all platforms in one dashboard</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-2">🎯 Smart Optimization</h3>
              <p className="text-blue-100 text-sm">AI learns which platforms work best for your jobs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobBoards.map((board) => (
          <div
            key={board.id}
            className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
              board.connected ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{board.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{board.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${board.popularity}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{board.popularity}%</span>
                  </div>
                </div>
              </div>
              
              {board.connected ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{board.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reach:</span>
                <span className="font-medium text-gray-900">{board.reach}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium text-gray-900">{board.cost}</span>
              </div>
            </div>

            {board.premium && !board.connected && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Key className="w-4 h-4" />
                  <span className="text-xs font-medium">Premium Required</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
              <div className="flex flex-wrap gap-1">
                {board.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleConnect(board.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  board.connected
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {board.connected ? 'Disconnect' : 'Connect'}
              </button>
              
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Multi-Platform Posting Setup</h3>
            <p className="text-blue-800 text-sm mb-4">
              Once connected, you can post to multiple job boards simultaneously when creating a new job. 
              Each platform requires one-time authentication and setup.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm">
                Setup Guide
              </button>
              <Link 
                href="/dashboard/jobs/create"
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm"
              >
                Try Multi-Platform Posting
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
