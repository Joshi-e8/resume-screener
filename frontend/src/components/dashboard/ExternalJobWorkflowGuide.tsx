"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, Upload, Brain, Users, BarChart3, CheckCircle } from "lucide-react";

export function ExternalJobWorkflowGuide() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Post Jobs Externally",
      icon: ExternalLink,
      description: "Post your jobs on LinkedIn, Indeed, Glassdoor, or any platform where candidates actively search",
      details: [
        "Use your existing job posting workflow",
        "No need to recreate jobs in our system",
        "Post where candidates actually look for jobs",
        "Leverage platform-specific features and reach"
      ],
      platforms: ["LinkedIn", "Indeed", "Glassdoor", "Company Website"]
    },
    {
      id: 2,
      title: "Collect Resumes",
      icon: Upload,
      description: "Gather resumes from all your external job postings in one place",
      details: [
        "Download resumes from job platforms",
        "Collect email applications",
        "Gather referral submissions",
        "Organize by source for tracking"
      ],
      methods: ["Platform Downloads", "Email Collection", "Direct Submissions", "Recruiter Uploads"]
    },
    {
      id: 3,
      title: "AI-Powered Screening",
      icon: Brain,
      description: "Upload resumes for intelligent processing and candidate analysis",
      details: [
        "AI extracts all candidate information",
        "Automatic skills and experience analysis",
        "Smart matching to job requirements",
        "Consistent screening across all sources"
      ],
      features: ["Data Extraction", "Skills Analysis", "Experience Matching", "Quality Scoring"]
    },
    {
      id: 4,
      title: "Manage Pipeline",
      icon: Users,
      description: "Streamline your hiring process with unified candidate management",
      details: [
        "Centralized candidate pipeline",
        "Interview scheduling and tracking",
        "Team collaboration tools",
        "Communication history"
      ],
      tools: ["Pipeline Management", "Interview Scheduling", "Team Notes", "Status Tracking"]
    },
    {
      id: 5,
      title: "Analytics & Optimization",
      icon: BarChart3,
      description: "Track performance across all platforms and optimize your hiring strategy",
      details: [
        "Compare platform performance",
        "Track time-to-hire metrics",
        "Analyze candidate quality by source",
        "Optimize future job posting strategy"
      ],
      metrics: ["Platform ROI", "Quality Metrics", "Time to Hire", "Cost per Hire"]
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          External Job Posting Workflow
        </h2>
        <p className="text-gray-600">
          Post jobs anywhere, screen candidates here. No duplicate work required.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeStep === step.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <step.icon className="w-4 h-4" />
            <span className="text-sm font-medium">Step {step.id}</span>
          </button>
        ))}
      </div>

      {/* Active Step Content */}
      {steps.map((step) => (
        <div
          key={step.id}
          className={`transition-all duration-300 ${
            activeStep === step.id ? 'block' : 'hidden'
          }`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-700 mb-4">
                  {step.description}
                </p>
                
                {/* Step Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {step.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {step.id === 1 ? 'Supported Platforms:' : 
                       step.id === 2 ? 'Collection Methods:' :
                       step.id === 3 ? 'AI Features:' :
                       step.id === 4 ? 'Management Tools:' :
                       'Analytics Metrics:'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(step.platforms || step.methods || step.features || step.tools || step.metrics)?.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Previous
            </button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index + 1 === activeStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
              disabled={activeStep === steps.length}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeStep === steps.length
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Quick Start CTA */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-green-900">Ready to get started?</h4>
            <p className="text-sm text-green-800">
              Upload your first batch of resumes and experience the power of AI-driven screening.
            </p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
            Upload Resumes
          </button>
        </div>
      </div>
    </div>
  );
}
