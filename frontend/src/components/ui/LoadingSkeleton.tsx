"use client";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({ 
  className = "", 
  width, 
  height, 
  rounded = true, 
  circle = false 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200";
  const shapeClasses = circle ? "rounded-full" : rounded ? "rounded" : "";
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1">
          <Skeleton width="60%" height={20} className="mb-2" />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={16} className="mb-2" />
      <Skeleton width="80%" height={16} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} />
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80%" height={16} />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} width="90%" height={16} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
          <Skeleton circle width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="70%" height={18} className="mb-2" />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton width={200} height={24} className="mb-2" />
          <Skeleton width={150} height={16} />
        </div>
        <Skeleton width={100} height={32} />
      </div>
      
      <div className="h-64 flex items-end justify-between gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            width={20} 
            height={Math.random() * 200 + 50}
            className="flex-shrink-0"
          />
        ))}
      </div>
      
      <div className="flex justify-center gap-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton circle width={12} height={12} />
            <Skeleton width={60} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={16} />
        <Skeleton circle width={32} height={32} />
      </div>
      <Skeleton width={80} height={32} className="mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton width={60} height={14} />
        <Skeleton width={40} height={14} />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <Skeleton width={200} height={24} className="mb-6" />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width="100%" height={40} />
          </div>
          <div>
            <Skeleton width={120} height={16} className="mb-2" />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
        
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={100} />
        </div>
        
        <div className="flex gap-3">
          <Skeleton width={100} height={40} />
          <Skeleton width={120} height={40} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width={300} height={32} className="mb-2" />
          <Skeleton width={200} height={16} />
        </div>
        <Skeleton width={120} height={40} />
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      {/* Table */}
      <TableSkeleton />
    </div>
  );
}
