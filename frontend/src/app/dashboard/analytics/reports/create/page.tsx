"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Calendar, 
  BarChart3,
  FileText
} from "lucide-react";
import Link from "next/link";

interface ReportFormData {
  name: string;
  description: string;
  type: 'hiring' | 'performance' | 'pipeline' | 'custom';
  metrics: string[];
  filters: {
    dateRange: string;
    departments: string[];
    jobTypes: string[];
    locations: string[];
  };
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  visualization: {
    charts: string[];
    includeTable: boolean;
    includeMetrics: boolean;
  };
}

const initialFormData: ReportFormData = {
  name: '',
  description: '',
  type: 'hiring',
  metrics: [],
  filters: {
    dateRange: 'last-30-days',
    departments: [],
    jobTypes: [],
    locations: []
  },
  schedule: {
    enabled: false,
    frequency: 'weekly',
    time: '09:00',
    recipients: []
  },
  visualization: {
    charts: [],
    includeTable: true,
    includeMetrics: true
  }
};

const availableMetrics = [
  { id: 'total-resumes', label: 'Total Resumes', category: 'Volume' },
  { id: 'applications', label: 'Applications', category: 'Volume' },
  { id: 'hires', label: 'Successful Hires', category: 'Conversion' },
  { id: 'time-to-hire', label: 'Time to Hire', category: 'Efficiency' },
  { id: 'conversion-rate', label: 'Conversion Rate', category: 'Conversion' },
  { id: 'cost-per-hire', label: 'Cost per Hire', category: 'Efficiency' },
  { id: 'source-effectiveness', label: 'Source Effectiveness', category: 'Quality' },
  { id: 'candidate-satisfaction', label: 'Candidate Satisfaction', category: 'Quality' }
];

const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];

export default function CreateReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ReportFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section: keyof ReportFormData, field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (section: keyof ReportFormData, field: string, value: string) => {
    setFormData(prev => {
      const sectionData = prev[section] as Record<string, unknown>;
      const currentArray = sectionData[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, unknown>),
          [field]: newArray
        }
      };
    });
  };



  const handleSubmit = async (action: 'save' | 'run') => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`${action === 'save' ? 'Saving' : 'Running'} report:`, formData);
    
    // Redirect to reports page
    router.push('/dashboard/analytics/reports');
  };

  const isFormValid = formData.name && formData.description && formData.metrics.length > 0;

  const steps = [
    { id: 1, title: 'Basic Info', icon: FileText },
    { id: 2, title: 'Metrics & Data', icon: BarChart3 },
    { id: 3, title: 'Visualization', icon: BarChart3 },
    { id: 4, title: 'Schedule & Share', icon: Calendar }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/analytics/reports"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Create Custom Report
          </h1>
          <p className="text-gray-600 mt-1">
            Build a custom analytics report with your preferred metrics and visualizations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit('save')}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            Save Draft
          </button>
          
          <button
            onClick={() => handleSubmit('run')}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            Create & Run
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  currentStep >= step.id
                    ? 'bg-yellow-500 border-yellow-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-yellow-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Monthly Hiring Performance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="hiring">Hiring Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="pipeline">Pipeline Report</option>
                    <option value="custom">Custom Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this report will analyze and its purpose..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Metrics & Data Filters</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Metrics to Include *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableMetrics.map((metric) => (
                    <label key={metric.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.metrics.includes(metric.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('metrics', [...formData.metrics, metric.id]);
                          } else {
                            handleInputChange('metrics', formData.metrics.filter(m => m !== metric.id));
                          }
                        }}
                        className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                        <p className="text-xs text-gray-500">{metric.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={formData.filters.dateRange}
                    onChange={(e) => handleNestedChange('filters', 'dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="last-7-days">Last 7 days</option>
                    <option value="last-30-days">Last 30 days</option>
                    <option value="last-90-days">Last 90 days</option>
                    <option value="last-year">Last year</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departments
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {departments.map((dept) => (
                      <label key={dept} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.filters.departments.includes(dept)}
                          onChange={() => handleArrayToggle('filters', 'departments', dept)}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
          
          <button
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === steps.length}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
