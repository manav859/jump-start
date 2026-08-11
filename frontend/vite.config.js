import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

// Bundle-splitting strategy:
//   - vendor    : the React core that every page imports
//   - icons     : lucide-react is large per-icon; tree-shaking helps but
//                 a dedicated chunk lets the browser cache it across
//                 deploys that don't change icons
//   - i18n      : i18next + react-i18next change rarely; long-cacheable
//   - axios     : single dedicated chunk so it persists in the cache
//                 across feature deploys
//
// Two deliberate changes from the previous config:
//
// 1. recharts no longer gets a `charts` manual chunk. Naming it here
//    promoted it to a static dependency of the entry, so Vite emitted a
//    <link rel="modulepreload"> for all 388 KB of it in index.html —
//    downloaded on the landing page by every visitor, though recharts is
//    only ever used by the lazy admin routes. Left unnamed, Rollup files
//    it under those lazy chunks where it belongs.
//
// 2. The matcher is a function, not an object of package names. The
//    object form matches module ids exactly, so `"react-dom"` never
//    matched `react-dom/client` — which is what main.jsx actually
//    imports. 523 KB of react-dom was landing in the app entry and being
//    cache-busted on every deploy. The regexes below match on path, so
//    subpath imports are covered.
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
    // Vite inlines assets under 4 KB as base64 data URIs by default. With
    // the responsive AVIF/WebP ladder that scripts/optimizeImages.mjs
    // generates, most variants fall under that threshold — 88 of them were
    // being embedded straight into the entry chunk, adding ~44 KB gzip to
    // the one file every visitor must download and parse before render.
    //
    // Inlining is the wrong trade here regardless of size: base64 costs a
    // ~33% encoding overhead, cannot be cached independently, and behind a
    // CDN on HTTP/2 the extra requests it saves are close to free. 0
    // disables it entirely so every image stays a separately cacheable,
    // immutable, content-hashed file.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const m = id.replace(/\\/g, "/").split("node_modules/").pop();

          // Everything that touches the React runtime ships in ONE chunk.
          //
          // This is a correctness constraint, not a size optimisation.
          // Splitting React-consuming libraries into sibling chunks
          // white-screened production with:
          //
          //   Uncaught TypeError: Cannot read properties of undefined
          //   (reading 'createContext')   at i18n-[hash].js
          //
          // The mechanism: React ships as CJS, so Rollup needs its
          // getDefaultExportFromCjs interop helper. That helper is emitted
          // into exactly one chunk and imported by the others. With
          // i18next/react-i18next in their own chunk it landed *there*, so
          // vendor imported the helper from i18n while i18n imported React
          // from vendor — a cycle. ESM resolves cycles by leaving one
          // side's bindings uninitialised, and the side that lost was
          // React, which react-i18next dereferences at module-evaluation
          // time.
          //
          // A chunk can only be in a cycle with vendor if it imports from
          // vendor, i.e. if it contains something that consumes React. So
          // the rule is: anything React-dependent goes in vendor. axios is
          // deliberately still separate — it has no React dependency, so
          // it can host or receive a helper without forming a cycle.
          //
          // Load order alone is not a fix here. The import edge is static
          // and correctly ordered; the failure is binding initialisation
          // within a cycle, which no amount of preloading changes.
          if (
            /^(react|react-dom|scheduler|react-router|react-router-dom|i18next|react-i18next|lucide-react)\//.test(
              m,
            )
          ) {
            return "vendor";
          }

          if (/^axios\//.test(m)) return "axios";

          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
