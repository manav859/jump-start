import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Plus, Percent, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import api from "../../api/api";
import { DashboardSkeleton } from "../../components/admin/Skeletons";

const StatusBadge = ({ status }) => {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-600",
    "In Progress": "bg-orange-50 text-orange-600",
    Submitted: "bg-blue-50 text-blue-600",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

const AdminDashboard = () => {
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Live platform data</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.kpiData.map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <p className="text-sm text-gray-400 uppercase tracking-wide">{item.title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{item.value}</h3>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-500">Live</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold mb-4">User Growth</h3>
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
          <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
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
          <h3 className="text-lg font-bold">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentActivities.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{row.time}</td>
                  <td className="px-6 py-4 font-semibold whitespace-nowrap">{row.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.action}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate("/admin/usermanagement")} className="flex items-center gap-2 bg-[#f59e0b] text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Plus size={18} /> Manage Users
          </button>
          <button onClick={() => navigate("/admin/settings")} className="flex items-center gap-2 border border-[#14b8a6] text-[#14b8a6] px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Percent size={18} /> Manage Packages
          </button>
          <button onClick={() => navigate("/admin/publishedresults")} className="flex items-center gap-2 border border-[#14b8a6] text-[#14b8a6] px-5 py-2.5 rounded-xl font-semibold text-sm">
            <Download size={18} /> View Results
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
