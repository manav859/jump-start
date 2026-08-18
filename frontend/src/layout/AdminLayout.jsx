import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "../pages/admin/AdminHeader";
import AdminSidebar from "../pages/admin/AdminSidebar";
import NavigationProgress from "../components/NavigationProgress";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <NavigationProgress />
      {/* FIXED SIDEBAR */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN WRAPPER */}
      {/* print:ml-0 collapses the sidebar gutter in the PDF — the sidebar
          itself is hidden via report-print-hidden, so the report must not
          keep its 5rem offset when an admin prints from the in-shell
          report route. */}
      <div
        className={`transition-all duration-300 print:ml-0 ${
          isSidebarOpen ? "ml-20" : "ml-0"
        }`}
      >
        
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
