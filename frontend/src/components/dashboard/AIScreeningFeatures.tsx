"use client";

import { useState } from "react";
import { Brain, Zap, Target, BarChart3, Cpu, Search } from "lucide-react";

export function AIScreeningFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Brain,
      title: "NLP & ML Algorithms",
      description: "Advanced Natural Language Processing understands resume context, not just keywords",
      stats: "95% accuracy",
      color: "blue"
    },
    {
      icon: Target,
      title: "Smart Candidate Matching",
      description: "AI learns from your hiring patterns to match candidates to the right positions",
      stats: "60% faster",
      color: "purple"
    },
    {
      icon: Zap,
      title: "Multi-Platform Integration",
      description: "Seamlessly process resumes from LinkedIn, Indeed, Glassdoor, and 20+ sources",
      stats: "20+ platforms",
      color: "green"
    },
    {
      icon: BarChart3,
      title: "Continuous Learning",
      description: "AI improves with every hire, learning your preferences and success patterns",
      stats: "Self-improving",
      color: "orange"
    }
  ];

  const platforms = [
    { name: "LinkedIn", icon: "💼", count: "2.5K+" },
    { name: "Indeed", icon: "🔍", count: "1.8K+" },
    { name: "Glassdoor", icon: "🏢", count: "900+" },
    { name: "AngelList", icon: "🚀", count: "600+" },
    { name: "Stack Overflow", icon: "💻", count: "400+" },
    { name: "GitHub", icon: "⚡", count: "300+" }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      green: "bg-green-50 border-green-200 text-green-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            AI-Powered Screening Engine
          </h2>
        </div>
        <p className="text-gray-600">
          Advanced machine learning algorithms that understand resumes contextually and match candidates intelligently
        </p>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              activeFeature === index
                ? getColorClasses(feature.color)
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => setActiveFeature(index)}
          >
            <div className="flex items-start gap-3">
              <feature.icon className={`w-6 h-6 ${
                activeFeature === index ? 'text-current' : 'text-gray-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    activeFeature === index ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {feature.stats}
                  </span>
                </div>
                <p className={`text-sm ${
                  activeFeature === index ? 'text-current opacity-90' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Platform Support */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Multi-Platform Resume Sources (20+ Supported)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {platforms.map((platform, index) => (
            <div key={index} className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl mb-1">{platform.icon}</div>
              <div className="font-medium text-gray-900 text-sm">{platform.name}</div>
              <div className="text-xs text-gray-600">{platform.count} resumes</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Learning Process */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">How AI Learns & Improves</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Analyze</h4>
            <p className="text-sm text-gray-600">AI analyzes resume content, skills, and experience patterns</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Learn</h4>
            <p className="text-sm text-gray-600">System learns from your hiring decisions and preferences</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Match</h4>
            <p className="text-sm text-gray-600">Intelligent matching improves with each successful hire</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Optimize</h4>
            <p className="text-sm text-gray-600">Continuous optimization for better candidate recommendations</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2">
          <Brain className="w-5 h-5" />
          Start AI Screening
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5" />
          View Analytics
        </button>
      </div>
    </div>
  );
}
