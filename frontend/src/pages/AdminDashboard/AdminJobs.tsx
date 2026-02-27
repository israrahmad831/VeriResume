import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import {
  Briefcase,
  Search,
  Trash2,
  Loader,
  RefreshCw,
  MapPin,
  Building2,
  Calendar,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface JobItem {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  salary: string;
  experience: string;
  applications: number;
  postedBy: { name: string; email: string } | null;
  posted: string;
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${API_URL}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (res.data.success) {
        setJobs(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string) => {
    try {
      setToggling(jobId);
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/api/admin/jobs/${jobId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, status: res.data.data.status } : j))
        );
      }
    } catch {
      alert("Failed to update job status");
    } finally {
      setToggling(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Delete this job? All applications for this job will also be removed.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setTotal((prev) => prev - 1);
    } catch {
      alert("Failed to delete job");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const filteredJobs = searchTerm
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          j.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          j.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : jobs;

  return (
    <AdminLayout
      title="Job Posts Management"
      subtitle={`Manage all job listings — ${total} total`}
      headerExtra={
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-all font-semibold text-sm border border-cyan-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </form>
          <div className="flex gap-2">
            {["all", "active", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-cyan-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-600 mb-4" size={40} />
          <p className="text-slate-600">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Briefcase className="mx-auto text-slate-300" size={56} />
          <p className="text-slate-700 text-lg mt-4 font-semibold">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className={`bg-white rounded-2xl border-2 ${
                job.status === "active" ? "border-slate-200" : "border-red-200 bg-red-50/30"
              } hover:shadow-lg transition-all p-6`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        job.status === "active"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {job.status === "active" ? "Active" : "Closed"}
                    </span>
                    {job.type && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {job.type}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} className="text-slate-400" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      {job.location}
                    </span>
                    {job.salary && <span className="text-green-700 font-semibold">{job.salary}</span>}
                    {job.experience && <span className="text-slate-500">{job.experience}</span>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Posted: {job.posted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {job.applications} application{job.applications !== 1 ? "s" : ""}
                    </span>
                    {job.postedBy && (
                      <span>
                        By: {job.postedBy.name} ({job.postedBy.email})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleJobStatus(job._id)}
                    disabled={toggling === job._id}
                    className={`p-2 rounded-lg transition-all ${
                      job.status === "active"
                        ? "hover:bg-amber-50 text-amber-600"
                        : "hover:bg-green-50 text-green-600"
                    }`}
                    title={job.status === "active" ? "Close job" : "Reactivate job"}
                  >
                    {toggling === job._id ? (
                      <Loader size={18} className="animate-spin" />
                    ) : job.status === "active" ? (
                      <ToggleRight size={18} />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteJob(job._id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                    title="Delete job"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-slate-500 py-2">
            Showing {filteredJobs.length} of {total} jobs
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminJobs;
