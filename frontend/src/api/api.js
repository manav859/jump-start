import axios from "axios";
import { apiBaseUrl, apiUnavailableMessage, hasApiBaseUrl } from "../config/env";

const api = axios.create({
  baseURL: hasApiBaseUrl ? apiBaseUrl : undefined,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically (REQUEST INTERCEPTOR)
api.interceptors.request.use(
  (config) => {
    if (
      !hasApiBaseUrl &&
      !/^https?:\/\//i.test(String(config.url || ""))
    ) {
      return Promise.reject(new Error(apiUnavailableMessage));
    }

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401 (RESPONSE INTERCEPTOR)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized → Logging out user…");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login"; // Auto redirect to login
    }

    return Promise.reject(error);
  }
);

export default api;
