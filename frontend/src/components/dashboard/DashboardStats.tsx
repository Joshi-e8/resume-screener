import { FileText, Briefcase, Users, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardStatsProps {
  stats?: {
    totalResumes: number;
    activeJobs: number;
    totalMatches: number;
    pendingReviews: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  // Default stats if none provided
  const defaultStats = {
    totalResumes: 247,
    activeJobs: 12,
    totalMatches: 156,
    pendingReviews: 8,
  };

  const currentStats = stats || defaultStats;
  const statCards = [
    {
      title: "Total Resumes",
      value: currentStats.totalResumes,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      title: "Active Jobs",
      value: currentStats.activeJobs,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+2",
      changeType: "increase" as const,
    },
    {
      title: "Total Matches",
      value: currentStats.totalMatches,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      title: "Pending Reviews",
      value: currentStats.pendingReviews,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "-3",
      changeType: "decrease" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div
          key={card.title}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-gray-200 cursor-pointer group"
          style={{
            animationDelay: `${index * 0.1}s`,
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                  {card.title}
                </p>
                {card.changeType === "increase" ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>

              <p className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                {card.value.toLocaleString()}
              </p>

              <div className="flex items-center gap-1">
                {card.changeType === "increase" ? (
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-600" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    card.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-sm text-gray-500">
                  from last month
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    card.changeType === "increase" ? "bg-green-400" : "bg-red-400"
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(parseInt(card.change.replace(/[^0-9]/g, '')) || 50), 100)}%`,
                    animationDelay: `${index * 0.2 + 0.5}s`
                  }}
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl ${card.bgColor} group-hover:scale-110 transition-all duration-300 ml-4`}>
              <card.icon className={`w-7 h-7 ${card.color} group-hover:animate-pulse`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
