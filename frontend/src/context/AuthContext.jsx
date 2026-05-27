import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { apiUnavailableMessage, getApiV1Url } from "../config/env";
import { clearApiCache } from "../utils/apiCache";

export const AuthContext = createContext();

// ----------------------------
// SAFE GET FROM LOCAL STORAGE
// ----------------------------
const getStoredUser = () => {
  try {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined") return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  const saved = localStorage.getItem("token");
  if (!saved || saved === "undefined") return "";
  return saved;
};

// ----------------------------
// AUTH PROVIDER
// ----------------------------
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    const t = getStoredToken();

    if (u && t) {
      setUser(u);
      setToken(t);
    }

    setLoading(false);
  }, []);

  // login / loginWithGoogle / logout / updateUser are wrapped in
  // useCallback so the function references stay stable across renders.
  // The provider value object is also memoised below — together they
  // mean a context consumer only re-renders when `user`, `token`, or
  // `loading` actually changes (not on every parent render).

  const login = useCallback(async ({ email, password }) => {
    let res;
    try {
      res = await fetch(getApiV1Url("/user/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      throw new Error(apiUnavailableMessage);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.msg || "Login failed");
    }

    const userObj = data.data.user;
    const tokenStr = data.data.auth_token;

    if (!tokenStr) throw new Error("No token received");

    setUser(userObj);
    setToken(tokenStr);

    localStorage.setItem("user", JSON.stringify(userObj));
    localStorage.setItem("token", tokenStr);

    return data;
  }, []);

  const loginWithGoogle = useCallback(async (google_id_token) => {
    let res;
    try {
      res = await fetch(getApiV1Url("/user/auth/social-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          token: google_id_token,
        }),
      });
    } catch (error) {
      throw new Error(apiUnavailableMessage);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.msg || "Google login failed");
    }

    const userObj = data.data?.user;
    const tokenStr = data.data?.auth_token;

    if (!tokenStr) throw new Error("No token received");

    setUser(userObj);
    setToken(tokenStr);

    localStorage.setItem("user", JSON.stringify(userObj));
    localStorage.setItem("token", tokenStr);

    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Drop any cached API responses so the next user landing on this
    // tab can't see the previous user's data.
    clearApiCache();
  }, []);

  const updateUser = useCallback((nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      loginWithGoogle,
      updateUser,
      logout,
      loading,
    }),
    [user, token, login, loginWithGoogle, updateUser, logout, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
