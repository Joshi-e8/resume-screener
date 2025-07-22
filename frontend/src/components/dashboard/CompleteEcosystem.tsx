"use client";

import React, { useState } from "react";
import { 
  Users, 
  BarChart3, 
  Zap, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Calendar,
  MessageSquare,
  Target
} from "lucide-react";

export function CompleteEcosystem() {
  const [activeModule, setActiveModule] = useState(0);

  const modules = [
    {
      id: "ats",
      icon: Users,
      title: "Applicant Tracking System",
      description: "Complete candidate pipeline management from application to hire",
      features: [
        "Candidate pipeline tracking",
        "Interview scheduling",
        "Offer management",
        "Team collaboration"
      ],
      color: "blue",
      status: "Active"
    },
    {
      id: "crm",
      icon: MessageSquare,
      title: "Recruitment CRM",
      description: "Manage client relationships and recruitment agency workflows",
      features: [
        "Client management",
        "Lead tracking",
        "Communication history",
        "Account management"
      ],
      color: "purple",
      status: "Active"
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into recruitment performance and optimization",
      features: [
        "Hiring metrics",
        "Source effectiveness",
        "Time-to-hire tracking",
        "Quality analytics"
      ],
      color: "green",
      status: "Active"
    },
    {
      id: "automation",
      icon: Zap,
      title: "Recruitment Automation",
      description: "Automate repetitive tasks and streamline workflows",
      features: [
        "Email automation",
        "Workflow triggers",
        "Status updates",
        "Notification rules"
      ],
      color: "orange",
      status: "Active"
    }
  ];

  const integrations = [
    { name: "LinkedIn", type: "Sourcing", status: "Connected" },
    { name: "Indeed", type: "Job Posting", status: "Connected" },
    { name: "Glassdoor", type: "Employer Branding", status: "Available" },
    { name: "Google Calendar", type: "Scheduling", status: "Connected" },
    { name: "Slack", type: "Communication", status: "Available" },
    { name: "Zoom", type: "Video Interviews", status: "Connected" }
  ];

  const getColorClasses = (color: string, active: boolean = false) => {
    const colors = {
      blue: active ? "bg-blue-600 text-white" : "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
      purple: active ? "bg-purple-600 text-white" : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
      green: active ? "bg-green-600 text-white" : "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
      orange: active ? "bg-orange-600 text-white" : "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Complete Recruitment Ecosystem
          </h2>
        </div>
        <p className="text-gray-600">
          ATS + CRM + Analytics + Automation - Everything you need for modern recruitment
        </p>
      </div>

      {/* Module Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {modules.map((module, index) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(index)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              activeModule === index
                ? getColorClasses(module.color, true)
                : getColorClasses(module.color, false)
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <module.icon className="w-6 h-6" />
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                activeModule === index ? 'bg-white/20' : 'bg-white'
              }`}>
                {module.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1">{module.title}</h3>
            <p className={`text-sm ${activeModule === index ? 'opacity-90' : 'opacity-70'}`}>
              {module.description}
            </p>
          </button>
        ))}
      </div>

      {/* Active Module Details */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {React.createElement(modules[activeModule].icon, { 
            className: "w-8 h-8 text-gray-700" 
          })}
          <h3 className="text-xl font-bold text-gray-900">
            {modules[activeModule].title}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          {modules[activeModule].description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
            <ul className="space-y-2">
              {modules[activeModule].features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Actions:</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Configure {modules[activeModule].title}
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                View Documentation
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Access Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Platform Integrations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {integrations.map((integration, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">
                {integration.name === 'LinkedIn' ? '💼' :
                 integration.name === 'Indeed' ? '🔍' :
                 integration.name === 'Glassdoor' ? '🏢' :
                 integration.name === 'Google Calendar' ? '📅' :
                 integration.name === 'Slack' ? '💬' :
                 integration.name === 'Zoom' ? '📹' : '🔗'}
              </div>
              <div className="font-medium text-gray-900 text-xs">{integration.name}</div>
              <div className="text-xs text-gray-600">{integration.type}</div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                integration.status === 'Connected' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {integration.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Automation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Automated Workflow Example
        </h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <div className="flex-shrink-0 bg-white rounded-lg p-3 text-center min-w-[120px]">
            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-xs font-medium">Resume Uploaded</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-shrink-0 bg-white rounded-lg p-3 text-center min-w-[120px]">
            <Brain className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-xs font-medium">AI Screening</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-shrink-0 bg-white rounded-lg p-3 text-center min-w-[120px]">
            <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-medium">Auto Email</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-shrink-0 bg-white rounded-lg p-3 text-center min-w-[120px]">
            <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <div className="text-xs font-medium">Schedule Interview</div>
          </div>
        </div>
      </div>
    </div>
  );
}
