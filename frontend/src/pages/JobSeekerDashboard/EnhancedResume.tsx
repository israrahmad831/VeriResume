import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import jsPDF from "jspdf";
import {
  FileText,
  Sparkles,
  Loader,
  AlertTriangle,
  Upload,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Download,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const EnhancedResume = () => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
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
      console.error("Failed to load resume data:", err);
    } finally {
      setLoading(false);
    }
  };

  const analysis = resumeData?.aiAnalysis || {};
  const parsedData = resumeData?.parsedData || {};

  const downloadEnhancedResume = async () => {
    if (!resumeData) return;
    setEnhancing(true);

    try {
      // Call AI API to enhance resume content
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/jobseeker/enhance-resume`,
        { resumeId: resumeData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const enhanced = res.data.success ? res.data.data : null;

      const name = enhanced?.enhancedName || parsedData.name || "Candidate";
      const email = parsedData.email || "";
      const phone = parsedData.phone || "";
      const skillsList = enhanced?.enhancedSkills || parsedData.skills || [];
      const experience = enhanced?.enhancedExperience || parsedData.experience || [];
      const education = enhanced?.enhancedEducation || parsedData.education || [];
      const summary = enhanced?.enhancedSummary || parsedData.summary || analysis.summary || "";
      const certifications = enhanced?.certifications || [];
      const achievements = enhanced?.achievements || [];

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const checkPage = (needed: number) => {
        if (y + needed > 280) { doc.addPage(); y = 20; }
      };

      // --- Header ---
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(name.toUpperCase(), margin, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const contactParts = [email, phone].filter(Boolean).join("  |  ");
      if (contactParts) doc.text(contactParts, margin, 28);
      doc.text("AI-Enhanced Resume  |  Optimized for ATS & Readability", margin, 35);
      y = 50;

      // --- Helper: Section Header ---
      const sectionHeader = (title: string) => {
        checkPage(18);
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 2;
        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
        doc.setTextColor(40, 40, 40);
      };

      // --- Professional Summary ---
      sectionHeader("PROFESSIONAL SUMMARY");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryText = summary || `Results-driven professional with expertise in ${skillsList.slice(0, 5).join(", ") || "various technologies"}.`;
      const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
      checkPage(summaryLines.length * 5);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 6;

      // --- Skills ---
      if (skillsList.length > 0) {
        sectionHeader("SKILLS");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const skillText = skillsList.join("  •  ");
        const lines = doc.splitTextToSize(skillText, contentWidth);
        checkPage(lines.length * 5);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 6;
      }

      // --- Experience ---
      if (experience.length > 0) {
        sectionHeader("EXPERIENCE");
        doc.setFontSize(10);
        experience.forEach((exp: any) => {
          checkPage(18);
          if (typeof exp === "string") {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(`• ${exp}`, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 3;
          } else {
            doc.setFont("helvetica", "bold");
            doc.text(`${exp.title || exp.position || ""} at ${exp.company || ""}`, margin, y);
            y += 5;
            if (exp.duration || exp.dates) {
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text(exp.duration || exp.dates, margin, y);
              y += 5;
              doc.setTextColor(40, 40, 40);
            }
            if (exp.description) {
              doc.setFont("helvetica", "normal");
              const desc = typeof exp.description === "string" ? exp.description : (exp.description || []).join("\n");
              const lines = doc.splitTextToSize(desc, contentWidth);
              checkPage(lines.length * 5);
              doc.text(lines, margin, y);
              y += lines.length * 5 + 3;
            }
            // Bullet points from AI
            if (exp.bullets && Array.isArray(exp.bullets)) {
              doc.setFont("helvetica", "normal");
              exp.bullets.forEach((bullet: string) => {
                checkPage(10);
                const lines = doc.splitTextToSize(`• ${bullet}`, contentWidth - 4);
                doc.text(lines, margin + 4, y);
                y += lines.length * 5 + 2;
              });
            }
            y += 3;
          }
        });
        y += 3;
      }

      // --- Education ---
      if (education.length > 0) {
        sectionHeader("EDUCATION");
        doc.setFontSize(10);
        education.forEach((edu: any) => {
          checkPage(12);
          if (typeof edu === "string") {
            doc.setFont("helvetica", "normal");
            doc.text(`• ${edu}`, margin, y);
            y += 6;
          } else {
            doc.setFont("helvetica", "bold");
            doc.text(`${edu.degree || edu.qualification || ""} - ${edu.institution || edu.school || ""}`, margin, y);
            y += 5;
            if (edu.year || edu.dates) {
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text(edu.year || edu.dates, margin, y);
              y += 5;
              doc.setTextColor(40, 40, 40);
            }
            y += 3;
          }
        });
        y += 3;
      }

      // --- Certifications (from AI) ---
      if (certifications.length > 0) {
        sectionHeader("CERTIFICATIONS");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        certifications.forEach((cert: string) => {
          checkPage(8);
          doc.text(`• ${cert}`, margin, y);
          y += 6;
        });
        y += 3;
      }

      // --- Key Achievements (from AI) ---
      if (achievements.length > 0) {
        sectionHeader("KEY ACHIEVEMENTS");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        achievements.forEach((ach: string) => {
          checkPage(10);
          const lines = doc.splitTextToSize(`★ ${ach}`, contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        });
      }

      // --- Footer ---
      checkPage(15);
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Enhanced by VeriResume AI — Structure, Grammar, Readability & ATS optimized", margin, y);

      doc.save(`Enhanced_Resume_${name.replace(/\s+/g, "_")}.pdf`);
    } catch (err: any) {
      console.error("AI enhancement failed, generating with original data:", err);
      // Fallback: generate with original data
      downloadFallbackResume();
    } finally {
      setEnhancing(false);
    }
  };

  // Fallback PDF generation without AI
  const downloadFallbackResume = () => {
    if (!resumeData) return;
    const name = parsedData.name || "Candidate";
    const email = parsedData.email || "";
    const phone = parsedData.phone || "";
    const skillsList = parsedData.skills || [];
    const experience = parsedData.experience || [];
    const education = parsedData.education || [];
    const summary = parsedData.summary || analysis.summary || "";
    const enhancements = getEnhancements();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPage = (needed: number) => {
      if (y + needed > 280) { doc.addPage(); y = 20; }
    };

    // --- Header ---
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(name.toUpperCase(), margin, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contactParts = [email, phone].filter(Boolean).join("  |  ");
    if (contactParts) doc.text(contactParts, margin, 28);
    doc.text(`Resume Score: ${overallScore}%  |  Target: 90%+`, margin, 35);
    y = 50;

    // --- Helper: Section Header ---
    const sectionHeader = (title: string) => {
      checkPage(18);
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 2;
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setTextColor(40, 40, 40);
    };

    // --- Professional Summary ---
    if (summary) {
      sectionHeader("PROFESSIONAL SUMMARY");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(summary, contentWidth);
      checkPage(lines.length * 5);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    } else {
      sectionHeader("PROFESSIONAL SUMMARY");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const autoSummary = `Results-driven professional with expertise in ${skillsList.slice(0, 5).join(", ") || "various technologies"}. Seeking opportunities as a ${resumeData.jobTarget || "professional"}.`;
      const lines = doc.splitTextToSize(autoSummary, contentWidth);
      checkPage(lines.length * 5);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    }

    // --- Skills ---
    if (skillsList.length > 0) {
      sectionHeader("SKILLS");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const skillText = skillsList.join("  •  ");
      const lines = doc.splitTextToSize(skillText, contentWidth);
      checkPage(lines.length * 5);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    }

    // --- Experience ---
    if (experience.length > 0) {
      sectionHeader("EXPERIENCE");
      doc.setFontSize(10);
      experience.forEach((exp: any) => {
        checkPage(18);
        if (typeof exp === "string") {
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(`• ${exp}`, contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        } else {
          doc.setFont("helvetica", "bold");
          doc.text(`${exp.title || exp.position || ""} at ${exp.company || ""}`, margin, y);
          y += 5;
          if (exp.duration || exp.dates) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text(exp.duration || exp.dates, margin, y);
            y += 5;
            doc.setTextColor(40, 40, 40);
          }
          if (exp.description) {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(exp.description, contentWidth);
            checkPage(lines.length * 5);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 3;
          }
          y += 3;
        }
      });
      y += 3;
    }

    // --- Education ---
    if (education.length > 0) {
      sectionHeader("EDUCATION");
      doc.setFontSize(10);
      education.forEach((edu: any) => {
        checkPage(12);
        if (typeof edu === "string") {
          doc.setFont("helvetica", "normal");
          doc.text(`• ${edu}`, margin, y);
          y += 6;
        } else {
          doc.setFont("helvetica", "bold");
          doc.text(`${edu.degree || edu.qualification || ""} - ${edu.institution || edu.school || ""}`, margin, y);
          y += 5;
          if (edu.year || edu.dates) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text(edu.year || edu.dates, margin, y);
            y += 5;
            doc.setTextColor(40, 40, 40);
          }
          y += 3;
        }
      });
      y += 3;
    }

    // --- New page for Enhancement Recommendations ---
    doc.addPage();
    y = 20;
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AI ENHANCEMENT RECOMMENDATIONS", margin, 20);
    y = 40;

    // Score summary
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Current Score: ${overallScore}%  |  ATS: ${atsScore}%  |  Grammar: ${grammarScore}%  |  Structure: ${structureScore}%  |  Readability: ${readabilityScore}%`, margin, y);
    y += 10;

    // Enhancements
    enhancements.forEach((section) => {
      checkPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text(section.category.toUpperCase(), margin, y);
      y += 7;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      section.items.forEach((item) => {
        checkPage(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Issue: ${item.issue}`, margin + 4, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const fixLines = doc.splitTextToSize(`Fix: ${item.fix}`, contentWidth - 8);
        doc.text(fixLines, margin + 4, y);
        y += fixLines.length * 4.5 + 4;
      });
      y += 4;
    });

    // Weaknesses
    if (weaknesses.length > 0) {
      checkPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("ISSUES TO ADDRESS", margin, y);
      y += 7;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      weaknesses.forEach((w: string, i: number) => {
        checkPage(10);
        const lines = doc.splitTextToSize(`${i + 1}. ${w}`, contentWidth - 4);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5 + 3;
      });
    }

    doc.save(`Enhanced_Resume_${name.replace(/\s+/g, "_")}.pdf`);
  };

  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];
  const skills = parsedData.skills || [];
  const atsScore = analysis.atsScore || analysis.ats_score || 0;
  const grammarScore = analysis.grammarScore || analysis.grammar_score || 0;
  const readabilityScore = analysis.readability || analysis.readability_score || 0;
  const structureScore = analysis.structureScore || analysis.structure_score || 0;
  const overallScore = analysis.overallScore || analysis.overall_score ||
    (atsScore ? Math.round((atsScore + grammarScore + readabilityScore + structureScore) / 4) : 0);

  // Generate enhancement recommendations based on analysis
  const getEnhancements = () => {
    const enhancements: { category: string; icon: any; color: string; items: { issue: string; fix: string }[] }[] = [];

    // ATS Improvements
    if (atsScore < 80) {
      enhancements.push({
        category: "ATS Optimization",
        icon: Target,
        color: "blue",
        items: [
          { issue: "Low ATS compatibility", fix: "Use standard section headers like 'Experience', 'Education', 'Skills'" },
          { issue: "Missing keywords", fix: "Add industry-specific keywords from job descriptions you're targeting" },
          { issue: "Format issues", fix: "Use a clean, single-column layout without tables or graphics" },
          ...(atsScore < 50 ? [{ issue: "Very low ATS score", fix: "Consider using a standard resume template optimized for ATS systems" }] : []),
        ],
      });
    }

    // Grammar Improvements
    if (grammarScore < 80) {
      enhancements.push({
        category: "Grammar & Language",
        icon: BookOpen,
        color: "green",
        items: [
          { issue: "Grammar needs improvement", fix: "Use action verbs to start each bullet point (Led, Developed, Managed, Designed)" },
          { issue: "Inconsistent tense", fix: "Use past tense for previous roles and present tense for current role" },
          { issue: "Spelling errors possible", fix: "Run a spell-checker and proofread all sections carefully" },
        ],
      });
    }

    // Structure Improvements
    if (structureScore < 80) {
      enhancements.push({
        category: "Structure & Organization",
        icon: Award,
        color: "purple",
        items: [
          { issue: "Resume structure needs work", fix: "Order sections: Contact → Summary → Experience → Education → Skills" },
          { issue: "Missing professional summary", fix: "Add a 2-3 line professional summary highlighting your key strengths" },
          { issue: "Section formatting", fix: "Use clear headings, consistent bullet points, and proper spacing" },
        ],
      });
    }

    // Readability Improvements
    if (readabilityScore < 80) {
      enhancements.push({
        category: "Readability",
        icon: Sparkles,
        color: "orange",
        items: [
          { issue: "Hard to read quickly", fix: "Keep bullet points to 1-2 lines, use quantifiable achievements" },
          { issue: "Too dense", fix: "Add whitespace between sections, use concise language" },
          { issue: "Lacks impact", fix: "Replace vague phrases with specific numbers: 'Increased sales by 35%'" },
        ],
      });
    }

    // Content Improvements (always shown)
    enhancements.push({
      category: "Content Enhancement",
      icon: TrendingUp,
      color: "cyan",
      items: [
        { issue: "Add quantifiable achievements", fix: "Include metrics: 'Managed team of 10', 'Reduced costs by 20%'" },
        { issue: "Strengthen skill section", fix: `You have ${skills.length} skills listed. Add technical certifications and tools.` },
        { issue: "Tailor for each application", fix: "Customize your resume for each job by matching their required keywords" },
      ],
    });

    return enhancements;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { text: "Good", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "Needs Work", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <DashboardLayout title="Enhanced Resume" subtitle="AI-powered resume improvement recommendations">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading enhancement suggestions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Enhanced Resume" subtitle="AI-powered resume improvement recommendations">
      {!resumeData ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Resume to Enhance</h3>
          <p className="text-slate-600 mb-6">Upload your resume first, then come back for AI-powered enhancement suggestions</p>
          <button
            onClick={() => navigate("/jobseeker/upload")}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 mx-auto"
          >
            <Upload size={20} /> Upload Resume
          </button>
        </div>
      ) : (
        <>
          {/* Score Overview */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Current Score */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-2">Current Score</p>
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-700">{overallScore}%</span>
                  </div>
                </div>
                <p className={`mt-2 text-sm font-semibold ${getScoreLabel(overallScore).color}`}>
                  {getScoreLabel(overallScore).text}
                </p>
              </div>

              <ArrowRight className="text-slate-400 hidden md:block" size={32} />

              {/* Target Score */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-2">Target Score</p>
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                    <span className="text-3xl font-bold text-green-600">90%+</span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-green-600">Excellent</p>
              </div>

              {/* Separator */}
              <div className="hidden md:block w-px h-24 bg-slate-200" />

              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-2xl font-bold text-red-600">{weaknesses.length}</p>
                  <p className="text-xs text-red-600 font-medium">Issues Found</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">{suggestions.length}</p>
                  <p className="text-xs text-emerald-600 font-medium">Suggestions</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{skills.length}</p>
                  <p className="text-xs text-blue-600 font-medium">Skills Detected</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">{getEnhancements().reduce((acc, e) => acc + e.items.length, 0)}</p>
                  <p className="text-xs text-purple-600 font-medium">Enhancement Tips</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weaknesses to Fix */}
          {weaknesses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 mb-6">
              <div className="flex items-center mb-5">
                <div className="p-3 bg-red-100 rounded-xl mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Issues to Fix</h3>
                  <p className="text-sm text-slate-600">Address these to boost your score</p>
                </div>
              </div>
              <div className="space-y-3">
                {weaknesses.map((w: string, idx: number) => (
                  <div key={idx} className="flex items-start p-4 bg-red-50 rounded-xl border border-red-200">
                    <span className="w-6 h-6 bg-red-200 text-red-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">{idx + 1}</span>
                    <p className="text-slate-700 text-sm">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement Categories */}
          <div className="space-y-6 mb-8">
            {getEnhancements().map((section, sIdx) => {
              const Icon = section.icon;
              return (
                <div key={sIdx} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-center mb-5">
                    <div className={`p-3 bg-${section.color}-100 rounded-xl mr-4`}>
                      <Icon className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{section.category}</h3>
                      <p className="text-sm text-slate-600">{section.items.length} improvements available</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{item.issue}</p>
                            <p className="text-sm text-slate-600">{item.fix}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={downloadEnhancedResume}
              disabled={enhancing}
              className={`px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 ${enhancing ? "opacity-70 cursor-wait" : ""}`}
            >
              {enhancing ? (
                <>
                  <Loader size={18} className="animate-spin" /> AI Enhancing Resume...
                </>
              ) : (
                <>
                  <Download size={18} /> Download AI-Enhanced Resume
                </>
              )}
            </button>
            <button
              onClick={() => navigate("/jobseeker/upload")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Upload size={18} /> Upload Improved Resume
            </button>
            <button
              onClick={() => navigate("/jobseeker/analysis")}
              className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RefreshCw size={18} /> View Full Analysis
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default EnhancedResume;
