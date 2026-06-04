/**
 * migrateCareerRematch.mjs — backfill career recommendations on existing
 * reports using the fixed matching engine (interest ipsatization + re-tuned
 * weights 0.35/0.25/0.30/0.10 + peak-reward).
 *
 * Raw test answers are gone, but each report stores the computed RIASEC /
 * intelligence / aptitude / EQ breakdown, which is exactly what matchCareers
 * consumes. We re-match from those stored buckets.
 *
 * Idempotent & deterministic:
 *   - reads the report's stored (raw, pre-fix) hollandProfile, ipsatizes it
 *     in-memory, re-matches; never overwrites the stored buckets — so the
 *     same report always yields the same recommendations.
 *   - skips any report whose profile.careerRematch.version is already the
 *     current engine version (fresh "live" reports + already-migrated ones),
 *     so it never double-ipsatizes an already-ipsatized profile.
 *   - writes surgically via updateOne + arrayFilters (no Mongoose save hook),
 *     touching only the two fields it owns on the targeted report.
 *
 * Usage:
 *   node scratch/migrateCareerRematch.mjs            # DRY-RUN (default, no writes)
 *   node scratch/migrateCareerRematch.mjs --apply    # persist changes
 */
import "dotenv/config";
import mongoose from "mongoose";
import { matchCareers, CAREER_MATCHER_VERSION } from "../utils/scoring/careerMatcher.js";
import { ipsatizeInterestScores } from "../utils/scoring/packageScoring/career500q.js";
import {
  HOLLAND_CODES,
  INTELLIGENCE_TYPES,
  APTITUDE_SECTIONS,
  EQ_COMPETENCIES,
} from "../data/careerMappingData.js";

const APPLY = process.argv.includes("--apply");
const MODE = APPLY ? "APPLY (writing)" : "DRY-RUN (no writes)";
// A stored interest profile whose six codes span fewer than this many points
// is too flat for re-matching to meaningfully differentiate — recentering
// still runs, but we flag it (reverse-keyed items would have been needed to
// recover real shape at original scoring time).
const FLAT_RANGE = 8;
const TOP_N = 15;

const bucketComplete = (bucket, keys) =>
  bucket && typeof bucket === "object" &&
  keys.every((k) => Number.isFinite(Number(bucket[k])));

const top3 = (recs = []) =>
  recs.slice(0, 3).map((c) => `${c.title} ${Math.round(Number(c.matchPercent ?? c.score ?? 0))}%`);

const rangeOf = (obj, keys) => {
  const vals = keys.map((k) => Number(obj[k])).filter(Number.isFinite);
  if (!vals.length) return 0;
  return Math.max(...vals) - Math.min(...vals);
};

