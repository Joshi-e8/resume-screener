"use client";

import { useState } from "react";
import { MoreHorizontal, Download, Users, TrendingDown } from "lucide-react";
import { HiringFunnelData } from "@/data/mockAnalytics";

interface HiringFunnelChartProps {
  data: HiringFunnelData[];
  title: string;
  period: string;
}

export function HiringFunnelChart({ data, title, period }: HiringFunnelChartProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    console.log(`Funnel action: ${action}`);
    // TODO: Implement funnel actions
  };

  const getDropoffRate = (currentIndex: number) => {
    if (currentIndex === 0) return 0;
    const current = data[currentIndex];
    const previous = data[currentIndex - 1];
    return Math.round(((previous.count - current.count) / previous.count) * 100);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            {title}
          </h3>
          <p className="text-sm text-gray-500">{period}</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => handleMenuAction('download')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-4">
        {data.map((stage, index) => {
          const isHovered = hoveredStage === stage.stage;
          const dropoffRate = getDropoffRate(index);
          
          return (
            <div key={stage.stage} className="relative">
              {/* Stage Bar */}
              <div
                className="relative cursor-pointer group"
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    {dropoffRate > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <TrendingDown className="w-3 h-3" />
                        <span>{dropoffRate}% drop</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{stage.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">({stage.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                
                <div className="relative w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color,
                      transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                      boxShadow: isHovered ? `0 0 20px ${stage.color}40` : 'none'
                    }}
                  >
                    <span className="text-white text-xs font-medium">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connector Arrow */}
              {index < data.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-gray-300"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Conversion Rate</p>
            <p className="text-lg font-semibold text-blue-700">
              {((data[data.length - 1].count / data[0].count) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Total Hired</p>
            <p className="text-lg font-semibold text-green-700">
              {data[data.length - 1].count}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Insights</h4>
        <div className="space-y-1 text-xs text-yellow-700">
          <p>• Biggest drop-off occurs at the {data.reduce((max, _, index) =>
            getDropoffRate(index) > getDropoffRate(max) ? index : max, 1
          ) && data[data.reduce((max, _, index) =>
            getDropoffRate(index) > getDropoffRate(max) ? index : max, 1
          )]?.stage} stage</p>
          <p>• Overall conversion rate is {((data[data.length - 1].count / data[0].count) * 100).toFixed(1)}%</p>
          <p>• {data[0].count - data[data.length - 1].count} candidates didn&apos;t complete the process</p>
        </div>
      </div>
    </div>
  );
}
