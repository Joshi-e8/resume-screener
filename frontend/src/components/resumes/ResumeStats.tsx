"use client";

import { FileText, Clock, CheckCircle, TrendingUp } from "lucide-react";

export function ResumeStats() {
  // Mock data - will be replaced with real data from Redux store
  const stats = [
    {
      title: "Total Resumes",
      value: "247",
      change: "+12",
      changeType: "increase" as const,
      changeText: "this month",
      icon: FileText,
      color: "blue"
    },
    {
      title: "Processing",
      value: "8",
      change: "+3",
      changeType: "increase" as const,
      changeText: "in queue",
      icon: Clock,
      color: "yellow"
    },
    {
      title: "Processed",
      value: "239",
      change: "+15",
      changeType: "increase" as const,
      changeText: "this week",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Matches Found",
      value: "156",
      change: "+8%",
      changeType: "increase" as const,
      changeText: "match rate",
      icon: TrendingUp,
      color: "purple"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-50",
        icon: "text-blue-600",
        iconBg: "bg-blue-100"
      },
      yellow: {
        bg: "bg-yellow-50",
        icon: "text-yellow-600",
        iconBg: "bg-yellow-100"
      },
      green: {
        bg: "bg-green-50",
        icon: "text-green-600",
        iconBg: "bg-green-100"
      },
      purple: {
        bg: "bg-purple-50",
        icon: "text-purple-600",
        iconBg: "bg-purple-100"
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{stat.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">{stat.changeText}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
