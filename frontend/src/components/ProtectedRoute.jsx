import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  requiredRole = "",
  unauthorizedTo = "/",
}) {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  const loginState =
    requiredRole === "admin"
      ? { from: location.pathname, adminLoginRequired: true }
      : { from: location.pathname };

  if (!user || !token) {
    return <Navigate to="/login" replace state={loginState} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (requiredRole === "admin") {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from: location.pathname,
            adminLoginRequired: true,
            switchAccountRequired: true,
          }}
        />
      );
    }

    return (
      <Navigate
        to={unauthorizedTo}
        replace
        state={{
          adminAccessRequired: requiredRole === "admin",
          deniedPath: location.pathname,
        }}
      />
    );
  }

  return children;
}
