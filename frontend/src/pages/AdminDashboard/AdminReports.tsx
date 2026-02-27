import AdminLayout from "./AdminLayout";
import { FileText, Download, Calendar, BarChart3 } from "lucide-react";

const AdminReports = () => {
  const reportTypes = [
    {
      title: "User Activity Report",
      description: "Overview of user registrations, logins, and activity trends",
      icon: BarChart3,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Resume Analysis Report",
      description: "Summary of all resume analyses, scores, and anomalies detected",
      icon: FileText,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Job Posting Report",
      description: "Statistics on job postings, applications received, and hiring status",
      icon: Calendar,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <AdminLayout title="Reports" subtitle="Generate and download system reports">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reportTypes.map((rt) => (
            <div key={rt.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl ${rt.color} flex items-center justify-center mb-4`}>
                <rt.icon size={24} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{rt.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{rt.description}</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-semibold w-full justify-center">
                <Download size={16} />
                Generate Report
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">
            Report generation with PDF export will be available in a future update.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
