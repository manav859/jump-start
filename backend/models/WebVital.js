// Core Web Vitals samples reported by the browser beacon.
//
// One document per metric occurrence — CLS, LCP, INP, FCP and TTFB each
// arrive separately, and a single page view produces up to five. Samples
// are stored raw rather than pre-aggregated so percentiles can be
// recomputed over any window after the fact; CWV is judged at p75, and a
// running average would throw away exactly the distribution that matters.
//
// Written by POST /api/vitals (unauthenticated — beacons fire before and
// without login). Read by GET /api/v1/admin/vitals/summary.

import mongoose from "mongoose";

// The five metrics web-vitals reports. Anything else is a malformed or
// hostile payload; the route rejects it rather than storing it, and the
// enum here is the second line of defence.
export const METRIC_NAMES = ["CLS", "LCP", "INP", "FCP", "TTFB"];

const webVitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: METRIC_NAMES,
    },
    // Milliseconds for LCP/INP/FCP/TTFB; a unitless ratio for CLS.
    value: {
      type: Number,
      required: true,
    },
    // web-vitals' own good/needs-improvement/poor bucketing. Stored as
    // reported so we can sanity-check our percentiles against the
    // thresholds the browser applied at collection time.
    rating: {
      type: String,
      enum: ["good", "needs-improvement", "poor"],
    },
    delta: Number,

    // web-vitals' per-metric id. Named metricId rather than id to avoid
    // colliding with Mongoose's own virtual `id` getter.
    metricId: String,

    navigationType: String,

    // SPA route the metric settled on, so a slow page is attributable.
    path: {
      type: String,
      index: true,
    },

    // Client clock at send time. Kept for ordering within a session, but
    // never trusted for windowing — clocks skew and are user-settable.
    // Range queries use createdAt, which is server-side.
    ts: Number,

    // Captured from the request header server-side. A client-supplied UA
    // would be trivially spoofable and is not accepted.
    userAgent: String,
  },
  {
    // createdAt is the server-authoritative timestamp every aggregation
    // windows on. updatedAt is pointless here — these rows are immutable.
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Serves the summary endpoint: match a metric, walk recent samples.
webVitalSchema.index({ name: 1, createdAt: -1 });

export default mongoose.model("WebVital", webVitalSchema);
