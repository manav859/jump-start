import React, { useEffect, useState } from "react";
import { Users, Play, CheckCircle, CreditCard, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import api from "../../api/api";

const FunnelCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">{title}</span>
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

const COLORS = ["#b2e9e1", "#0f766e", "#14b8a6", "#94a3b8", "#f59e0b"];

const Analytics = () => {
  const [data, setData] = useState({
    funnel: { registered: 0, started: 0, completed: 0, paid: 0, counselling: 0 },
    completionData: [],
    revenueDistribution: [],
    registrationTrend: [],
    careerPaths: [],
    performanceMetrics: [],
  });

  useEffect(() => {
    api
      .get("/v1/admin/analytics")
      .then((res) => setData(res?.data?.data || data))
      .catch((err) => console.error("Analytics load failed:", err));
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-8 p-6 md:p-8 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics & Reports</h1>
        <p className="text-gray-400 text-sm font-medium">Dynamic platform insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <FunnelCard title="Registered Users" value={data.funnel.registered} icon={<Users size={18} className="text-teal-600" />} />
        <FunnelCard title="Started Test" value={data.funnel.started} icon={<Play size={18} className="text-orange-500" />} />
        <FunnelCard title="Completed Test" value={data.funnel.completed} icon={<CheckCircle size={18} className="text-emerald-500" />} />
        <FunnelCard title="Paid" value={data.funnel.paid} icon={<CreditCard size={18} className="text-teal-600" />} />
        <FunnelCard title="Counselling" value={data.funnel.counselling} icon={<Calendar size={18} className="text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-base font-bold mb-4">Test Completion by Package</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.completionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="started" name="Started" fill="#b2e9e1" />
                <Bar dataKey="completed" name="Completed" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-base font-bold mb-4">Revenue by Package</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.revenueDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95}>
                  {data.revenueDistribution.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-base font-bold mb-4">User Registration Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="text-base font-bold mb-4">Top Career Recommendations</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.careerPaths}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/20">
                <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Metric</th>
                <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Current</th>
                <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Previous</th>
                <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.performanceMetrics.map((row) => (
                <tr key={row.metric} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-gray-700">{row.metric}</td>
                  <td className="px-8 py-5 text-center text-sm font-bold text-gray-900">{row.current}</td>
                  <td className="px-8 py-5 text-center text-sm font-medium text-gray-400 italic">{row.previous}</td>
                  <td className="px-8 py-5 text-right text-sm font-black">{row.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
