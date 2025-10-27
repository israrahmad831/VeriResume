import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Plus,
  Briefcase,
  FolderOpen,
  BarChart2,
  AlertTriangle,
  FileText,
  Bell,
  Settings,
  Menu,
  Users,
  Eye,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  Filter,
  Search,
  Calendar,
  DollarSign,
  MapPin,
  LogOut,
} from "lucide-react";

const HRDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(5);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/hr/dashboard", active: true },
    { icon: Plus, label: "Post Job", path: "/hr/job/new" },
    { icon: Briefcase, label: "All Jobs", path: "/hr/jobs" },
    { icon: FolderOpen, label: "Resume Screening", path: "/hr/screening" },
    { icon: BarChart2, label: "Candidate Ranking", path: "/hr/ranking" },
    { icon: AlertTriangle, label: "Fraud Detection", path: "/hr/fraud" },
    { icon: FileText, label: "Reports", path: "/hr/reports" },
    {
      icon: Bell,
      label: "Notifications",
      path: "/hr/notifications",
      badge: notifications,
    },
    { icon: Settings, label: "Profile Settings", path: "/hr/settings" },
  ];

  const activeJobs = [
    {
      id: 1,
      title: "Senior Software Engineer",
      posted: "5 days ago",
      applicants: 42,
      screened: 38,
      status: "active",
    },
    {
      id: 2,
      title: "Product Manager",
      posted: "2 weeks ago",
      applicants: 28,
      screened: 28,
      status: "active",
    },
    {
      id: 3,
      title: "UX Designer",
      posted: "1 week ago",
      applicants: 35,
      screened: 30,
      status: "active",
    },
  ];

  const topCandidates = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Software Engineer",
      match: 95,
      skills: 92,
      experience: 5,
      status: "authentic",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Engineer",
      match: 89,
      skills: 88,
      experience: 4,
      status: "authentic",
    },
    {
      id: 3,
      name: "Emily Davis",
      role: "Software Engineer",
      match: 87,
      skills: 85,
      experience: 6,
      status: "authentic",
    },
    {
      id: 4,
      name: "Robert Wilson",
      role: "Software Engineer",
      match: 82,
      skills: 80,
      experience: 3,
      status: "flagged",
    },
  ];

  const fraudAlerts = [
    {
      id: 1,
      name: "John Smith Resume.pdf",
      score: 45,
      reason: "Copied content detected",
      severity: "high",
    },
    {
      id: 2,
      name: "Jane Doe CV.pdf",
      score: 62,
      reason: "Inconsistent dates",
      severity: "medium",
    },
    {
      id: 3,
      name: "Alex Brown Resume.pdf",
      score: 58,
      reason: "Suspicious formatting",
      severity: "medium",
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
              <Shield className="text-cyan-400" size={28} />
              <div>
                <p className="font-bold text-lg">VeriResume</p>
                <p className="text-xs text-slate-400">HR Portal</p>
              </div>
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
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-4">
              <Upload className="text-white mb-2" size={24} />
              <p className="text-sm font-semibold mb-1">Quick Actions</p>
              <p className="text-xs text-blue-100 mb-3">
                Upload job or resumes
              </p>
              <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all">
                Upload Now
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-4 py-3 rounded-xl transition-all flex items-center gap-2 justify-center font-semibold"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Recruiter Dashboard
              </h1>
              <p className="text-slate-600">TechCorp Inc.</p>
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
                  <span className="text-white font-semibold text-sm">TC</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-3 rounded-xl">
                  <Briefcase className="text-blue-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">5</span>
              </div>
              <h3 className="text-slate-600 mb-1">Active Job Posts</h3>
              <p className="text-sm text-blue-600 font-semibold">
                +2 this week
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                  <Users className="text-green-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">127</span>
              </div>
              <h3 className="text-slate-600 mb-1">Total Applicants</h3>
              <p className="text-sm text-green-600 font-semibold">
                15 new today
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-xl">
                  <BarChart2 className="text-cyan-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">94%</span>
              </div>
              <h3 className="text-slate-600 mb-1">AI Screened</h3>
              <p className="text-sm text-cyan-600 font-semibold">
                119 of 127 resumes
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-red-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-red-100 to-rose-100 p-3 rounded-xl">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <span className="text-3xl font-bold text-slate-900">3</span>
              </div>
              <h3 className="text-slate-600 mb-1">Fraud Alerts</h3>
              <p className="text-sm text-red-600 font-semibold">
                Requires attention
              </p>
            </div>
          </div>

          {/* Active Jobs & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="text-cyan-600" size={24} />
                  Active Job Postings
                </h2>
                <a
                  href="/hr/job/new"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all text-sm flex items-center gap-2"
                >
                  <Plus size={18} />
                  Post New Job
                </a>
              </div>

              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-slate-200 rounded-xl p-5 hover:border-cyan-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Posted {job.posted}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {job.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-slate-900">
                          {job.applicants}
                        </p>
                        <p className="text-xs text-slate-600">Applicants</p>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-cyan-600">
                          {job.screened}
                        </p>
                        <p className="text-xs text-slate-600">AI Screened</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round((job.screened / job.applicants) * 100)}%
                        </p>
                        <p className="text-xs text-slate-600">Completion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Upload className="text-cyan-600" size={20} />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all border border-blue-200">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Upload size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm">
                      Upload Job Description
                    </p>
                    <p className="text-xs text-slate-600">
                      Quick match candidates
                    </p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-xl transition-all border border-cyan-200">
                  <div className="bg-cyan-600 p-2 rounded-lg">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm">
                      Upload Resumes
                    </p>
                    <p className="text-xs text-slate-600">Bulk screening</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all border border-green-200">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <BarChart2 size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm">
                      Run AI Screening
                    </p>
                    <p className="text-xs text-slate-600">Auto analyze pool</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Top Candidates Ranking */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-cyan-600" size={24} />
                Top Ranked Candidates
              </h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm flex items-center gap-2">
                  <Filter size={18} />
                  Filter
                </button>
                <button className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition-all text-sm flex items-center gap-2">
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Candidate
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Role
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Match %
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Skills %
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Experience
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {candidate.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {candidate.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {candidate.role}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-cyan-600">
                            {candidate.match}%
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 h-1.5 rounded-full"
                              style={{ width: `${candidate.match}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-slate-700 font-semibold">
                          {candidate.skills}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-slate-700">
                          {candidate.experience} years
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {candidate.status === "authentic" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 justify-center">
                            <CheckCircle size={14} />
                            Authentic
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 justify-center">
                            <XCircle size={14} />
                            Flagged
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-all">
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fraud Detection Summary */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="text-cyan-600" size={20} />
                Authenticity Overview
              </h3>

              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(124 / 127) * 502.4} 502.4`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-slate-900">
                    97.6%
                  </span>
                  <span className="text-sm text-slate-600">Authentic</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Authentic
                  </span>
                  <span className="font-bold text-slate-900">124</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Flagged
                  </span>
                  <span className="font-bold text-slate-900">3</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  Recent Fraud Alerts
                </h3>
                <a
                  href="/hr/fraud"
                  className="text-red-600 font-semibold hover:text-red-700 text-sm"
                >
                  View All →
                </a>
              </div>

              <div className="space-y-3">
                {fraudAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      alert.severity === "high"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText
                            size={16}
                            className={
                              alert.severity === "high"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }
                          />
                          <span className="font-semibold text-slate-900 text-sm">
                            {alert.name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {alert.reason}
                        </p>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-xs text-slate-500">
                              Authenticity Score
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    alert.severity === "high"
                                      ? "bg-red-600"
                                      : "bg-yellow-600"
                                  }`}
                                  style={{ width: `${alert.score}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {alert.score}%
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              alert.severity === "high"
                                ? "bg-red-200 text-red-700"
                                : "bg-yellow-200 text-yellow-700"
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-white rounded-lg transition-all">
                        <Eye
                          size={18}
                          className={
                            alert.severity === "high"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HRDashboard;
