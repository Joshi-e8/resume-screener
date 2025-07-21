"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

interface ChartData {
  label: string;
  value: number;
  color: string;
  trend?: number;
}

interface InteractiveChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'line' | 'donut';
}

export function InteractiveChart({
  title,
  data
}: InteractiveChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="group cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  hoveredIndex === index ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {item.trend && (
                  <div className={`flex items-center gap-1 text-xs ${
                    item.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-3 h-3 ${
                      item.trend < 0 ? 'rotate-180' : ''
                    }`} />
                    <span>{Math.abs(item.trend)}%</span>
                  </div>
                )}
                <span className={`text-sm font-semibold transition-colors duration-200 ${
                  hoveredIndex === index ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                  transform: hoveredIndex === index ? 'scaleY(1.2)' : 'scaleY(1)',
                  boxShadow: hoveredIndex === index ? `0 0 10px ${item.color}40` : 'none'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Updated {selectedPeriod === '7d' ? 'daily' : selectedPeriod === '30d' ? 'weekly' : 'monthly'}</span>
          </div>
          <div className="text-gray-600">
            Total: <span className="font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage data
export const resumeAnalyticsData: ChartData[] = [
  { label: 'New Resumes', value: 45, color: '#3B82F6', trend: 12 },
  { label: 'Under Review', value: 32, color: '#F59E0B', trend: -5 },
  { label: 'Shortlisted', value: 18, color: '#10B981', trend: 8 },
  { label: 'Interviewed', value: 12, color: '#8B5CF6', trend: 15 },
  { label: 'Hired', value: 6, color: '#059669', trend: 25 },
  { label: 'Rejected', value: 28, color: '#EF4444', trend: -10 }
];

export const skillsAnalyticsData: ChartData[] = [
  { label: 'JavaScript', value: 85, color: '#F7DF1E', trend: 5 },
  { label: 'React', value: 72, color: '#61DAFB', trend: 8 },
  { label: 'Python', value: 68, color: '#3776AB', trend: 12 },
  { label: 'Node.js', value: 54, color: '#339933', trend: 3 },
  { label: 'TypeScript', value: 48, color: '#3178C6', trend: 18 },
  { label: 'AWS', value: 42, color: '#FF9900', trend: 22 }
];
