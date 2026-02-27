import AdminLayout from "./AdminLayout";
import { Crown, Check, Star } from "lucide-react";

const AdminPremium = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      color: "border-slate-200",
      features: ["Basic resume upload", "1 resume analysis", "Standard job search", "Basic ATS score"],
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      color: "border-cyan-400",
      highlight: true,
      features: ["Unlimited resume analysis", "AI resume enhancement", "Advanced ATS scoring", "Priority support", "Anomaly detection"],
    },
    {
      name: "Enterprise",
      price: "$29.99",
      period: "/month",
      color: "border-purple-400",
      features: ["All Pro features", "Bulk resume screening", "Custom branding", "API access", "Dedicated support", "Team analytics"],
    },
  ];

  return (
    <AdminLayout title="Premium Plans" subtitle="Manage subscription plans and tiers">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 p-6 relative ${plan.color} ${plan.highlight ? "shadow-lg shadow-cyan-100" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} /> Most Popular
                </span>
              )}
              <div className="text-center mb-6 pt-2">
                <Crown size={32} className={plan.highlight ? "text-cyan-600 mx-auto mb-2" : "text-slate-400 mx-auto mb-2"} />
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Plan management (editing prices, adding features, managing trial periods) will be available in a future update.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPremium;
