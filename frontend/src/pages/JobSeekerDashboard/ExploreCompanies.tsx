import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import {
  Building2,
  Search,
  Mail,
  Briefcase,
  Users,
  Loader,
  AlertCircle,
  ChevronRight,
  MapPin,
  Star,
  Globe,
  ExternalLink,
  Filter,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

interface Company {
  company: string;
  recruiters: { name: string; email: string; _id: string }[];
  activeJobs: number;
  totalJobs: number;
  email: string;
  avatar?: string;
}

interface ExternalCompany {
  name: string;
  platform: string;
  jobCount: number;
  jobs: { title: string; url: string; location: string; matchScore: number }[];
}

type MergedCompany =
  | { type: "portal"; data: Company }
  | { type: "external"; data: ExternalCompany };

const ExploreCompanies = () => {
  const navigate = useNavigate();
  const [portalCompanies, setPortalCompanies] = useState<Company[]>([]);
  const [externalCompanies, setExternalCompanies] = useState<ExternalCompany[]>([]);
  const [allCompanies, setAllCompanies] = useState<MergedCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<MergedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "portal" | "external">("all");

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  // Merge & filter whenever data or filters change
  useEffect(() => {
    // Build merged list
    const merged: MergedCompany[] = [];

    if (sourceFilter === "all" || sourceFilter === "portal") {
      portalCompanies.forEach((c) => merged.push({ type: "portal", data: c }));
    }
    if (sourceFilter === "all" || sourceFilter === "external") {
      externalCompanies.forEach((c) => merged.push({ type: "external", data: c }));
    }

    setAllCompanies(merged);

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredCompanies(
        merged.filter((item) => {
          if (item.type === "portal") {
            const c = item.data as Company;
            return (
              c.company.toLowerCase().includes(term) ||
              c.email?.toLowerCase().includes(term) ||
              c.recruiters.some((r) => r.name.toLowerCase().includes(term))
            );
          } else {
            const c = item.data as ExternalCompany;
            return (
              c.name.toLowerCase().includes(term) ||
              c.platform.toLowerCase().includes(term) ||
              c.jobs.some((j) => j.title.toLowerCase().includes(term))
            );
          }
        })
      );
    } else {
      setFilteredCompanies(merged);
    }
  }, [searchTerm, portalCompanies, externalCompanies, sourceFilter]);

  const fetchAllCompanies = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch VeriResume portal companies AND extract external companies in parallel
      const token = localStorage.getItem("token");

      const portalPromise = axios
        .get(`${API_URL}/api/companies`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data.success) return res.data.data || [];
          return [];
        })
        .catch(() => []);

      const externalPromise = getExternalCompanies(token);

      const [portal, external] = await Promise.all([portalPromise, externalPromise]);

      setPortalCompanies(portal);
      setExternalCompanies(external);
    } catch (err: any) {
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getExternalCompanies = async (token: string | null): Promise<ExternalCompany[]> => {
    try {
      // First, check localStorage cache from dashboard
      const cachedJobs = localStorage.getItem("veriresume_cached_jobs");
      const cachedTimestamp = localStorage.getItem("veriresume_jobs_timestamp");
      const cacheAge = cachedTimestamp ? Date.now() - parseInt(cachedTimestamp) : Infinity;

      let externalJobs: any[] = [];

      if (cachedJobs && cacheAge < 30 * 60 * 1000) {
        try {
          externalJobs = JSON.parse(cachedJobs);
        } catch (e) {
          externalJobs = [];
        }
      }

      // If no cached jobs, try fetching
      if (externalJobs.length === 0 && token) {
        try {
          // Check if user has a resume to match against
          const resumeRes = await axios.get(`${API_URL}/api/jobseeker/my-resumes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resumeRes.data.success && resumeRes.data.data?.resumes?.length > 0) {
            const resumeId = resumeRes.data.data.resumes[0]._id;
            const jobsRes = await axios.post(
              `${API_URL}/api/jobseeker/find-matching-jobs`,
              { resumeId },
              { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
            if (jobsRes.data.success) {
              externalJobs = jobsRes.data.data?.allMatchingJobs || [];
              // Update cache
              localStorage.setItem("veriresume_cached_jobs", JSON.stringify(externalJobs));
              localStorage.setItem("veriresume_jobs_timestamp", Date.now().toString());
            }
          }
        } catch (e) {
          console.warn("Could not fetch external jobs for companies:", e);
        }
      }

      // Filter out Indeed jobs
      externalJobs = externalJobs.filter(
        (j: any) => j.source?.toLowerCase() !== "indeed"
      );

      // Group by company name
      const companyMap = new Map<string, ExternalCompany>();

      for (const job of externalJobs) {
        const companyName = job.company || "Unknown Company";
        if (companyName === "Unknown" || companyName === "Unknown Company") continue;

        const key = companyName.toLowerCase().trim();
        if (!companyMap.has(key)) {
          companyMap.set(key, {
            name: companyName,
            platform: job.source || "external",
            jobCount: 0,
            jobs: [],
          });
        }

        const entry = companyMap.get(key)!;
        entry.jobCount++;
        // Track platforms (show the most common one)
        if (job.source && job.source !== entry.platform) {
          entry.platform = "multiple";
        }
        entry.jobs.push({
          title: job.title || "Untitled",
          url: job.url || "#",
          location: job.location || "",
          matchScore: job.matchScore || 0,
        });
      }

      // Sort by job count descending
      return Array.from(companyMap.values()).sort((a, b) => b.jobCount - a.jobCount);
    } catch (e) {
      return [];
    }
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const portalColors = [
    "from-blue-600 to-cyan-600",
    "from-purple-600 to-indigo-600",
    "from-emerald-600 to-green-600",
    "from-amber-600 to-orange-600",
    "from-rose-600 to-pink-600",
    "from-teal-600 to-cyan-600",
  ];

  const platformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === "remotive") return { bg: "bg-blue-100 text-blue-700 border-blue-200", label: "Remotive" };
    if (p === "themuse") return { bg: "bg-purple-100 text-purple-700 border-purple-200", label: "TheMuse" };
    if (p === "arbeitnow") return { bg: "bg-teal-100 text-teal-700 border-teal-200", label: "ArbeitNow" };
    if (p === "usajobs") return { bg: "bg-red-100 text-red-700 border-red-200", label: "USAJobs" };
    if (p === "rozee") return { bg: "bg-green-100 text-green-700 border-green-200", label: "Rozee.pk" };
    if (p === "multiple") return { bg: "bg-amber-100 text-amber-700 border-amber-200", label: "Multiple Platforms" };
    return { bg: "bg-slate-100 text-slate-700 border-slate-200", label: platform };
  };

  const totalPortal = filteredCompanies.filter((c) => c.type === "portal").length;
  const totalExternal = filteredCompanies.filter((c) => c.type === "external").length;

  return (
    <DashboardLayout title="Explore Companies" subtitle="Discover companies on VeriResume & external platforms">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search companies by name, platform, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>
          {/* Source Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="pl-9 pr-8 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">All Sources</option>
              <option value="portal">VeriResume Portal</option>
              <option value="external">External Platforms</option>
            </select>
          </div>
        </div>
        {!loading && (
          <div className="flex items-center gap-4 mt-3">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filteredCompanies.length}</strong> companies
            </p>
            {sourceFilter === "all" && (
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-200">
                  {totalPortal} Portal
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                  {totalExternal} External
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-600 mb-4" size={40} />
          <p className="text-slate-600">Loading companies...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      ) : allCompanies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Building2 className="mx-auto text-slate-300" size={56} />
          <p className="text-slate-700 text-lg mt-4 font-semibold">No companies found</p>
          <p className="text-slate-500 mt-2">Upload your resume first to discover matching companies.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((item, idx) => {
            if (item.type === "portal") {
              const company = item.data as Company;
              return (
                <div
                  key={`portal-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-300 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-6">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold border border-cyan-200">
                        <Star size={10} />
                        VeriResume
                      </span>
                    </div>

                    {/* Company Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${
                          portalColors[idx % portalColors.length]
                        } rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white font-bold text-lg">{getCompanyInitials(company.company)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{company.company}</h3>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate">{company.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recruiters */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Recruiters</p>
                      <div className="flex flex-wrap gap-1.5">
                        {company.recruiters.slice(0, 3).map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100"
                          >
                            <Users size={10} />
                            {r.name}
                          </span>
                        ))}
                        {company.recruiters.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                            +{company.recruiters.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Job Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                        <p className="text-xs text-slate-500">Active Jobs</p>
                        <p className="text-xl font-bold text-green-700">{company.activeJobs}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                        <p className="text-xs text-slate-500">Total Posted</p>
                        <p className="text-xl font-bold text-blue-700">{company.totalJobs}</p>
                      </div>
                    </div>

                    {/* View Jobs Button */}
                    <button
                      onClick={() => navigate("/jobseeker/jobs")}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
                    >
                      <Briefcase size={15} />
                      View Jobs
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            } else {
              // External company card
              const company = item.data as ExternalCompany;
              const badge = platformBadge(company.platform);
              const topJobs = company.jobs
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 3);

              return (
                <div
                  key={`ext-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-6">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 ${badge.bg} rounded-lg text-xs font-semibold border`}
                      >
                        <Globe size={10} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Company Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">{getCompanyInitials(company.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{company.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                          <Briefcase size={12} className="text-slate-400" />
                          <span>
                            {company.jobCount} matching job{company.jobCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top matching jobs */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Top Jobs</p>
                      <div className="space-y-1.5">
                        {topJobs.map((job, jIdx) => (
                          <div
                            key={jIdx}
                            className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-xs"
                          >
                            <span className="text-slate-700 font-medium truncate flex-1 mr-2">{job.title}</span>
                            {job.matchScore > 0 && (
                              <span className="text-cyan-600 font-bold whitespace-nowrap">{job.matchScore}%</span>
                            )}
                          </div>
                        ))}
                        {company.jobCount > 3 && (
                          <p className="text-xs text-slate-400 pl-3">+{company.jobCount - 3} more jobs</p>
                        )}
                      </div>
                    </div>

                    {/* Location if available */}
                    {topJobs[0]?.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                        <MapPin size={12} />
                        <span className="truncate">{topJobs[0].location}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate("/jobseeker/jobs")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
                      >
                        <Briefcase size={14} />
                        View All Jobs
                      </button>
                      {topJobs[0]?.url && topJobs[0].url !== "#" && (
                        <button
                          onClick={() => window.open(topJobs[0].url, "_blank")}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all text-sm"
                          title="Open top job on external platform"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* No search results */}
      {!loading && allCompanies.length > 0 && filteredCompanies.length === 0 && searchTerm && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 mt-6">
          <Search className="mx-auto text-slate-300" size={48} />
          <p className="text-slate-600 mt-3 font-medium">No companies match "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-3 text-cyan-600 hover:text-cyan-700 font-semibold text-sm"
          >
            Clear search
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExploreCompanies;
