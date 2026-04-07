import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Download, CreditCard, Smartphone } from "lucide-react";
import api from "../../api/api";
import { TableSkeleton } from "../../components/admin/Skeletons";

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pending: "bg-slate-50 text-slate-400 border-slate-100",
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || styles.Pending}`}>{status}</span>;
};

const Payments = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenueLabel: "₹0",
    thisMonthLabel: "₹0",
    pendingAmountLabel: "₹0",
    refundedAmountLabel: "₹0",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  useEffect(() => {
    api
      .get("/v1/admin/payments")
      .then((res) => {
        setRows(res?.data?.data?.rows || []);
        setSummary(res?.data?.data?.summary || {});
      })
      .catch((err) => console.error("Payments load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPayments = useMemo(
    () =>
      rows.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || item.status === statusFilter;
        const matchesMethod = methodFilter === "All" || item.method === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
      }),
    [rows, searchQuery, statusFilter, methodFilter]
  );

  const exportCsv = () => {
    const headers = ["order_id", "name", "email", "package", "amount", "method", "date", "status"];
    const lines = filteredPayments.map((p) =>
      [p.id, p.name, p.email, p.package, p.amountLabel, p.method, p.dateLabel, p.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments & Orders</h1>
          <p className="text-gray-400 text-sm font-medium">Dynamic transactions</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 border border-[#14b8a6] text-[#14b8a6] hover:bg-teal-50 px-5 py-2 rounded-xl font-bold text-sm">
          <Download size={18} /> Export All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-50"><span className="text-xs text-gray-400 font-bold uppercase">Total Revenue</span><h3 className="text-2xl font-bold mt-1">{summary.totalRevenueLabel}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-50"><span className="text-xs text-gray-400 font-bold uppercase">This Month</span><h3 className="text-2xl font-bold mt-1">{summary.thisMonthLabel}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-50"><span className="text-xs text-gray-400 font-bold uppercase">Pending</span><h3 className="text-2xl font-bold mt-1">{summary.pendingAmountLabel}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-50"><span className="text-xs text-gray-400 font-bold uppercase">Refunded</span><h3 className="text-2xl font-bold mt-1">{summary.refundedAmountLabel}</h3></div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by order ID or student name..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm" />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-40">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
              <option value="All">Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <div className="relative w-full md:w-48">
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
              <option value="All">Payment Method</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/20">
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Package</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Method</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="p-0 border-none"><TableSkeleton rows={5} cols={8} /></td></tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">{item.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{item.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-sm">{item.package}</td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-gray-900">{item.amountLabel}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        {item.method === "Card" ? <CreditCard size={14} /> : <Smartphone size={14} />}
                        <span className="text-xs font-medium">{item.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-[13px] text-gray-400 font-medium whitespace-nowrap">{item.dateLabel}</td>
                    <td className="px-6 py-5 text-center"><PaymentStatusBadge status={item.status} /></td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => navigator.clipboard?.writeText(item.id)} title="Copy Order ID" className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">Copy ID</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
