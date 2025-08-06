"use client";

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  MemoryStick, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  itemsRendered: number;
  scrollPerformance: number;
}

interface PerformanceDemoProps {
  fileCount: number;
  currentMetrics?: PerformanceMetrics;
  performanceMode?: 'standard' | 'optimized' | 'maximum';
}

export const PerformanceDemo: React.FC<PerformanceDemoProps> = ({
  fileCount,
  currentMetrics,
  performanceMode = 'standard'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Estimated performance metrics based on file count and mode
  const getEstimatedMetrics = (count: number, mode: string): PerformanceMetrics => {
    const baseLoadTime = Math.min(count * 2, 3000);
    const baseMemory = count * 0.01; // MB
    
    const multipliers = {
      standard: { load: 1.0, memory: 1.0, render: 1.0 },
      optimized: { load: 0.7, memory: 0.5, render: 0.6 },
      maximum: { load: 0.5, memory: 0.2, render: 0.3 }
    };
    
    const mult = multipliers[mode as keyof typeof multipliers] || multipliers.standard;
    
    return {
      loadTime: Math.round(baseLoadTime * mult.load),
      renderTime: Math.round(count * 0.1 * mult.render),
      memoryUsage: Math.round(baseMemory * mult.memory * 100) / 100,
      itemsRendered: mode === 'maximum' ? Math.min(50, count) : count,
      scrollPerformance: mode === 'maximum' ? 60 : mode === 'optimized' ? 45 : 30
    };
  };

  const metrics = currentMetrics || getEstimatedMetrics(fileCount, performanceMode);

  const getPerformanceLevel = (loadTime: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (loadTime < 500) return 'excellent';
    if (loadTime < 1000) return 'good';
    if (loadTime < 2000) return 'fair';
    return 'poor';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const performanceLevel = getPerformanceLevel(metrics.loadTime);
  const colorClass = getPerformanceColor(performanceLevel);

  const recommendations = {
    standard: [
      'Good for small datasets (< 100 files)',
      'Full feature set available',
      'Standard memory usage'
    ],
    optimized: [
      'Recommended for medium datasets (100-1000 files)',
      'Virtualized rendering enabled',
      'Reduced memory footprint'
    ],
    maximum: [
      'Best for large datasets (1000+ files)',
      'Maximum performance optimizations',
      'Minimal memory usage'
    ]
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
          <span className={`px-2 py-1 text-xs rounded-full border ${colorClass}`}>
            {performanceLevel.toUpperCase()}
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Load Time</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.loadTime}ms
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <MemoryStick className="w-4 h-4" />
            <span className="text-xs">Memory</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.memoryUsage}MB
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">FPS</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.scrollPerformance}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Rendered</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.itemsRendered}
          </div>
        </div>
      </div>

      {/* Performance Mode Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900">
            Current Mode: {performanceMode.charAt(0).toUpperCase() + performanceMode.slice(1)}
          </span>
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          {recommendations[performanceMode].map((rec, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Detailed Performance Analysis</h4>
          
          <div className="space-y-3">
            {/* Load Time Analysis */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Load Time Performance</span>
              <div className="flex items-center gap-2">
                {performanceLevel === 'excellent' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {performanceLevel === 'good' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                {performanceLevel === 'fair' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {performanceLevel === 'poor' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span className="text-sm font-medium">{performanceLevel}</span>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory Efficiency</span>
              <div className="flex items-center gap-2">
                {metrics.memoryUsage < 5 && <CheckCircle className="w-4 h-4 text-green-500" />}
                {metrics.memoryUsage >= 5 && metrics.memoryUsage < 20 && <CheckCircle className="w-4 h-4 text-blue-500" />}
                {metrics.memoryUsage >= 20 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm font-medium">
                  {metrics.memoryUsage < 5 ? 'Excellent' : metrics.memoryUsage < 20 ? 'Good' : 'High'}
                </span>
              </div>
            </div>

            {/* Scroll Performance */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Scroll Performance</span>
              <div className="flex items-center gap-2">
                {metrics.scrollPerformance >= 55 && <CheckCircle className="w-4 h-4 text-green-500" />}
                {metrics.scrollPerformance >= 40 && metrics.scrollPerformance < 55 && <CheckCircle className="w-4 h-4 text-blue-500" />}
                {metrics.scrollPerformance < 40 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm font-medium">
                  {metrics.scrollPerformance >= 55 ? 'Smooth' : metrics.scrollPerformance >= 40 ? 'Good' : 'Choppy'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {performanceLevel !== 'excellent' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Performance Recommendations</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {fileCount > 1000 && performanceMode !== 'maximum' && (
                  <li>• Switch to Maximum Performance mode for better handling of large datasets</li>
                )}
                {fileCount > 100 && performanceMode === 'standard' && (
                  <li>• Enable Optimized mode for better performance with medium datasets</li>
                )}
                {metrics.memoryUsage > 20 && (
                  <li>• Consider reducing the number of items per page</li>
                )}
                {metrics.scrollPerformance < 40 && (
                  <li>• Enable virtualization for smoother scrolling</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceDemo;
