import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Users,
  Briefcase,
  AlertTriangle,
  Brain,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Clock,
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Shield,
  Eye,
  Edit2,
  Trash2,
  Search,
  Download,
  Plus,
  PlayCircle,
  PauseCircle,
  Send,
  UserPlus,
  Building2,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(8);
  const [expandedMenus, setExpandedMenus] = useState({
    users: true,
    analytics: true,
  });
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/admin/dashboard", active: true },
    {
      icon: Users,
      label: "Users",
      expandable: true,
      expanded: expandedMenus.users,
      submenu: [
        { label: "All Users", path: "/admin/users" },
        { label: "Job Seekers", path: "/admin/users/seekers" },
        { label: "HR Recruiters", path: "/admin/users/recruiters" },
      ],
    },
    { icon: Briefcase, label: "Job Posts", path: "/admin/jobs" },
    {
      icon: AlertTriangle,
      label: "Fraud Reports",
      path: "/admin/fraud",
      badge: 15,
    },
    {
      icon: Brain,
      label: "AI Analytics",
      expandable: true,
      expanded: expandedMenus.analytics,
      submenu: [
        { label: "Usage Stats", path: "/admin/ai-analytics" },
        { label: "Fraud Trends", path: "/admin/ai-analytics/fraud" },
      ],
    },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: FileText, label: "Premium Plans", path: "/admin/plans" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: Clock, label: "Logs", path: "/admin/logs" },
  ];

  // Chart Data
  const userGrowthData = [
    { name: "Week 1", users: 150 },
    { name: "Week 2", users: 280 },
    { name: "Week 3", users: 420 },
    { name: "Week 4", users: 680 },
    { name: "Week 5", users: 920 },
    { name: "Week 6", users: 1245 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 2400 },
    { month: "Feb", revenue: 3800 },
    { month: "Mar", revenue: 4200 },
    { month: "Apr", revenue: 5100 },
    { month: "May", revenue: 6300 },
    { month: "Jun", revenue: 7800 },
  ];

  const aiUsageData = [
    { name: "Resume Analysis", value: 65 },
    { name: "Job Matching", value: 25 },
    { name: "Fraud Detection", value: 10 },
  ];

  const COLORS = ["#0ea5e9", "#06b6d4", "#3b82f6"];

  const recentUsers = [
    {
      id: 1,
      name: "John Smith",
      role: "Job Seeker",
      status: "Active",
      joined: "2025-10-25",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "HR",
      status: "Active",
      joined: "2025-10-24",
    },
    {
      id: 3,
      name: "Mike Davis",
      role: "Job Seeker",
      status: "Suspended",
      joined: "2025-10-23",
    },
    {
      id: 4,
      name: "Emily Chen",
      role: "HR",
      status: "Active",
      joined: "2025-10-22",
    },
  ];

  const fraudReports = [
    {
      id: 1,
      resume: "john_doe_resume.pdf",
      score: 45,
      status: "Flagged",
      reason: "Duplicate content",
    },
    {
      id: 2,
      resume: "jane_smith_cv.pdf",
      score: 62,
      status: "Under Review",
      reason: "Inconsistent dates",
    },
    {
      id: 3,
      resume: "alex_brown_resume.pdf",
      score: 38,
      status: "Flagged",
      reason: "Fake credentials",
    },
  ];

  const premiumPlans = [
    { id: 1, name: "Free", price: 0, users: 1125, color: "slate" },
    { id: 2, name: "Premium", price: 29, users: 120, color: "cyan" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white transition-all duration-300 flex flex-col overflow-y-auto`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-slate-900 z-10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="text-cyan-400" size={28} />
              <div>
                <p className="font-bold text-lg">VeriResume</p>
                <p className="text-xs text-cyan-400">Admin Portal</p>
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

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item, idx) => (
            <div key={idx}>
              {item.expandable ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label.toLowerCase())}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/10 text-slate-300 hover:text-white"
                  >
                    <item.icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            item.expanded ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {sidebarOpen && item.expanded && item.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((sub, subIdx) => (
                        <a
                          key={subIdx}
                          href={sub.path}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <ChevronRight size={14} />
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <a
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
              )}
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all">
                <Send size={18} />
                <span className="text-sm font-semibold">Send Announcement</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                <PlayCircle size={18} />
                <span className="text-sm font-semibold">Maintenance Mode</span>
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
          <div className="px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Admin Dashboard
                </h1>
                <p className="text-slate-600">System Overview & Management</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users, resumes..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                </div>
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
                    <Shield size={20} className="text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Admin</p>
                    <p className="text-slate-600 text-xs">Superuser</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-8">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-3 rounded-xl">
                  <Users className="text-blue-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-slate-600 text-sm mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-slate-900">1,245</p>
              <p className="text-xs text-green-600 mt-2">+12% this week</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-xl">
                  <UserPlus className="text-cyan-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-slate-600 text-sm mb-1">Job Seekers</h3>
              <p className="text-3xl font-bold text-slate-900">865</p>
              <p className="text-xs text-cyan-600 mt-2">69% of total</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-slate-600 text-sm mb-1">HR Recruiters</h3>
              <p className="text-3xl font-bold text-slate-900">380</p>
              <p className="text-xs text-blue-600 mt-2">31% of total</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                  <CreditCard className="text-green-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-slate-600 text-sm mb-1">Premium Users</h3>
              <p className="text-3xl font-bold text-slate-900">120</p>
              <p className="text-xs text-green-600 mt-2">$3,480/month</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-red-400 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-red-100 to-rose-100 p-3 rounded-xl">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                  Alert
                </span>
              </div>
              <h3 className="text-slate-600 text-sm mb-1">Flagged Resumes</h3>
              <p className="text-3xl font-bold text-slate-900">15</p>
              <p className="text-xs text-red-600 mt-2">Requires review</p>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-cyan-600" size={20} />
                  User Growth
                </h2>
                <select className="px-3 py-1 border border-slate-300 rounded-lg text-sm">
                  <option>Last 6 weeks</option>
                  <option>Last 30 days</option>
                  <option>All Time</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#06b6d4"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="text-green-600" size={20} />
                  Revenue Overview
                </h2>
                <select className="px-3 py-1 border border-slate-300 rounded-lg text-sm">
                  <option>Last 6 months</option>
                  <option>This Year</option>
                  <option>All Time</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" />
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Brain className="text-cyan-600" size={20} />
                AI Analysis Usage
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={aiUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aiUsageData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {aiUsageData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx] }}
                      ></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-cyan-600" size={20} />
                  Premium Plans Overview
                </h2>
                <button className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition-all text-sm flex items-center gap-2">
                  <Plus size={16} />
                  Add Plan
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {premiumPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-xl p-5 ${
                      plan.color === "cyan"
                        ? "border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">
                        {plan.name}
                      </h3>
                      <button className="p-2 hover:bg-white rounded-lg transition-all">
                        <Edit2 size={16} className="text-slate-600" />
                      </button>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-2">
                      ${plan.price}
                      <span className="text-sm text-slate-600 font-normal">
                        /month
                      </span>
                    </p>
                    <p className="text-slate-600 mb-4">
                      {plan.users} active users
                    </p>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-slate-600 mb-1">
                        Monthly Revenue
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        ${plan.price * plan.users}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-cyan-600" size={20} />
                Recent Users
              </h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition-all text-sm flex items-center gap-2">
                  <UserPlus size={16} />
                  Add User
                </button>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm flex items-center gap-2">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Role
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Joined On
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === "HR"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-cyan-100 text-cyan-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {user.status === "Active" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <XCircle size={14} />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">
                        {user.joined}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fraud Reports Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                Recent Fraud Reports
              </h2>
              <a
                href="/admin/fraud"
                className="text-red-600 font-semibold hover:text-red-700 text-sm"
              >
                View All Reports →
              </a>
            </div>
            <div className="space-y-3">
              {fraudReports.map((report) => (
                <div
                  key={report.id}
                  className="border-2 border-red-200 bg-red-50 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-red-600" />
                        <span className="font-semibold text-slate-900 text-sm">
                          {report.resume}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <span className="text-xs text-slate-500">
                            Authenticity Score
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${report.score}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {report.score}%
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            report.status === "Flagged"
                              ? "bg-red-200 text-red-700"
                              : "bg-yellow-200 text-yellow-700"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Reason:</span>{" "}
                        {report.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white rounded-lg transition-all">
                        <Eye size={18} className="text-red-600" />
                      </button>
                      <button className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 transition-all">
                        Re-verify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
