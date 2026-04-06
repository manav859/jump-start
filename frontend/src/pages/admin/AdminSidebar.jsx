import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

const AdminSidebar = ({ isOpen }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin/dashboard" },
    { icon: <FileText size={20} />, label: "Test Submissions", path: "/admin/testsubmissions" },
    { icon: <CheckSquare size={20} />, label: "Published Results", path: "/admin/publishedresults" },
    { icon: <Users size={20} />, label: "Users", path: "/admin/usermanagement" },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/admin/payments" },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin/analytics" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-20
      transition-all duration-300
      ${isOpen ? "w-20" : "w-0 overflow-hidden -translate-x-full"}`}
    >
      <div className="flex flex-col items-center py-6">
        {/* Logo */}
        <div className="w-10 h-10 bg-[#14b8a6] rounded-lg flex items-center justify-center text-white font-bold text-xl mb-10">
          J
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `group relative p-2 rounded-lg transition-colors flex items-center justify-center
                ${
                  isActive
                    ? "bg-[#14b8a61a] text-[#14b8a6]"
                    : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              {item.icon}
              <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0F1729] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 md:flex">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
