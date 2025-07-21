import Link from "next/link";
import { Upload, Plus, BarChart3, Settings } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Upload Resume",
      description: "Add new resumes to screen",
      icon: Upload,
      href: "/dashboard/resumes/upload",
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Create Job",
      description: "Post a new job opening",
      icon: Plus,
      href: "/dashboard/jobs/create",
      color: "text-green-600 bg-green-50 hover:bg-green-100",
    },
    {
      title: "View Analytics",
      description: "Check screening metrics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
    },
    {
      title: "Settings",
      description: "Configure preferences",
      icon: Settings,
      href: "/dashboard/settings",
      color: "text-orange-600 bg-orange-50 hover:bg-orange-100",
    },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-text-dark mb-6">
        Quick Actions
      </h2>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link
            key={action.title}
            href={action.href}
            className="block p-4 rounded-lg border border-gray-200 hover:border-accent-pink transition-all duration-200 group animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg transition-colors ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-text-dark group-hover:text-accent-pink transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-text-gray">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-dark">
              Pro Tip
            </h4>
            <p className="text-xs text-text-gray mt-1">
              Upload multiple resumes at once using our bulk upload feature for faster processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
