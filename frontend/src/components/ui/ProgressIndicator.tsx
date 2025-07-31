"use client";

import { Check, Circle, Clock } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  className?: string;
}

export function ProgressIndicator({
  steps,
  orientation = 'horizontal',
  showDescriptions = true,
  className = ""
}: ProgressIndicatorProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-white" />;
      case 'current':
        return <Circle className="w-4 h-4 text-white fill-current" />;
      case 'error':
        return <Circle className="w-4 h-4 text-white fill-current" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColors = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'current':
        return 'bg-yellow-500 border-yellow-500';
      case 'error':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const getConnectorColor = (currentStatus: string) => {
    if (currentStatus === 'completed') {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200
                ${getStepColors(step.status)}
              `}>
                {getStepIcon(step.status)}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`
                  w-0.5 h-8 mt-2 transition-colors duration-200
                  ${getConnectorColor(step.status)}
                `} />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0 pb-8">
              <h3 className={`
                text-sm font-medium transition-colors duration-200
                ${step.status === 'current' ? 'text-yellow-600' : 
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'}
              `}>
                {step.title}
              </h3>
              
              {showDescriptions && step.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
              )}
              
              {step.status === 'current' && (
                <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                  <Clock className="w-3 h-3" />
                  In progress
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step */}
          <div className="flex flex-col items-center">
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200
              ${getStepColors(step.status)}
            `}>
              {getStepIcon(step.status)}
            </div>
            
            <div className="mt-2 text-center">
              <h3 className={`
                text-xs font-medium transition-colors duration-200
                ${step.status === 'current' ? 'text-yellow-600' : 
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'}
              `}>
                {step.title}
              </h3>
              
              {showDescriptions && step.description && (
                <p className="text-xs text-gray-500 mt-1 max-w-20">
                  {step.description}
                </p>
              )}
            </div>
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-0.5 mx-4 transition-colors duration-200
              ${getConnectorColor(step.status)}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}

// Linear progress bar
interface LinearProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'yellow' | 'blue' | 'green' | 'red';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function LinearProgress({
  value,
  max = 100,
  size = 'md',
  color = 'yellow',
  showLabel = true,
  label,
  className = ""
}: LinearProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'yellow' | 'blue' | 'green' | 'red';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'yellow',
  showLabel = true,
  label,
  className = ""
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    yellow: 'stroke-yellow-500',
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    red: 'stroke-red-500'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${colorClasses[color]}`}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-sm text-gray-600 mt-1">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Multi-step progress with actions
interface MultiStepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkip?: boolean;
  className?: string;
}

export function MultiStepProgress({
  steps,
  currentStep,
  onStepClick,
  allowSkip = false,
  className = ""
}: MultiStepProgressProps) {
  const handleStepClick = (index: number) => {
    if (!onStepClick) return;
    
    // Allow clicking on completed steps or current step
    if (index <= currentStep || allowSkip) {
      onStepClick(index);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Step {currentStep + 1} of {steps.length}
        </h3>
        <LinearProgress
          value={currentStep + 1}
          max={steps.length}
          size="sm"
          className="w-32"
          showLabel={false}
        />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = (index <= currentStep || allowSkip) && onStepClick;

          return (
            <div
              key={step.id}
              className={`
                flex items-center gap-4 p-3 rounded-lg transition-all duration-200
                ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}
                ${isCurrent ? 'bg-yellow-50 border border-yellow-200' : ''}
              `}
              onClick={() => handleStepClick(index)}
            >
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200
                ${isCompleted ? 'bg-green-500 border-green-500' :
                  isCurrent ? 'bg-yellow-500 border-yellow-500' :
                  'bg-white border-gray-300'}
              `}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className={`text-sm font-medium ${
                    isCurrent ? 'text-white' : 'text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h4 className={`font-medium ${
                  isCurrent ? 'text-yellow-700' :
                  isCompleted ? 'text-green-700' :
                  'text-gray-500'
                }`}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {isCurrent && (
                <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                  Current
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
