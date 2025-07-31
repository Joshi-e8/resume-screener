"use client";

import { TrendingUp, Brain, Zap, Target } from "lucide-react";

export function EnhancedStatsCard() {
  const stats = [
    {
      title: "AI Processed Resumes",
      value: "2,847",
      change: "+23%",
      changeType: "positive" as const,
      icon: Brain,
      color: "blue",
      subtitle: "From 20+ platforms",
      trend: [65, 78, 82, 94, 87, 95]
    },
    {
      title: "Smart Matches",
      value: "1,156",
      change: "+35%",
      changeType: "positive" as const,
      icon: Target,
      color: "green",
      subtitle: "AI-powered matching",
      trend: [45, 52, 68, 74, 81, 89]
    },
    {
      title: "Quality Score",
      value: "94.5%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "purple",
      subtitle: "Candidate accuracy",
      trend: [88, 89, 91, 92, 93, 94.5]
    },
    {
      title: "Time Saved",
      value: "67%",
      change: "+12%",
      changeType: "positive" as const,
      icon: Zap,
      color: "orange",
      subtitle: "Faster screening",
      trend: [45, 52, 58, 61, 64, 67]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      green: "bg-green-50 border-green-200 text-green-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
      orange: "bg-orange-50 border-orange-200 text-orange-600"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getChangeColor = (changeType: string) => {
    return changeType === "positive" ? "text-green-600" : "text-red-600";
  };

  const renderMiniChart = (trend: number[], color: string) => {
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min;
    
    return (
      <div className="flex items-end gap-0.5 h-8 w-16">
        {trend.map((value, index) => {
          const height = range > 0 ? ((value - min) / range) * 100 : 50;
          return (
            <div
              key={index}
              className={`flex-1 rounded-sm ${
                color === 'blue' ? 'bg-blue-200' :
                color === 'green' ? 'bg-green-200' :
                color === 'purple' ? 'bg-purple-200' :
                'bg-orange-200'
              }`}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${getColorClasses(stat.color)}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-right">
              {renderMiniChart(stat.trend, stat.color)}
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Platform Performance Stats
export function PlatformStatsCard() {
  const platformStats = [
    {
      platform: "LinkedIn",
      icon: "💼",
      resumes: "1,247",
      quality: "96%",
      growth: "+18%",
      color: "blue"
    },
    {
      platform: "Indeed",
      icon: "🔍", 
      resumes: "856",
      quality: "92%",
      growth: "+25%",
      color: "green"
    },
    {
      platform: "Glassdoor",
      icon: "🏢",
      resumes: "423",
      quality: "94%",
      growth: "+12%",
      color: "purple"
    },
    {
      platform: "Direct Apply",
      icon: "📧",
      resumes: "321",
      quality: "98%",
      growth: "+8%",
      color: "orange"
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((platform, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <h4 className="font-medium text-gray-900">{platform.platform}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  platform.growth.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {platform.growth}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resumes</span>
                <span className="font-medium text-gray-900">{platform.resumes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quality</span>
                <span className="font-medium text-gray-900">{platform.quality}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
