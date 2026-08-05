// main.jsx (or App.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
// Side-effect import: initialises i18next with en/gu resources and
// restores the stored language preference. Must run before any
// component calls useTranslation().
import "./i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <SpeedInsights />
  </React.StrictMode>
);
