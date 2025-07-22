"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnalyticsMetric } from "@/data/mockAnalytics";

interface AnalyticsMetricCardProps {
  metric: AnalyticsMetric;
}

export function AnalyticsMetricCard({ metric }: AnalyticsMetricCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'orange':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getChangeIcon = () => {
    switch (metric.changeType) {
      case 'increase':
        return <TrendingUp className="w-3 h-3" />;
      case 'decrease':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getChangeColor = () => {
    switch (metric.changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value: number) => {
    if (metric.id === 'time-to-hire') {
      return `${value} days`;
    }
    if (metric.id === 'conversion-rate') {
      return `${value}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
          <span className="text-lg">{metric.icon}</span>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor()}`}>
          {getChangeIcon()}
          <span>{Math.abs(metric.change)}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
          {metric.title}
        </h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(metric.value)}
          </span>
        </div>
        
        <p className="text-xs text-gray-500">
          {metric.period}
        </p>
      </div>

      {/* Progress Bar (for visual appeal) */}
      <div className="mt-4 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            metric.color === 'blue' ? 'bg-blue-500' :
            metric.color === 'green' ? 'bg-green-500' :
            metric.color === 'yellow' ? 'bg-yellow-500' :
            metric.color === 'purple' ? 'bg-purple-500' :
            metric.color === 'orange' ? 'bg-orange-500' :
            metric.color === 'indigo' ? 'bg-indigo-500' :
            'bg-gray-500'
          }`}
          style={{
            width: `${Math.min(Math.abs(metric.change) * 5, 100)}%`
          }}
        />
      </div>
    </div>
  );
}
