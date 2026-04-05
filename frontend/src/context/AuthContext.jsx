import { createContext, useState, useEffect } from "react";
import { apiUnavailableMessage, apiV1BaseUrl } from "../config/env";

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

  // ------------------------------------
  // 1️⃣ LOGIN WITH EMAIL + PASSWORD
  // ------------------------------------
  const login = async ({ email, password }) => {
    let res;
    try {
      res = await fetch(`${apiV1BaseUrl}/user/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      throw new Error(apiUnavailableMessage);
    }

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

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
  };

  // ------------------------------------
  // 2️⃣ LOGIN WITH GOOGLE (SOCIAL LOGIN)
  // ------------------------------------
  const loginWithGoogle = async (google_id_token) => {
    let res;
    try {
      res = await fetch(`${apiV1BaseUrl}/user/auth/social-login`, {
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
    console.log("GOOGLE LOGIN RESPONSE:", data);

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
  };

  // ------------------------------------
  // 3️⃣ LOGOUT
  // ------------------------------------
  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updateUser = (nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithGoogle, // <-- Added Google Login
        updateUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
