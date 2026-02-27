import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  BarChart3,
  Zap,
  RefreshCw,
  Loader,
  FileText,
  Star,
  AlertCircle,
  Upload,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AIAnalysis = () => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetchResumeData();
  }, []);

  const fetchResumeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/jobseeker/my-resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data?.resumes?.length > 0) {
        setResumeData(response.data.data.resumes[0]);
      }
    } catch (err: any) {
      console.error("Failed to fetch resume:", err);
      setError("Failed to load resume data");
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!resumeData?._id) return;
    setReanalyzing(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/jobseeker/analyze/${resumeData._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        await fetchResumeData();
      }
    } catch (err: any) {
      setError("Re-analysis failed. The resume will be analyzed on next upload.");
    } finally {
      setReanalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-rose-500";
  };

  if (loading) {
    return (
      <DashboardLayout title="AI Analysis" subtitle="AI-powered resume insights">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const analysis = resumeData?.aiAnalysis || {};
  const atsScore = analysis.atsScore || analysis.ats_score || 0;
  const grammarScore = analysis.grammarScore || analysis.grammar_score || 0;
  const readabilityScore = analysis.readability || analysis.readability_score || 0;
  const structureScore = analysis.structureScore || analysis.structure_score || 0;
  const overallScore = analysis.overallScore || analysis.overall_score ||
    (atsScore ? Math.round((atsScore + grammarScore + readabilityScore + structureScore) / 4) : 0);
  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];
  const skills = resumeData?.parsedData?.skills || analysis.recommendedKeywords || [];
  const parsedData = resumeData?.parsedData || {};

  return (
    <DashboardLayout title="AI Analysis" subtitle="Comprehensive AI-powered insights for your resume">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {!resumeData ? (
        /* No Resume State */
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Resume Uploaded</h3>
          <p className="text-slate-600 mb-6">Upload a resume to get AI-powered analysis and recommendations</p>
          <button
            onClick={() => navigate("/jobseeker/upload")}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 mx-auto"
          >
            <Upload size={20} /> Upload Resume
          </button>
        </div>
      ) : (
        <>
          {/* Header Action */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-slate-600">
                Resume: <span className="font-semibold text-slate-900">{parsedData.name || "Your Resume"}</span>
              </p>
            </div>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${reanalyzing ? "animate-spin" : ""}`} />
              {reanalyzing ? "Analyzing..." : "Re-analyze Resume"}
            </button>
          </div>

          {/* Overall Score Circle */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br ${getScoreBg(overallScore)} text-white shadow-xl`}>
              <div>
                <p className="text-5xl font-bold">{overallScore}</p>
                <p className="text-xs uppercase tracking-wider opacity-80">Overall</p>
              </div>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "ATS Score", score: atsScore, icon: Target, color: "blue", desc: "ATS Compatibility" },
              { label: "Grammar", score: grammarScore, icon: CheckCircle, color: "green", desc: "Language Quality" },
              { label: "Readability", score: readabilityScore, icon: BarChart3, color: "purple", desc: "Ease of Reading" },
              { label: "Structure", score: structureScore, icon: Award, color: "orange", desc: "Organization" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <item.icon className={`text-${item.color}-600`} size={24} />
                  <span className="text-xs text-slate-500 uppercase">{item.label}</span>
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(item.score)} mb-1`}>{item.score}%</div>
                <p className="text-slate-500 text-sm">{item.desc}</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div className={`bg-${item.color}-500 h-2 rounded-full transition-all`} style={{ width: `${item.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Weaknesses & Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weaknesses / Areas to Improve */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-red-100 rounded-xl mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Areas to Improve</h3>
                  <p className="text-sm text-slate-600">Focus on these areas</p>
                </div>
              </div>
              <div className="space-y-3">
                {weaknesses.length > 0 ? weaknesses.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start p-4 bg-red-50 rounded-xl border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{item}</p>
                  </div>
                )) : (
                  <div className="flex items-start p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">No major issues found! Your resume looks good.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Strengths / Suggestions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl mr-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Suggestions</h3>
                  <p className="text-sm text-slate-600">How to improve your resume</p>
                </div>
              </div>
              <div className="space-y-3">
                {suggestions.length > 0 ? suggestions.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Zap className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{item}</p>
                  </div>
                )) : (
                  <div className="flex items-start p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <Star className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">Add more quantifiable achievements to boost your score.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Keywords / Skills */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 mb-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Detected Keywords & Skills</h3>
                <p className="text-sm text-slate-600">Important skills found in your resume</p>
              </div>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {skills.map((keyword: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 rounded-full text-sm font-medium border border-purple-200">
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No skills detected. Try re-uploading your resume.</p>
            )}
          </div>

          {/* Resume Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resume Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {parsedData.name && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Name</p>
                  <p className="text-slate-900 font-medium">{parsedData.name}</p>
                </div>
              )}
              {parsedData.email && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-slate-900 font-medium">{parsedData.email}</p>
                </div>
              )}
              {parsedData.phone && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Phone</p>
                  <p className="text-slate-900 font-medium">{parsedData.phone}</p>
                </div>
              )}
            </div>
            {parsedData.education?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Education</p>
                <div className="space-y-2">
                  {parsedData.education.map((edu: string, idx: number) => (
                    <p key={idx} className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{edu}</p>
                  ))}
                </div>
              </div>
            )}
            {parsedData.experience?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Experience</p>
                <div className="space-y-2">
                  {parsedData.experience.map((exp: string, idx: number) => (
                    <p key={idx} className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{exp}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AIAnalysis;
