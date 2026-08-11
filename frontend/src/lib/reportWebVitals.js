// Self-hosted Core Web Vitals beacon.
//
// Replaces @vercel/speed-insights, which posted to /_vercel/speed-insights/*
// — a route that only ever existed on Vercel's edge. With the Vercel
// project deleted those requests 404 on every page load, so the field
// data we need to verify the perf work had nowhere to land.
//
// Metrics go to POST {VITE_API_URL}/vitals and are stored raw in Mongo
// (see backend/models/WebVital.js). Aggregation happens at read time.
//
// Design constraints, in priority order:
//   1. Never affect UX. Every send is wrapped; a failure is swallowed.
//   2. Never block unload. sendBeacon is queued by the browser and
//      survives page teardown — which matters because CLS and INP are
//      only finalised as the page goes away. A plain fetch() would be
//      cancelled at exactly that moment.
//   3. Cost nothing in dev. Guarded on PROD so local runs stay quiet and
//      the dev console isn't full of failed posts.

import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

// Strip a trailing slash so `.../api/` and `.../api` both produce a
// single-slash URL.
const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const ENDPOINT = API_BASE ? `${API_BASE}/vitals` : "";

const send = (metric) => {
  if (!ENDPOINT) return;

  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    // Recorded per route so a slow page is attributable. This is the
    // path at the time the metric settled, which for a SPA is the route
    // the user actually experienced it on.
    path: location.pathname,
    ts: Date.now(),
  };

  try {
    const body = JSON.stringify(payload);

    // sendBeacon needs a Blob to carry a Content-Type; without one the
    // browser sends text/plain. The backend accepts both, but
    // application/json is what express.json() picks up directly.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      // Returns false if the payload was rejected (e.g. over the UA's
      // queue limit) — fall through to fetch in that case rather than
      // silently dropping the sample.
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }

    // keepalive lets the request outlive the document, which is the
    // property sendBeacon is providing above.
    fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      // The beacon is fire-and-forget and carries no credentials; it
      // must not be blocked by an auth redirect.
      credentials: "omit",
      mode: "cors",
    }).catch(() => {
      /* reporting must never surface to the user */
    });
  } catch {
    /* reporting must never surface to the user */
  }
};

export default function reportWebVitals() {
  // Dev builds would otherwise post on every hot reload and pollute the
  // dataset with numbers that have nothing to do with production.
  if (!import.meta.env.PROD) return;

  try {
    onCLS(send);
    onLCP(send);
    onINP(send);
    onFCP(send);
    onTTFB(send);
  } catch {
    /* a missing PerformanceObserver entry type must not break boot */
  }
}
