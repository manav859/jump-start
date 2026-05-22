import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, Plus, Percent, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import api from "../../api/api";
import { DashboardSkeleton } from "../../components/admin/Skeletons";

// Status comes from the API as the canonical English string. We map
// it both to a CSS class and an i18n key for display so the badge
// translates without backend changes.
const STATUS_STYLES = {
  Completed: "bg-emerald-50 text-emerald-600",
  "In Progress": "bg-orange-50 text-orange-600",
  Submitted: "bg-blue-50 text-blue-600",
};
const STATUS_LABEL_KEYS = {
  Completed: "adminPages.statusCompleted",
  "In Progress": "adminPages.statusInProgress",
  Submitted: "adminPages.statusSubmitted",
};

const StatusBadge = ({ status, t }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
      STATUS_STYLES[status] || "bg-slate-100 text-slate-600"
    }`}
  >
    {STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status}
  </span>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpiData: [],
    growthData: [],
    revenueData: [],
    recentActivities: [],
  });

  useEffect(() => {
    api
      .get("/v1/admin/dashboard")
      .then((res) => setData(res?.data?.data || { kpiData: [], growthData: [], revenueData: [], recentActivities: [] }))
      .catch((err) => console.error("Admin dashboard load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="p-6 md:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("adminPages.dashboardOverview")}</h1>
        <p className="text-gray-400 mt-1">{t("adminPages.livePlatformData")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.kpiData.map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <p className="text-sm text-gray-400 uppercase tracking-wide">{item.title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{item.value}</h3>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-500">{t("adminPages.live")}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold mb-4">{t("adminPages.userGrowth")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold mb-4">{t("adminPages.revenueTrend")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="url(#revenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity — scrollable on mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">{t("adminPages.recentActivity")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">{t("adminPages.tableTime")}</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">{t("adminPages.tableUser")}</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">{t("adminPages.tableAction")}</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">{t("adminPages.tableStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentActivities.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{row.time}</td>
                  <td className="px-6 py-4 font-semibold whitespace-nowrap">{row.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.action}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
        <h3 className="text-lg font-bold mb-4">{t("adminPages.quickActions")}</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate("/admin/usermanagement")} className="flex items-center gap-2 bg-[#f59e0b] text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Plus size={18} /> {t("adminPages.manageUsers")}
          </button>
          <button onClick={() => navigate("/admin/settings")} className="flex items-center gap-2 border border-[#14b8a6] text-[#14b8a6] px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Percent size={18} /> {t("adminPages.managePackages")}
          </button>
          <button onClick={() => navigate("/admin/publishedresults")} className="flex items-center gap-2 border border-[#14b8a6] text-[#14b8a6] px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Download size={18} /> {t("adminPages.viewResults")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
