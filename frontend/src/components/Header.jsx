import { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

const defaultNavItems = [
  { label: "Home", to: "/" },
  { label: "Tests", to: "/test" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Results", to: "/result" },
];

const getLinkClassName = ({ isActive }) =>
  `text-sm font-semibold ${
    isActive ? "text-[#188B8B]" : "text-[#0F1729] hover:text-[#188B8B]"
  }`;

const getMobileLinkClassName = ({ isActive }) =>
  `rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
    isActive
      ? "bg-[#EAFBFB] text-[#188B8B]"
      : "text-[#0F1729] hover:bg-[#F8FAFC] hover:text-[#188B8B]"
  }`;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const isAdmin = user?.role === "admin";

  const firstName = useMemo(() => {
    const name = String(user?.name || "").trim();
    return name ? name.split(/\s+/)[0] : "Profile";
  }, [user?.name]);

  const navItems = useMemo(() => {
    if (!isAdmin) return defaultNavItems;

    return defaultNavItems.map((item) => {
      if (item.label === "Dashboard") {
        return { ...item, to: "/admin/dashboard" };
      }

      if (item.label === "Results") {
        return { ...item, to: "/admin/publishedresults" };
      }

      return item;
    });
  }, [isAdmin]);

  const handleLogout = () => {
    setMobileOpen(false);
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutDialog(false);
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const desktopNavLinks = (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={getLinkClassName}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );

  const mobileNavLinks = (
    <>
      {navItems.map((item) => (
        <NavLink
          key={`mobile-${item.to}`}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={getMobileLinkClassName}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E8EDF3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#188B8B] text-lg font-bold text-white shadow-[0_10px_24px_rgba(24,139,139,0.22)]">
                J
              </div>
              <span className="text-2xl font-bold text-[#0F1729]">Jumpstart</span>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">{desktopNavLinks}</nav>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-[#D9E5EC] px-4 py-2 text-sm font-semibold text-[#0F1729] hover:border-[#188B8B] hover:bg-[#F0FBFB]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F9F8] text-[#188B8B]">
                    <UserRound className="h-4 w-4" />
                  </span>
                  {firstName}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F59F0A] px-5 py-3 text-sm font-semibold text-[#0F1729] shadow-[0_12px_24px_rgba(245,159,10,0.22)] hover:-translate-y-0.5 hover:bg-[#E89206]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F1729] hover:text-[#188B8B]"
                >
                  <UserRound className="h-4 w-4" />
                  Sign In
                </Link>
                <Link to="/signup" className="primary-btn">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-[#D9E5EC] p-2 text-[#0F1729] lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-[#0F1729]/40 backdrop-blur-[1px]"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`ml-auto flex h-full w-full max-w-[22rem] flex-col bg-white px-5 py-5 shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#188B8B] text-lg font-bold text-white">
                J
              </div>
              <span className="text-2xl font-bold text-[#0F1729]">Jumpstart</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl border border-[#D9E5EC] p-2 text-[#0F1729]"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-2">{mobileNavLinks}</nav>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5EC] px-4 py-3 text-sm font-semibold text-[#0F1729]"
                >
                  <UserRound className="h-4 w-4" />
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F59F0A] px-4 py-3 text-sm font-semibold text-[#0F1729]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5EC] px-4 py-3 text-sm font-semibold text-[#0F1729]"
                >
                  <UserRound className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="primary-btn"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutDialog}
        title="Confirm Logout"
        description="Are you sure you want to log out of your Jumpstart account?"
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
