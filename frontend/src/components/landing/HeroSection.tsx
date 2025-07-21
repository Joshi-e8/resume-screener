import { CheckCircle, Zap, BarChart3, FileText, Sparkles, TrendingUp, Shield } from "lucide-react";

export function HeroSection() {
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      text: "AI-Powered Screening",
      description: "Advanced algorithms analyze resumes instantly"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: "Smart Job Matching",
      description: "Find perfect candidates automatically"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      text: "Analytics Dashboard",
      description: "Track performance with detailed insights"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      text: "Export Reports",
      description: "Generate comprehensive hiring reports"
    }
  ];

  return (
    <div className="relative">
      {/* Decorative Elements */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-primary rounded-full opacity-10 blur-xl"></div>
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent-pink rounded-full opacity-5 blur-2xl"></div>

      <div className="relative z-10 space-y-10">
        {/* Main Heading */}
        <div className="space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg" style={{ background: 'linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)' }}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Hiring Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
            <span className="text-gradient-primary">
              Resume Screener
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-2xl leading-relaxed">
            Transform your hiring process with AI-powered resume screening and intelligent job matching.
            <span className="text-gray-900 font-semibold"> Save time, find better candidates.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-accent-pink/20 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {feature.text}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                10x
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                Faster Screening
              </div>
              <div className="text-xs text-gray-500">
                vs manual review
              </div>
            </div>
            <div className="text-center group border-x border-gray-100">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                95%
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                Accuracy Rate
              </div>
              <div className="text-xs text-gray-500">
                AI matching precision
              </div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                24/7
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                Availability
              </div>
              <div className="text-xs text-gray-500">
                Always working
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-8 pt-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Enterprise Security</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Proven Results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
