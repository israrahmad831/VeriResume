import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import {
  Bell,
  Briefcase,
  FileText,
  Trash2,
  Mail,
  MailOpen,
  Clock,
  Zap,
  Loader,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface Notification {
  id: string;
  type: "job_match" | "resume_analysis" | "system" | "tip" | "welcome";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    generateNotifications();
  }, []);

  const generateNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const generated: Notification[] = [];
      const now = new Date();

      // Fetch resume data to generate relevant notifications
      const response = await axios.get(`${API_URL}/api/jobseeker/my-resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data?.resumes?.length > 0) {
        const resume = response.data.data.resumes[0];
        const analysis = resume.aiAnalysis || {};
        const atsScore = analysis.atsScore || analysis.ats_score || 0;
        const grammarScore = analysis.grammarScore || analysis.grammar_score || 0;
        const structureScore = analysis.structureScore || analysis.structure_score || 0;
        const readabilityScore = analysis.readabilityScore || analysis.readability_score || 0;
        const overallScore = analysis.overallScore || analysis.overall_score || 0;
        const weaknesses = analysis.weaknesses || [];
        const skills = resume.parsedData?.skills || [];
        const candidateName = resume.parsedData?.name || "your resume";
        const uploadDate = resume.createdAt ? new Date(resume.createdAt) : new Date(now.getTime() - 3600000);

        // Resume uploaded notification with actual name
        generated.push({
          id: "resume-uploaded",
          type: "resume_analysis",
          title: "Resume Uploaded Successfully",
          message: `"${candidateName}" has been uploaded and analyzed. ${skills.length} skills detected across your profile.`,
          read: true,
          createdAt: uploadDate,
          actionUrl: "/jobseeker/analysis",
          priority: "low",
        });

        // Analysis complete notification with all scores
        if (atsScore > 0) {
          generated.push({
            id: "analysis-complete",
            type: "resume_analysis",
            title: "AI Analysis Complete",
            message: `Overall Score: ${overallScore}% | ATS: ${atsScore}% | Grammar: ${grammarScore}% | Structure: ${structureScore}% | Readability: ${readabilityScore}%`,
            read: false,
            createdAt: new Date(uploadDate.getTime() + 60000),
            actionUrl: "/jobseeker/analysis",
            priority: overallScore < 60 ? "high" : "medium",
          });
        }

        // ATS-specific notification with actionable advice
        if (atsScore > 0 && atsScore < 60) {
          generated.push({
            id: "low-ats",
            type: "tip",
            title: `Low ATS Score: ${atsScore}%`,
            message: "Your resume may get filtered out by Applicant Tracking Systems. Add relevant keywords from target job descriptions and use standard section headings.",
            read: false,
            createdAt: new Date(uploadDate.getTime() + 120000),
            actionUrl: "/jobseeker/enhanced",
            priority: "high",
          });
        } else if (atsScore >= 60 && atsScore < 80) {
          generated.push({
            id: "medium-ats",
            type: "tip",
            title: `ATS Score: ${atsScore}% - Room to Improve`,
            message: "Your resume passes basic ATS checks. To reach 80%+, ensure your skills exactly match the job posting terminology.",
            read: false,
            createdAt: new Date(uploadDate.getTime() + 120000),
            actionUrl: "/jobseeker/enhanced",
            priority: "medium",
          });
        } else if (atsScore >= 80) {
          generated.push({
            id: "great-ats",
            type: "resume_analysis",
            title: `Excellent ATS Score: ${atsScore}%`,
            message: "Your resume is highly optimized for Applicant Tracking Systems. Recruiters can easily find your profile.",
            read: true,
            createdAt: new Date(uploadDate.getTime() + 120000),
            priority: "low",
          });
        }

        // Grammar notification
        if (grammarScore > 0 && grammarScore < 70) {
          generated.push({
            id: "grammar-issue",
            type: "tip",
            title: `Grammar Score: ${grammarScore}% - Needs Attention`,
            message: "Spelling and grammar errors can cost you interviews. Review your resume for typos, verb tense consistency, and sentence structure.",
            read: false,
            createdAt: new Date(uploadDate.getTime() + 180000),
            actionUrl: "/jobseeker/enhanced",
            priority: "high",
          });
        }

        // Specific weakness notifications (show actual weaknesses, not just count)
        if (weaknesses.length > 0) {
          const topWeaknesses = weaknesses.slice(0, 3);
          generated.push({
            id: "weaknesses-detail",
            type: "tip",
            title: `${weaknesses.length} Improvement Areas Found`,
            message: `Top issues: ${topWeaknesses.join(". ")}${weaknesses.length > 3 ? ` (+${weaknesses.length - 3} more)` : ""}`,
            read: false,
            createdAt: new Date(uploadDate.getTime() + 240000),
            actionUrl: "/jobseeker/enhanced",
            priority: weaknesses.length > 3 ? "high" : "medium",
          });
        }

        // Skills notification with actual skills listed
        if (skills.length > 0) {
          const topSkills = skills.slice(0, 8);
          generated.push({
            id: "skills-detected",
            type: "resume_analysis",
            title: `${skills.length} Skills Identified`,
            message: `Detected: ${topSkills.join(", ")}${skills.length > 8 ? ` and ${skills.length - 8} more` : ""}`,
            read: true,
            createdAt: new Date(uploadDate.getTime() + 60000),
            priority: "low",
          });
        }

        // Job match notification from cached data (actual count + platforms)
        const cachedJobs = localStorage.getItem("veriresume_cached_jobs");
        if (cachedJobs) {
          try {
            const jobs = JSON.parse(cachedJobs);
            if (jobs.length > 0) {
              const indeedCount = jobs.filter((j: any) => (j.platform || "").toLowerCase().includes("indeed")).length;
              const rozeeCount = jobs.filter((j: any) => (j.platform || "").toLowerCase().includes("rozee")).length;
              const otherCount = jobs.length - indeedCount - rozeeCount;
              const parts = [];
              if (indeedCount > 0) parts.push(`${indeedCount} from Indeed`);
              if (rozeeCount > 0) parts.push(`${rozeeCount} from Rozee.pk`);
              if (otherCount > 0) parts.push(`${otherCount} from other platforms`);

              generated.push({
                id: "jobs-matched",
                type: "job_match",
                title: `${jobs.length} Jobs Match Your Profile`,
                message: `Found ${parts.join(", ")}. Click to view and apply directly.`,
                read: false,
                createdAt: new Date(now.getTime() - 600000),
                actionUrl: "/jobseeker/jobs",
                priority: "high",
              });

              // Top job notification
              const topJob = jobs[0];
              if (topJob?.title) {
                generated.push({
                  id: "top-job",
                  type: "job_match",
                  title: "Top Job Match",
                  message: `"${topJob.title}" at ${topJob.company || "a company"}${topJob.location ? ` in ${topJob.location}` : ""} - ${topJob.matchScore || 0}% match with your resume.`,
                  read: false,
                  createdAt: new Date(now.getTime() - 300000),
                  actionUrl: "/jobseeker/jobs",
                  priority: "medium",
                });
              }
            }
          } catch (e) {}
        } else {
          generated.push({
            id: "search-jobs",
            type: "job_match",
            title: "Find Matching Jobs",
            message: "Your resume is ready! Search for jobs that match your skills on the Jobs page.",
            read: false,
            createdAt: new Date(now.getTime() - 600000),
            actionUrl: "/jobseeker/jobs",
            priority: "medium",
          });
        }

        // Enhanced resume tip based on score
        if (overallScore < 75) {
          generated.push({
            id: "enhance-tip",
            type: "tip",
            title: "Download Enhanced Resume",
            message: `Your score is ${overallScore}%. Download the AI-enhanced version with specific fixes to boost it above 75%.`,
            read: false,
            createdAt: new Date(now.getTime() - 7200000),
            actionUrl: "/jobseeker/enhanced",
            priority: "medium",
          });
        }
      } else {
        // No resume uploaded
        generated.push({
          id: "no-resume",
          type: "system",
          title: "Get Started - Upload Your Resume",
          message: "Upload your resume to unlock AI-powered analysis, skill detection, job matching from Indeed & Rozee.pk, and enhancement recommendations.",
          read: false,
          createdAt: new Date(now.getTime() - 3600000),
          actionUrl: "/jobseeker/upload",
          priority: "high",
        });

        generated.push({
          id: "welcome",
          type: "welcome",
          title: "Welcome to VeriResume!",
          message: "Your AI-powered resume assistant is ready. Upload a resume to get started with analysis, scoring, and job recommendations.",
          read: false,
          createdAt: new Date(now.getTime() - 86400000),
          actionUrl: "/jobseeker/upload",
          priority: "medium",
        });
      }

      // Sort by date (newest first)
      generated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setNotifications(generated);
    } catch (err) {
      console.error("Failed to generate notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = (() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter !== "all") return notifications.filter((n) => n.type === filter);
    return notifications;
  })();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "job_match": return <Briefcase className="w-6 h-6 text-blue-600" />;
      case "resume_analysis": return <FileText className="w-6 h-6 text-purple-600" />;
      case "tip": return <Zap className="w-6 h-6 text-amber-600" />;
      case "welcome": return <Sparkles className="w-6 h-6 text-cyan-600" />;
      default: return <Bell className="w-6 h-6 text-slate-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "job_match": return "bg-blue-100";
      case "resume_analysis": return "bg-purple-100";
      case "tip": return "bg-amber-100";
      case "welcome": return "bg-cyan-100";
      default: return "bg-slate-100";
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">Urgent</span>;
    if (priority === "medium") return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">Important</span>;
    return null;
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Notifications" subtitle="Stay updated with your job search">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading notifications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifications" subtitle="Stay updated with your job search">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-slate-600" size={24} />
          <span className="text-slate-700 font-medium">{notifications.length} notifications</span>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold text-sm"
          >
            <MailOpen size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-3 border border-slate-200 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "all", label: `All (${notifications.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "job_match", label: "Jobs" },
            { key: "resume_analysis", label: "Resume" },
            { key: "tip", label: "Tips" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-semibold text-sm transition-all ${
                filter === f.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Notifications</h3>
          <p className="text-slate-600">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md border ${
                !n.read ? "border-l-4 border-l-blue-500 border-slate-200" : "border-slate-200"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start">
                  <div className={`p-3 rounded-xl mr-4 flex-shrink-0 ${getIconBg(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold ${!n.read ? "text-slate-900" : "text-slate-700"}`}>{n.title}</h3>
                        {getPriorityBadge(n.priority)}
                      </div>
                      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                            title="Mark as read"
                          >
                            <Mail className="w-4 h-4 text-slate-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{n.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {timeAgo(n.createdAt)}
                      </div>
                      {n.actionUrl && (
                        <button
                          onClick={() => { handleMarkAsRead(n.id); navigate(n.actionUrl!); }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-semibold text-xs"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Notifications;
