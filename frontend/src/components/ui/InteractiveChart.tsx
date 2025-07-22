"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Maximize2, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
  className?: string;
}

export function InteractiveChart({
  data,
  type,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showTooltip = true,
  onDataPointClick,
  onExport,
  className = ""
}: InteractiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F97316'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = (event: React.MouseEvent, index: number) => {
    if (showTooltip) {
      const rect = chartRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleDataPointClick = (dataPoint: ChartDataPoint, index: number) => {
    onDataPointClick?.(dataPoint, index);
  };

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (format === 'csv') {
      const csv = [
        'Label,Value',
        ...data.map(d => `"${d.label}",${d.value}`)
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'svg' && svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    onExport?.(format);
    setShowMenu(false);
  };

  const renderBarChart = () => {
    const barWidth = 40;
    const spacing = 20;
    const chartWidth = data.length * (barWidth + spacing);
    const chartHeight = height - 60;

    return (
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${Math.max(chartWidth, 400)} ${height}`}
        className="overflow-visible"
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = index * (barWidth + spacing) + spacing;
          const y = height - barHeight - 40;
          const color = item.color || colors[index % colors.length];

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className={`cursor-pointer transition-all duration-200 ${
                  hoveredIndex === index ? 'opacity-80 transform scale-105' : 'opacity-100'
                }`}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleDataPointClick(item, index)}
                rx={4}
              />
              <text
                x={x + barWidth / 2}
                y={height - 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-800 font-medium"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
    const chartWidth = 400;
    const chartHeight = height - 60;
    const pointRadius = 4;

    const points = data.map((item, index) => ({
      x: (index / (data.length - 1)) * chartWidth,
      y: chartHeight - (item.value / maxValue) * chartHeight + 20,
      value: item.value,
      label: item.label
    }));

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1={0}
            y1={20 + ratio * chartHeight}
            x2={chartWidth}
            y2={20 + ratio * chartHeight}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={3}
          className="drop-shadow-sm"
        />

        {/* Area fill */}
        <path
          d={`${pathData} L ${chartWidth} ${chartHeight + 20} L 0 ${chartHeight + 20} Z`}
          fill="url(#gradient)"
          opacity={0.2}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={pointRadius}
            fill="#F59E0B"
            stroke="white"
            strokeWidth={2}
            className={`cursor-pointer transition-all duration-200 ${
              hoveredIndex === index ? 'r-6 drop-shadow-lg' : ''
            }`}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleDataPointClick(data[index], index)}
          />
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {point.label}
          </text>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = -90; // Start from top

    return (
      <svg
        ref={svgRef}
        width="100%"
        height={300}
        viewBox="0 0 300 300"
        className="overflow-visible"
      >
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          const color = item.color || colors[index % colors.length];
          
          currentAngle += angle;

          return (
            <path
              key={index}
              d={pathData}
              fill={color}
              className={`cursor-pointer transition-all duration-200 ${
                hoveredIndex === index ? 'opacity-80 transform scale-105' : 'opacity-100'
              }`}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleDataPointClick(item, index)}
            />
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return null;
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const trend = calculateTrend();

  return (
    <div ref={chartRef} className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.percentage}%
              </span>
              <span className="text-sm text-gray-500">vs previous period</span>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="py-1">
                <button
                  onClick={() => handleExport('png')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={() => handleExport('svg')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export as SVG
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Maximize2 className="w-4 h-4" />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {renderChart()}

        {/* Tooltip */}
        {showTooltip && hoveredIndex !== null && (
          <div
            className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10
            }}
          >
            <div className="font-medium">{data[hoveredIndex].label}</div>
            <div className="text-gray-300">Value: {data[hoveredIndex].value}</div>
            {data[hoveredIndex].metadata && (
              <div className="text-xs text-gray-400 mt-1">
                Click for details
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && type === 'pie' && (
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm text-gray-500">({item.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
