"use client";

import { useState } from "react";
import { MoreHorizontal, TrendingUp, Download, Maximize2 } from "lucide-react";
import { AnalyticsChart as AnalyticsChartType } from "@/data/mockAnalytics";

interface AnalyticsChartProps {
  chart: AnalyticsChartType;
}

export function AnalyticsChartComponent({ chart }: AnalyticsChartProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...chart.data.map(d => d.value));
  const minValue = Math.min(...chart.data.map(d => d.value));
  const avgValue = chart.data.reduce((sum, d) => sum + d.value, 0) / chart.data.length;

  const getBarHeight = (value: number) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    console.log(`Chart action: ${action}`);
    // TODO: Implement chart actions
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <p className="text-sm text-gray-500">{chart.period}</p>
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
                    onClick={() => handleMenuAction('expand')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Expand Chart
                  </button>
                  <button
                    onClick={() => handleMenuAction('download')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Download Data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-semibold text-gray-900">{formatValue(Math.round(avgValue))}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Peak</p>
          <p className="text-lg font-semibold text-gray-900">{formatValue(maxValue)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Growth</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <p className="text-lg font-semibold text-green-600">
              {Math.round(((chart.data[chart.data.length - 1].value - chart.data[0].value) / chart.data[0].value) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="relative">
        {chart.type === 'bar' ? (
          <div className="flex items-end justify-between gap-2 h-48">
            {chart.data.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative w-full">
                  {hoveredIndex === index && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {point.label || point.date}: {formatValue(point.value)}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                    style={{
                      height: `${getBarHeight(point.value)}%`,
                      backgroundColor: chart.color,
                      minHeight: '4px'
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                  {point.label || new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        ) : chart.type === 'line' || chart.type === 'area' ? (
          <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                {chart.type === 'area' && (
                  <linearGradient id={`gradient-${chart.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={chart.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={chart.color} stopOpacity="0.05" />
                  </linearGradient>
                )}
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y * 2}
                  x2="400"
                  y2={y * 2}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              
              {/* Line path */}
              <path
                d={`M ${chart.data.map((point, index) => 
                  `${(index / (chart.data.length - 1)) * 400},${200 - (getBarHeight(point.value) / 100) * 200}`
                ).join(' L ')}`}
                fill="none"
                stroke={chart.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Area fill */}
              {chart.type === 'area' && (
                <path
                  d={`M ${chart.data.map((point, index) => 
                    `${(index / (chart.data.length - 1)) * 400},${200 - (getBarHeight(point.value) / 100) * 200}`
                  ).join(' L ')} L 400,200 L 0,200 Z`}
                  fill={`url(#gradient-${chart.id})`}
                />
              )}
              
              {/* Data points */}
              {chart.data.map((point, index) => (
                <circle
                  key={index}
                  cx={(index / (chart.data.length - 1)) * 400}
                  cy={200 - (getBarHeight(point.value) / 100) * 200}
                  r="4"
                  fill={chart.color}
                  className="cursor-pointer hover:r-6 transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
              
              {/* Tooltip */}
              {hoveredIndex !== null && (
                <g>
                  <rect
                    x={(hoveredIndex / (chart.data.length - 1)) * 400 - 30}
                    y={200 - (getBarHeight(chart.data[hoveredIndex].value) / 100) * 200 - 35}
                    width="60"
                    height="25"
                    fill="rgba(0,0,0,0.8)"
                    rx="4"
                  />
                  <text
                    x={(hoveredIndex / (chart.data.length - 1)) * 400}
                    y={200 - (getBarHeight(chart.data[hoveredIndex].value) / 100) * 200 - 18}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                  >
                    {formatValue(chart.data[hoveredIndex].value)}
                  </text>
                </g>
              )}
            </svg>
          </div>
        ) : null}
      </div>

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: 2 hours ago</span>
          <span>{chart.data.length} data points</span>
        </div>
      </div>
    </div>
  );
}
