import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import {
  Loader,
  RefreshCw,
  Shield,
  FileText,
  Eye,
  Calendar,
  User,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface AnomalyItem {
  _id: string;
  resumeName: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  status: string;
  indicators: string[];
  priority: string;
  date: string;
}

const AdminAnomalies = () => {
  const [reports, setReports] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await axios.get(`${API_URL}/api/admin/anomaly-reports-full`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (res.data.success) {
        setReports(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch anomaly reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return { bar: "bg-red-600", text: "text-red-700", bg: "bg-red-50", label: "High Risk" };
    if (score >= 40) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "Medium Risk" };
    return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", label: "Low Risk" };
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "flagged") return "bg-red-100 text-red-700 border-red-200";
    if (s === "reviewed") return "bg-green-100 text-green-700 border-green-200";
    if (s === "dismissed") return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  return (
    <AdminLayout
      title="Anomaly Reports"
      subtitle={`Resume fraud & anomaly detection — ${total} total reports`}
      headerExtra={
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-all font-semibold text-sm border border-cyan-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-6">
        <div className="flex gap-2 flex-wrap">
          {["all", "flagged", "pending", "reviewed", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-600 mb-4" size={40} />
          <p className="text-slate-600">Loading anomaly reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Shield className="mx-auto text-green-400" size={56} />
          <p className="text-slate-700 text-lg mt-4 font-semibold">No anomaly reports</p>
          <p className="text-slate-500 mt-2">Your system is clean — no flagged resumes detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const risk = getRiskColor(report.riskScore);
            return (
              <div
                key={report._id}
                className={`bg-white rounded-2xl border-2 border-slate-200 hover:shadow-lg transition-all overflow-hidden`}
              >
                <div className={`h-1 ${risk.bar}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-red-600" />
                          <h3 className="font-bold text-slate-900">{report.resumeName}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </div>

                      {/* User & Date */}
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span className="flex items-center gap-1">
                          <User size={14} className="text-slate-400" />
                          {report.userName} ({report.userEmail})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {report.date}
                        </span>
                      </div>

                      {/* Risk Score Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Risk Score</span>
                          <span className={`font-bold ${risk.text}`}>{report.riskScore}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`${risk.bar} h-2 rounded-full transition-all`}
                            style={{ width: `${report.riskScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Indicators */}
                      {report.indicators.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase">Indicators</p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.indicators.map((indicator, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200"
                              >
                                {indicator}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all" title="View details">
                        <Eye size={18} />
                      </button>
                      <button className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 transition-all">
                        Re-verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-center text-sm text-slate-500 py-2">
            Showing {reports.length} of {total} reports
          </p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnomalies;
