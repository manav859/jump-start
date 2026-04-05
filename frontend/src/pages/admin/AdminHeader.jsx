import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, 
  Search, 
  Bell, 
  Clock, 
  Users, 
  CheckCircle, 
  FileText, 
  AlertCircle, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown 
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const AdminHeader = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const adminName = user?.name || "Admin User";
  const adminEmail = user?.email || "admin@jumpstart.local";
  const adminInitials = useMemo(() => {
    const words = String(adminName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return "AD";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [adminName]);

  const closeAllDropdowns = () => {
    setShowNotifications(false);
    setShowProfileDropdown(false);
  };

  const handleNavigate = (path) => {
    closeAllDropdowns();
    navigate(path);
  };

  const handleLogout = () => {
    closeAllDropdowns();
    logout();
    navigate("/login", { replace: true });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dummyNotifications = [
    { id: 1, title: 'New Registration', message: 'Aarav Kumar just joined the platform.', time: '2 mins ago', type: 'user', read: false },
    { id: 2, title: 'Payment Received', message: 'ORD-2024-1234 has been successfully paid.', time: '15 mins ago', type: 'payment', read: false },
    { id: 3, title: 'Test Submitted', message: 'Diya Sharma completed the Standard test.', time: '1 hour ago', type: 'test', read: true },
    { id: 4, title: 'System Update', message: 'Version 2.4 deployment successful.', time: '3 hours ago', type: 'system', read: true },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
        {/* <h1 className="hidden sm:block text-lg font-bold text-gray-800 tracking-tight">HealthAdmin</h1> */}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative cursor-pointer text-gray-500 hover:text-gray-700 p-1 transition-colors">
          <Search size={20} />
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <div 
            className="relative cursor-pointer text-gray-500 hover:text-gray-700 p-1 transition-colors"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
              2
            </span>
          </div>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-[10px] font-bold text-[#14b8a6] cursor-pointer hover:underline">Mark all as read</span>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {dummyNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 flex gap-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50/50 ${!notif.read ? 'bg-teal-50/30' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      notif.type === 'user' ? 'bg-blue-50 text-blue-500' :
                      notif.type === 'payment' ? 'bg-emerald-50 text-emerald-500' :
                      notif.type === 'test' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {notif.type === 'user' && <Users size={18} />}
                      {notif.type === 'payment' && <CheckCircle size={18} />}
                      {notif.type === 'test' && <FileText size={18} />}
                      {notif.type === 'system' && <AlertCircle size={18} />}
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">{notif.title}</span>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-[10px] font-medium">{notif.time}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-gray-50 text-center">
                <button className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
          >
            <div className="w-9 h-9 bg-[#14b8a6] text-white rounded-full flex items-center justify-center font-medium text-sm border-2 border-[#14b8a61a] group-hover:border-[#14b8a644] transition-all">
              {adminInitials}
            </div>
            <div className="hidden md:flex flex-col items-start leading-none gap-1">
              <span className="text-xs font-bold text-gray-900">{adminName}</span>
              <span className="text-[10px] text-gray-400 font-medium">Administrator</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </div>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 pb-0 border-b border-gray-50">
                <p className="!text-[12px] !font-bold text-gray-400 uppercase tracking-widest">Account</p>
                <p className="!text-[12px] !font-bold text-gray-900 truncate">{adminEmail}</p>
              </div>
              
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile/edit")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <User size={18} className="text-gray-400" />
                  Edit Profile Details
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("/admin/settings")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={18} className="text-gray-400" />
                  Account Settings
                </button>
              </div>

              <div className="pt-0 p-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
