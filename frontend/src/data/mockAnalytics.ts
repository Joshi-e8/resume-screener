export interface AnalyticsMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartDataPoint[];
  color: string;
  period: string;
}

export interface HiringFunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  metric: string;
  value: number;
  change: number;
  avatar?: string;
}

// Mock Analytics Metrics
export const mockAnalyticsMetrics: AnalyticsMetric[] = [
  {
    id: 'total-resumes',
    title: 'Total Resumes',
    value: 1247,
    change: 12.5,
    changeType: 'increase',
    period: 'vs last month',
    icon: '📄',
    color: 'blue'
  },
  {
    id: 'active-jobs',
    title: 'Active Jobs',
    value: 23,
    change: 4.2,
    changeType: 'increase',
    period: 'vs last month',
    icon: '💼',
    color: 'green'
  },
  {
    id: 'applications',
    title: 'Applications',
    value: 892,
    change: -2.1,
    changeType: 'decrease',
    period: 'vs last month',
    icon: '📝',
    color: 'yellow'
  },
  {
    id: 'hires',
    title: 'Successful Hires',
    value: 34,
    change: 18.9,
    changeType: 'increase',
    period: 'vs last month',
    icon: '✅',
    color: 'purple'
  },
  {
    id: 'time-to-hire',
    title: 'Avg Time to Hire',
    value: 18,
    change: -12.3,
    changeType: 'decrease',
    period: 'days',
    icon: '⏱️',
    color: 'orange'
  },
  {
    id: 'conversion-rate',
    title: 'Conversion Rate',
    value: 3.8,
    change: 0.5,
    changeType: 'increase',
    period: 'percentage',
    icon: '📈',
    color: 'indigo'
  }
];

// Mock Chart Data
export const mockResumesTrend: ChartDataPoint[] = [
  { date: '2024-01-01', value: 45 },
  { date: '2024-01-02', value: 52 },
  { date: '2024-01-03', value: 48 },
  { date: '2024-01-04', value: 61 },
  { date: '2024-01-05', value: 55 },
  { date: '2024-01-06', value: 67 },
  { date: '2024-01-07', value: 73 },
  { date: '2024-01-08', value: 69 },
  { date: '2024-01-09', value: 78 },
  { date: '2024-01-10', value: 82 },
  { date: '2024-01-11', value: 76 },
  { date: '2024-01-12', value: 89 },
  { date: '2024-01-13', value: 94 },
  { date: '2024-01-14', value: 87 }
];

export const mockApplicationsTrend: ChartDataPoint[] = [
  { date: '2024-01-01', value: 23 },
  { date: '2024-01-02', value: 31 },
  { date: '2024-01-03', value: 28 },
  { date: '2024-01-04', value: 42 },
  { date: '2024-01-05', value: 38 },
  { date: '2024-01-06', value: 45 },
  { date: '2024-01-07', value: 52 },
  { date: '2024-01-08', value: 48 },
  { date: '2024-01-09', value: 56 },
  { date: '2024-01-10', value: 61 },
  { date: '2024-01-11', value: 58 },
  { date: '2024-01-12', value: 67 },
  { date: '2024-01-13', value: 72 },
  { date: '2024-01-14', value: 69 }
];

export const mockHiringFunnel: HiringFunnelData[] = [
  { stage: 'Applications', count: 892, percentage: 100, color: '#3B82F6' },
  { stage: 'Screening', count: 445, percentage: 49.9, color: '#8B5CF6' },
  { stage: 'Interview', count: 178, percentage: 20.0, color: '#F59E0B' },
  { stage: 'Final Round', count: 67, percentage: 7.5, color: '#10B981' },
  { stage: 'Offer', count: 42, percentage: 4.7, color: '#EF4444' },
  { stage: 'Hired', count: 34, percentage: 3.8, color: '#059669' }
];

export const mockDepartmentHiring: ChartDataPoint[] = [
  { date: 'Engineering', value: 45, label: 'Engineering' },
  { date: 'Product', value: 23, label: 'Product' },
  { date: 'Design', value: 18, label: 'Design' },
  { date: 'Marketing', value: 15, label: 'Marketing' },
  { date: 'Sales', value: 12, label: 'Sales' },
  { date: 'Operations', value: 8, label: 'Operations' }
];

export const mockTopSkills: ChartDataPoint[] = [
  { date: 'JavaScript', value: 156, label: 'JavaScript' },
  { date: 'React', value: 134, label: 'React' },
  { date: 'Python', value: 128, label: 'Python' },
  { date: 'Node.js', value: 98, label: 'Node.js' },
  { date: 'TypeScript', value: 87, label: 'TypeScript' },
  { date: 'AWS', value: 76, label: 'AWS' },
  { date: 'Docker', value: 65, label: 'Docker' },
  { date: 'MongoDB', value: 54, label: 'MongoDB' }
];

export const mockTopPerformers: TopPerformer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    metric: 'Hires This Month',
    value: 8,
    change: 33.3
  },
  {
    id: '2',
    name: 'Mike Chen',
    metric: 'Fastest Time to Hire',
    value: 12,
    change: -25.0
  },
  {
    id: '3',
    name: 'Emily Davis',
    metric: 'Highest Conversion Rate',
    value: 6.2,
    change: 15.8
  },
  {
    id: '4',
    name: 'John Smith',
    metric: 'Most Applications Reviewed',
    value: 156,
    change: 22.1
  }
];

export const mockAnalyticsCharts: AnalyticsChart[] = [
  {
    id: 'resumes-trend',
    title: 'Resume Submissions',
    type: 'area',
    data: mockResumesTrend,
    color: '#3B82F6',
    period: 'Last 14 days'
  },
  {
    id: 'applications-trend',
    title: 'Job Applications',
    type: 'line',
    data: mockApplicationsTrend,
    color: '#10B981',
    period: 'Last 14 days'
  },
  {
    id: 'department-hiring',
    title: 'Hiring by Department',
    type: 'bar',
    data: mockDepartmentHiring,
    color: '#F59E0B',
    period: 'This quarter'
  },
  {
    id: 'top-skills',
    title: 'Most Requested Skills',
    type: 'bar',
    data: mockTopSkills,
    color: '#8B5CF6',
    period: 'Last 30 days'
  }
];

// Time period options
export const timePeriods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
];

// Export options
export const exportFormats = [
  { value: 'pdf', label: 'PDF Report' },
  { value: 'excel', label: 'Excel Spreadsheet' },
  { value: 'csv', label: 'CSV Data' },
  { value: 'png', label: 'PNG Images' }
];
