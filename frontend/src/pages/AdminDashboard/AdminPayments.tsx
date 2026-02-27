import AdminLayout from "./AdminLayout";
import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";

const AdminPayments = () => {
  return (
    <AdminLayout title="Payments" subtitle="Payment and subscription management">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Total Revenue", value: "$0.00", icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
            { label: "Active Subscriptions", value: "0", icon: CreditCard, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Premium Users", value: "0", icon: Users, bg: "bg-purple-50", color: "text-purple-600" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CreditCard className="mx-auto text-slate-300 mb-4" size={56} />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Payment System</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Payment tracking and subscription management will be available here once payment integrations are configured.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
