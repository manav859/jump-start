import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import api from "../../api/api";

const SubscriptionBadge = ({ type }) => {
  const styles = {
    Standard: "bg-[#14b8a61a] text-[#14b8a6] border-[#14b8a62a]",
    Premium: "bg-[#0f766e] text-white border-transparent",
    Basic: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[type] || styles.Basic}`}>{type}</span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Suspended: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || styles.Active}`}>{status}</span>;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subscriptionFilter, setSubscriptionFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    api
      .get("/v1/admin/users")
      .then((res) => setUsers(res?.data?.data || []))
      .catch((err) => console.error("Users load failed:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || user.status === statusFilter;
        const matchesSubscription = subscriptionFilter === "All" || user.subscription === subscriptionFilter;
        return matchesSearch && matchesStatus && matchesSubscription;
      }),
    [users, searchQuery, statusFilter, subscriptionFilter]
  );

  const onToggleStatus = async (u) => {
    const nextStatus = u.status === "Active" ? "Suspended" : "Active";
    await api.patch(`/v1/admin/users/${u.id}`, { status: nextStatus });
    loadUsers();
  };

  const onEdit = async (u) => {
    const name = window.prompt("Edit name", u.name);
    if (!name) return;
    await api.patch(`/v1/admin/users/${u.id}`, { name });
    loadUsers();
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.name}?`)) return;
    await api.delete(`/v1/admin/users/${u.id}`);
    loadUsers();
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-gray-400 text-sm font-medium">Manage real user accounts</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-40">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <div className="relative w-full md:w-40">
            <select value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
              <option value="All">Subscription</option>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
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
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phone</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Tests</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Subscription</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Last Login</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Loading users...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-[#14b8a6] flex items-center justify-center font-bold text-[11px] border border-teal-100">{user.initials}</div>
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 font-medium whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-5 text-sm text-gray-500 font-medium whitespace-nowrap">{user.phone || "-"}</td>
                    <td className="px-6 py-5 text-center"><span className="text-xs font-bold">{user.tests}</span></td>
                    <td className="px-6 py-5 text-center"><SubscriptionBadge type={user.subscription} /></td>
                    <td className="px-6 py-5 text-center text-sm text-gray-500 font-medium whitespace-nowrap">{user.lastLogin}</td>
                    <td className="px-6 py-5 text-center"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => onEdit(user)} className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">Edit</button>
                        <button onClick={() => onToggleStatus(user)} className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">{user.status === "Active" ? "Suspend" : "Activate"}</button>
                        <button onClick={() => onDelete(user)} className="px-2 py-1 text-xs border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
