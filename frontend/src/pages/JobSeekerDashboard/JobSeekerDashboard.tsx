import React, { useState } from "react";
import {
  Home,
  Upload,
  Brain,
  Briefcase,
  FileText,
  Bell,
  CreditCard,
  Settings,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Bookmark,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
} from "lucide-react";

const JobSeekerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(3);

  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/jobseeker/dashboard",
      active: true,
    },
    { icon: Upload, label: "Upload Resume", path: "/jobseeker/upload" },
    { icon: Brain, label: "AI Analysis", path: "/jobseeker/analysis" },
    { icon: Briefcase, label: "Job Recommendations", path: "/jobseeker/jobs" },
    { icon: FileText, label: "Enhanced Resume", path: "/jobseeker/enhanced" },
    {
      icon: Bell,
      label: "Notifications",
      path: "/jobseeker/notifications",
      badge: notifications,
    },
    { icon: CreditCard, label: "Premium", path: "/jobseeker/premium" },
    { icon: Settings, label: "Profile Settings", path: "/jobseeker/settings" },
  ];

  const jobs = [
    {
      id: 1,
      title: "Senior Data Analyst",
      company: "TechCorp",
      location: "Remote",
      salary: "$80k - $100k",
      match: 92,
      posted: "2 days ago",
      logo: "🏢",
    },
    {
      id: 2,
      title: "Marketing Manager",
      company: "StartupXYZ",
      location: "New York, NY",
      salary: "$70k - $90k",
      match: 85,
      posted: "1 week ago",
      logo: "🚀",
    },
    {
      id: 3,
      title: "Product Designer",
      company: "DesignHub",
      location: "San Francisco, CA",
      salary: "$90k - $120k",
      match: 78,
      posted: "3 days ago",
      logo: "🎨",
    },
  ];

  const aiSuggestions = [
    {
      type: "critical",
      text: 'Add more data analysis keywords like "SQL", "Python", "Tableau"',
    },
    {
      type: "warning",
      text: "Your work experience section lacks quantifiable achievements",
    },
    {
      type: "tip",
      text: 'Use power verbs: "Developed", "Implemented", "Designed"',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-900 to-blue-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-400" size={28} />
              <span className="font-bold text-xl">VeriResume</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <a
              key={idx}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "hover:bg-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </a>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-4">
              <Sparkles className="text-white mb-2" size={24} />
              <p className="text-sm font-semibold mb-1">Upgrade to Premium</p>
              <p className="text-xs text-blue-100 mb-3">
                Get AI enhancement & more features
              </p>
              <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">Welcome back, John Doe!</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-3 hover:bg-slate-100 rounded-xl transition-all">
                <Bell size={20} className="text-slate-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">JD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-3 rounded-xl">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">82</span>
              </div>
              <h3 className="text-slate-600 mb-2">Resume Score</h3>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full"
                  style={{ width: "82%" }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  Compatible
                </span>
              </div>
              <h3 className="text-slate-600 mb-2">ATS Compatibility</h3>
              <p className="text-sm text-slate-500">
                Your resume passes ATS systems
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-xl">
                  <Briefcase className="text-cyan-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">23</span>
              </div>
              <h3 className="text-slate-600 mb-2">Job Matches</h3>
              <p className="text-sm text-cyan-600 font-semibold flex items-center gap-1">
                View all <ChevronRight size={16} />
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white p-3 rounded-xl">
                  <Sparkles className="text-amber-600" size={24} />
                </div>
                <Award className="text-amber-600" size={32} />
              </div>
              <h3 className="text-slate-600 mb-2">Premium Status</h3>
              <button className="text-sm px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all">
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Resume Analysis & Chart */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="text-cyan-600" size={24} />
                  AI Resume Analysis
                </h2>
                <button className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition-all text-sm">
                  Re-Analyze
                </button>
              </div>

              <div className="space-y-4">
                {aiSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 p-4 rounded-xl ${
                      suggestion.type === "critical"
                        ? "bg-red-50 border border-red-200"
                        : suggestion.type === "warning"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {suggestion.type === "critical" ? (
                      <AlertCircle
                        className="text-red-600 flex-shrink-0"
                        size={20}
                      />
                    ) : suggestion.type === "warning" ? (
                      <AlertCircle
                        className="text-yellow-600 flex-shrink-0"
                        size={20}
                      />
                    ) : (
                      <Zap className="text-blue-600 flex-shrink-0" size={20} />
                    )}
                    <p className="text-slate-700 text-sm">{suggestion.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  💡 Pro Tip
                </p>
                <p className="text-sm text-slate-600">
                  Add quantifiable achievements like "Increased sales by 40%" to
                  boost your score by 15 points!
                </p>
              </div>

              <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2">
                <Sparkles size={20} />
                Enhance with AI (Premium)
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="text-cyan-600" size={20} />
                Resume Metrics
              </h3>
              <div className="space-y-6">
                {[
                  {
                    label: "Structure",
                    score: 85,
                    color: "from-blue-600 to-cyan-600",
                  },
                  {
                    label: "Grammar",
                    score: 92,
                    color: "from-green-600 to-emerald-600",
                  },
                  {
                    label: "Readability",
                    score: 78,
                    color: "from-amber-600 to-yellow-600",
                  },
                  {
                    label: "ATS Score",
                    score: 88,
                    color: "from-cyan-600 to-blue-600",
                  },
                ].map((metric, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">
                        {metric.label}
                      </span>
                      <span className="text-slate-900 font-bold">
                        {metric.score}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${metric.color} h-3 rounded-full transition-all`}
                        style={{ width: `${metric.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job Recommendations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="text-cyan-600" size={24} />
                Recommended Jobs for You
              </h2>
              <a
                href="/jobseeker/jobs"
                className="text-cyan-600 font-semibold hover:text-cyan-700 flex items-center gap-1"
              >
                View All <ChevronRight size={20} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-cyan-400 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{job.logo}</div>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <Bookmark
                        size={18}
                        className="text-slate-400 group-hover:text-cyan-600"
                      />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-2">{job.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{job.company}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign size={16} className="text-slate-400" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={16} className="text-slate-400" />
                      <span>{job.posted}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Match</span>
                      <span className="text-cyan-600 font-bold">
                        {job.match}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full"
                        style={{ width: `${job.match}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all">
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Premium CTA Banner */}
          <div className="mt-8 bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900 rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl"></div>
            </div>
            <div className="relative">
              <Sparkles className="mx-auto mb-4 text-cyan-300" size={48} />
              <h2 className="text-3xl font-bold mb-3">
                Upgrade to Premium for AI-Powered Resume Enhancement
              </h2>
              <p className="text-blue-100 mb-6 text-lg">
                Get 1-click downloads, advanced analysis, and priority job
                matches
              </p>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg">
                Upgrade Now - $29/month
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