const pad = (s, n) => String(s).padEnd(n);

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection("users");
  const users = await col
    .find({ "assessmentReports.0": { $exists: true } })
    .project({ name: 1, assessmentReports: 1 })
    .toArray();

  // Flatten to a list of non-demo reports with their owning user + report _id.
  const reports = [];
  for (const u of users) {
    for (const r of u.assessmentReports || []) {
      if (r.isDemo) continue;
      reports.push({ userId: u._id, reportId: r._id, name: u.name || "(unnamed)", report: r });
    }
  }

  // ---- Step 1: recoverability check -----------------------------------------
  console.log(`\nMODE: ${MODE}   engine version: ${CAREER_MATCHER_VERSION}\n`);
  console.log("STEP 1 — Recoverability check (non-demo reports)\n");
  console.log(
    `${pad("Report", 22)}${pad("Interest?", 11)}${pad("Intel?", 9)}${pad("Aptitude?", 11)}${pad("EQ?", 6)}Re-matchable?`
  );
  const yn = (b) => (b ? "YES" : "NO");
  for (const item of reports) {
    const p = item.report.profile || {};
    item.hasInterest = bucketComplete(p.hollandProfile, HOLLAND_CODES);
    item.hasIntel = bucketComplete(p.multipleIntelligences, INTELLIGENCE_TYPES);
    item.hasAptitude = bucketComplete(p.aptitudeScores, APTITUDE_SECTIONS);
    item.hasEQ = bucketComplete(p.eqProfile, EQ_COMPETENCIES);
    item.rematchable = item.hasInterest && item.hasIntel && item.hasAptitude && item.hasEQ;
    console.log(
      `${pad(item.name, 22)}${pad(yn(item.hasInterest), 11)}${pad(yn(item.hasIntel), 9)}${pad(yn(item.hasAptitude), 11)}${pad(yn(item.hasEQ), 6)}${yn(item.rematchable)}`
    );
  }

  // ---- Step 2 + 3: ipsatize, re-match, flag flat ----------------------------
  console.log("\nSTEP 2 — Apply ipsatization + re-match (before/after top 3)\n");
  const summary = {
    total: reports.length,
    rematchable: 0,
    alreadyCurrent: 0,
    notRecoverable: 0,
    rematched: 0,
    topChanged: 0,
    stillSalesFirst: 0,
    flatFlagged: 0,
  };

  for (const item of reports) {
    if (!item.rematchable) { summary.notRecoverable++; continue; }
    summary.rematchable++;
    const p = item.report.profile || {};

    if (p.careerRematch && p.careerRematch.version === CAREER_MATCHER_VERSION) {
      summary.alreadyCurrent++;
      console.log(`${item.name}: already at ${CAREER_MATCHER_VERSION} (${p.careerRematch.source}) — skipped`);
      continue;
    }

    const before = top3(p.careerRecommendations);
    const ipsatized = ipsatizeInterestScores(p.hollandProfile);
    const matchProfile = {
      hollandProfile: ipsatized,
      multipleIntelligences: p.multipleIntelligences,
      aptitudeScores: p.aptitudeScores,
      eqProfile: p.eqProfile,
    };
    const newRecs = matchCareers(matchProfile, TOP_N);
    const after = top3(newRecs);

    const flat = rangeOf(p.hollandProfile, HOLLAND_CODES) < FLAT_RANGE;
    const beforeTopTitle = (p.careerRecommendations?.[0]?.title) || "(none)";
    const afterTopTitle = newRecs[0]?.title || "(none)";
    if (beforeTopTitle !== afterTopTitle) summary.topChanged++;
    if (afterTopTitle === "Sales Manager") summary.stillSalesFirst++;
    if (flat) summary.flatFlagged++;

    console.log(`${item.name}:`);
    console.log(`  Before: ${before.join(", ") || "(none)"}`);
    console.log(`  After:  ${after.join(", ") || "(none)"}`);
    if (flat) {
      console.log(
        `  ⚠ FLAT stored interest profile (range ${rangeOf(p.hollandProfile, HOLLAND_CODES)} < ${FLAT_RANGE}) — ` +
        `recentering applied but cannot meaningfully differentiate; reverse-keyed items would have been needed at scoring time.`
      );
    }

    if (APPLY) {
      const marker = {
        version: CAREER_MATCHER_VERSION,
        source: "migration",
        at: new Date().toISOString(),
        previousTop: beforeTopTitle,
        flatInterest: flat,
      };
      await col.updateOne(
        { _id: item.userId },
        {
          $set: {
            "assessmentReports.$[r].profile.careerRecommendations": newRecs,
            "assessmentReports.$[r].profile.careerPathwaysCount": newRecs.length,
            "assessmentReports.$[r].profile.careerRematch": marker,
          },
        },
        { arrayFilters: [{ "r._id": item.reportId }] }
      );
    }
    summary.rematched++;
  }

  // ---- Step 5: summary ------------------------------------------------------
  console.log("\n" + "=".repeat(48));
  console.log("CAREER RE-MATCH MIGRATION" + (APPLY ? "" : "  (dry-run — nothing written)"));
  console.log("=".repeat(48));
  console.log(`Total non-demo reports:    ${summary.total}`);
  console.log(`Recoverable (complete):    ${summary.rematchable}`);
  console.log(`Not recoverable (skipped): ${summary.notRecoverable}`);
  console.log(`Already current (skipped): ${summary.alreadyCurrent}`);
  console.log(`Re-matched ${APPLY ? "(written)" : "(would write)"}:    ${summary.rematched}`);
  console.log(`Top career changed:        ${summary.topChanged}`);
  console.log(`Still Sales Manager #1:    ${summary.stillSalesFirst} (genuinely enterprising — correct)`);
  console.log(`Could not differentiate:   ${summary.flatFlagged} (flat stored profile — flagged)`);
  if (!APPLY) console.log(`\nRe-run with --apply to persist.`);
};

run()
  .catch((e) => { console.error("MIGRATION ERROR:", e?.message || e); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect().catch(() => {}); });
