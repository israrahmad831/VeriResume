import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ChevronDown,
  ChevronRight,
  Shield,
  Send,
  PlayCircle,
  LogOut,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: number;
  headerExtra?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, badge, headerExtra }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ users: true, analytics: true });
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
    {
      icon: Users,
      label: "Users",
      expandable: true,
      key: "users",
      submenu: [
        { label: "All Users", path: "/admin/users" },
        { label: "Job Seekers", path: "/admin/users?role=jobseeker" },
        { label: "HR Recruiters", path: "/admin/users?role=hr" },
      ],
    },
    { icon: Briefcase, label: "Job Posts", path: "/admin/jobs" },
    { icon: AlertTriangle, label: "Anomaly Reports", path: "/admin/anomalies", badge: badge },
    {
      icon: Brain,
      label: "AI Analytics",
      expandable: true,
      key: "analytics",
      submenu: [
        { label: "Usage Stats", path: "/admin/analytics" },
        { label: "Anomaly Trends", path: "/admin/anomalies" },
      ],
    },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: FileText, label: "Premium Plans", path: "/admin/premium" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: Clock, label: "Logs", path: "/admin/logs" },
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item, idx) => (
            <div key={idx}>
              {item.expandable ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.key!)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/10 text-slate-300 hover:text-white ${
                      isActivePrefix(`/admin/${item.key === "users" ? "users" : "analytics"}`)
                        ? "bg-white/10 text-white"
                        : ""
                    }`}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expandedMenus[item.key!] ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedMenus[item.key!] && item.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((sub, subIdx) => (
                        <button
                          key={subIdx}
                          onClick={() => navigate(sub.path)}
                          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
                        >
                          <ChevronRight size={14} />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.path || "")
                      ? "bg-cyan-500 text-white shadow-lg"
                      : "hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{item.badge}</span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10 space-y-3">
            <button className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all">
              <Send size={18} />
              <span className="text-sm font-semibold">Send Announcement</span>
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <PlayCircle size={18} />
              <span className="text-sm font-semibold">Maintenance Mode</span>
            </button>
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
        {title && (
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                  {subtitle && <p className="text-slate-600">{subtitle}</p>}
                </div>
                {headerExtra}
              </div>
            </div>
          </header>
        )}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
