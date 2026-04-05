import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "../pages/admin/AdminHeader";
import AdminSidebar from "../pages/admin/AdminSidebar";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* FIXED SIDEBAR */}
      <AdminSidebar isOpen={isSidebarOpen} />

      {/* MAIN WRAPPER */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-20" : "ml-0"}`}>
        
        {/* HEADER */}
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* PAGE CONTENT */}
        <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
      </div>
    </div>
  );
}
