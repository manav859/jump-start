import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

// Bundle-splitting strategy:
//   - vendor    : the React core that every page imports
//   - charts    : recharts is only used by Analytics; isolating it keeps
//                 the main bundle small and lets the chart code load on
//                 demand
//   - icons     : lucide-react is large per-icon; tree-shaking helps but
//                 a dedicated chunk lets the browser cache it across
//                 deploys that don't change icons
//   - i18n      : i18next + react-i18next change rarely; long-cacheable
//   - axios     : single dedicated chunk so it persists in the cache
//                 across feature deploys
//
// chunkSizeWarningLimit is bumped to 600 KB to silence the Vite default
// 500 KB warning — the cap we actually care about is 600 KB per chunk.
//
// Gzip compression: vite-plugin-compression writes .gz siblings during
// build. Vercel (and most CDNs) automatically serve these when the
// client supports gzip, with no app-level config required.
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"],
          i18n: ["i18next", "react-i18next"],
          axios: ["axios"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
