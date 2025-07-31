import Link from "next/link";
import { Upload, Plus, BarChart3, Settings, ArrowRight, Sparkles } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "AI Resume Screening",
      description: "Upload from LinkedIn, Indeed, 20+ platforms",
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
      title: "Performance Analytics",
      description: "Track hiring metrics across all sources",
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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link
            key={action.title}
            href={action.href}
            className="block p-4 rounded-xl border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all duration-300 group transform hover:scale-105 hover:-translate-y-1"
            style={{
              animationDelay: `${index * 0.1}s`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                    {action.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transform group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </Link>
        ))}
      </div>

      {/* Enhanced Pro Tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 rounded-xl border border-yellow-200 hover:border-yellow-300 transition-all duration-300 group cursor-pointer">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">
                💡 Pro Tip
              </h4>
              <div className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                New
              </div>
            </div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
              Upload multiple resumes at once using our bulk upload feature for faster processing.
              <span className="font-medium text-yellow-600"> Try ZIP upload for 10+ files!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
