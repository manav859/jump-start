// main.jsx (or App.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import reportWebVitals from "./lib/reportWebVitals";
// Side-effect import: initialises i18next with en/gu resources and
// restores the stored language preference. Must run before any
// component calls useTranslation().
import "./i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Registered after render so observer setup never sits between the user
// and first paint. web-vitals reads buffered PerformanceEntry records, so
// registering late still captures metrics that settled earlier.
reportWebVitals();
