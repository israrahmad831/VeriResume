import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import {
  Clock,
  Loader,
  RefreshCw,
  User,
  Activity,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface LogItem {
  _id: string;
  action: string;
  category: string;
  details: string;
  performedBy: { name: string; email: string } | null;
  date: string;
  createdAt: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "system":
        return "bg-blue-100 text-blue-700";
      case "anomaly":
        return "bg-red-100 text-red-700";
      case "subscription":
        return "bg-green-100 text-green-700";
      case "user":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <AdminLayout
      title="Activity Logs"
      subtitle={`System activity and admin actions — ${total} total`}
      headerExtra={
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-all font-semibold text-sm border border-cyan-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-600 mb-4" size={40} />
          <p className="text-slate-600">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Clock className="mx-auto text-slate-300" size={56} />
          <p className="text-slate-700 text-lg mt-4 font-semibold">No activity logs yet</p>
          <p className="text-slate-500 mt-2">System activity will be recorded here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Action</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Details</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Performed By</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                        <Activity size={14} className="text-cyan-600" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate">{log.details || "—"}</td>
                    <td className="py-4 px-6">
                      {log.performedBy ? (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          {log.performedBy.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">System</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-slate-600">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
            Showing {logs.length} of {total} logs
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLogs;
