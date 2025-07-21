import { FileText, Briefcase, Users, Clock } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalResumes: number;
    activeJobs: number;
    totalMatches: number;
    pendingReviews: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Resumes",
      value: stats.totalResumes,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+2",
      changeType: "increase" as const,
    },
    {
      title: "Total Matches",
      value: stats.totalMatches,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews,
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
          className="card animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-gray">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-text-dark mt-1">
                {card.value}
              </p>
              <div className="flex items-center mt-2">
                <span
                  className={`text-xs font-medium ${
                    card.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-xs text-text-light ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
