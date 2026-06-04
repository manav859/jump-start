import "dotenv/config";
import mongoose from "mongoose";
import CAREER_MAPPINGS from "../data/careerMappingData.js";
import { ipsatizeInterestScores } from "../utils/scoring/packageScoring/career500q.js";

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const look = (b, k) => { const n = Number(b?.[k]); return Number.isFinite(n) ? clamp(n) : 50; };

// Candidate scorer. cfg: { w:{h,i,a,e}, pPrimary, intelPeak, aptPeak, peakBlend }
const score = (career, p, cfg) => {
  const codes = career.hollandCodes || [];
  let h;
  if (!codes.length) h = 50;
  else if (codes.length === 1) h = look(p.hollandProfile, codes[0]);
  else {
    const primary = look(p.hollandProfile, codes[0]);
    const secAvg = avg(codes.slice(1).map((c) => look(p.hollandProfile, c)));
    h = primary * cfg.pPrimary + secAvg * (1 - cfg.pPrimary);
  }
  const bucket = (keys, map, peak) => {
    if (!keys?.length) return 50;
    const vals = keys.map((k) => look(map, k));
    const a = avg(vals);
    if (!peak) return a;
    return a * (1 - cfg.peakBlend) + Math.max(...vals) * cfg.peakBlend;
  };
  const i = bucket(career.intelligenceTypes, p.multipleIntelligences, cfg.intelPeak);
  const a = bucket(career.aptitudeStrengths, p.aptitudeScores, cfg.aptPeak);
  const e = bucket(career.eqCompetencies, p.eqProfile, false);
  return clamp(h * cfg.w.h + i * cfg.w.i + a * cfg.w.a + e * cfg.w.e);
};
const top = (p, cfg, n = 3) =>
  CAREER_MAPPINGS.map((c) => ({ t: c.title, s: Math.round(score(c, p, cfg) * 10) / 10 }))
    .sort((x, y) => y.s - x.s || x.t.localeCompare(y.t)).slice(0, n);

const ips = (p) => ({ ...p, hollandProfile: ipsatizeInterestScores(p.hollandProfile) });

// 4 synthetic profiles (must stay 4/4 distinct, correct families)
const SYN = {
  STEM: { hollandProfile: { R: 55, I: 92, A: 35, S: 38, E: 45, C: 65 }, multipleIntelligences: { "Logical-Math": 92, Linguistic: 55, Spatial: 70, Musical: 30, "Bodily-Kinesthetic": 35, Interpersonal: 45, Intrapersonal: 65, Naturalistic: 60 }, aptitudeScores: { Verbal: 60, Numerical: 95, Abstract: 92, "Spatial Relations": 72, Mechanical: 55, Clerical: 45, "Critical Thinking": 88, "Problem Solving": 85 }, eqProfile: { "Self-Awareness": 65, "Self-Regulation": 80, Motivation: 78, Empathy: 45, "Social Skills": 50 } },
  Arts: { hollandProfile: { R: 40, I: 42, A: 93, S: 55, E: 50, C: 30 }, multipleIntelligences: { "Logical-Math": 40, Linguistic: 65, Spatial: 90, Musical: 75, "Bodily-Kinesthetic": 62, Interpersonal: 58, Intrapersonal: 78, Naturalistic: 45 }, aptitudeScores: { Verbal: 65, Numerical: 45, Abstract: 78, "Spatial Relations": 90, Mechanical: 50, Clerical: 42, "Critical Thinking": 60, "Problem Solving": 58 }, eqProfile: { "Self-Awareness": 82, "Self-Regulation": 60, Motivation: 70, Empathy: 65, "Social Skills": 55 } },
  Social: { hollandProfile: { R: 35, I: 45, A: 50, S: 93, E: 55, C: 40 }, multipleIntelligences: { "Logical-Math": 45, Linguistic: 78, Spatial: 50, Musical: 55, "Bodily-Kinesthetic": 55, Interpersonal: 93, Intrapersonal: 75, Naturalistic: 50 }, aptitudeScores: { Verbal: 80, Numerical: 50, Abstract: 58, "Spatial Relations": 50, Mechanical: 40, Clerical: 55, "Critical Thinking": 70, "Problem Solving": 60 }, eqProfile: { "Self-Awareness": 80, "Self-Regulation": 70, Motivation: 75, Empathy: 95, "Social Skills": 88 } },
  Business: { hollandProfile: { R: 45, I: 55, A: 45, S: 60, E: 93, C: 70 }, multipleIntelligences: { "Logical-Math": 70, Linguistic: 78, Spatial: 50, Musical: 35, "Bodily-Kinesthetic": 50, Interpersonal: 90, Intrapersonal: 72, Naturalistic: 45 }, aptitudeScores: { Verbal: 80, Numerical: 78, Abstract: 65, "Spatial Relations": 55, Mechanical: 50, Clerical: 68, "Critical Thinking": 80, "Problem Solving": 78 }, eqProfile: { "Self-Awareness": 75, "Self-Regulation": 72, Motivation: 90, Empathy: 60, "Social Skills": 92 } },
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const users = await mongoose.connection.db.collection("users").find({}).project({ name: 1, assessmentReports: 1 }).toArray();
  const want = ["Eva Ruparel", "Gopi", "Yash Popat", "Jatan Ruparel", "Vidish Monani"];
  const REAL = {};
  for (const u of users) for (const r of u.assessmentReports || []) {
    if (r.isDemo || !want.includes(u.name) || REAL[u.name]) continue;
    const p = r.profile;
    REAL[u.name] = { hollandProfile: p.hollandProfile, multipleIntelligences: p.multipleIntelligences, aptitudeScores: p.aptitudeScores, eqProfile: p.eqProfile };
  }
  await mongoose.disconnect();

  const configs = {
    "CURRENT (avg0.6, h.35/i.25/a.30/e.10, intel+apt peak)": { w: { h: 0.35, i: 0.25, a: 0.30, e: 0.10 }, pPrimary: null, hollandAvg06: true, intelPeak: true, aptPeak: true, peakBlend: 0.4 },
    "C1 primary0.75, h.40/i.20/a.30/e.10, apt-peak only": { w: { h: 0.40, i: 0.20, a: 0.30, e: 0.10 }, pPrimary: 0.75, intelPeak: false, aptPeak: true, peakBlend: 0.4 },
    "C2 primary0.8, h.45/i.15/a.30/e.10, apt-peak only": { w: { h: 0.45, i: 0.15, a: 0.30, e: 0.10 }, pPrimary: 0.8, intelPeak: false, aptPeak: true, peakBlend: 0.4 },
    "C3 primary0.8, h.45/i.20/a.25/e.10, apt-peak only": { w: { h: 0.45, i: 0.20, a: 0.25, e: 0.10 }, pPrimary: 0.8, intelPeak: false, aptPeak: true, peakBlend: 0.4 },
    "C4 primary0.75, h.40/i.20/a.30/e.10, intel+apt peak": { w: { h: 0.40, i: 0.20, a: 0.30, e: 0.10 }, pPrimary: 0.75, intelPeak: true, aptPeak: true, peakBlend: 0.4 },
    "C0p primary0.75, h.35/i.25/a.30/e.10 (prior weights), intel+apt peak": { w: { h: 0.35, i: 0.25, a: 0.30, e: 0.10 }, pPrimary: 0.75, intelPeak: true, aptPeak: true, peakBlend: 0.4 },
  };
  // adapter for the "current" avg-0.6 holland mode
  const scoreWrap = (career, p, cfg) => {
    if (!cfg.hollandAvg06) return score(career, p, cfg);
    const codes = career.hollandCodes || [];
    const w = codes.map((c, idx) => (idx === 0 ? look(p.hollandProfile, c) : look(p.hollandProfile, c) * 0.6));
    const h = codes.length ? avg(w) : 50;
    const bucket = (keys, map, peak) => { if (!keys?.length) return 50; const vals = keys.map((k) => look(map, k)); const a = avg(vals); return peak ? a * 0.6 + Math.max(...vals) * 0.4 : a; };
    const i = bucket(career.intelligenceTypes, p.multipleIntelligences, cfg.intelPeak);
    const a = bucket(career.aptitudeStrengths, p.aptitudeScores, cfg.aptPeak);
    const e = bucket(career.eqCompetencies, p.eqProfile, false);
    return clamp(h * cfg.w.h + i * cfg.w.i + a * cfg.w.a + e * cfg.w.e);
  };
  const top1 = (p, cfg) => CAREER_MAPPINGS.map((c) => ({ t: c.title, s: scoreWrap(c, p, cfg) })).sort((x, y) => y.s - x.s || x.t.localeCompare(y.t))[0].t;

  for (const [name, cfg] of Object.entries(configs)) {
    console.log("\n" + "=".repeat(70) + "\n" + name);
    console.log("  -- real reports (ipsatized) --");
    for (const k of want) if (REAL[k]) console.log(`    ${k.padEnd(16)} -> ${top1(ips(REAL[k]), cfg)}`);
    console.log("  -- synthetic (want 4 distinct, correct families) --");
    const st = [];
    for (const [k, p] of Object.entries(SYN)) { const t = top1(ips(p), cfg); st.push(t); console.log(`    ${k.padEnd(10)} -> ${t}`); }
    console.log(`    distinct: ${new Set(st).size}/4`);
    if (REAL["Eva Ruparel"]) {
      const e5 = CAREER_MAPPINGS.map((c) => ({ t: c.title, s: Math.round(scoreWrap(c, ips(REAL["Eva Ruparel"]), cfg) * 10) / 10 })).sort((x, y) => y.s - x.s).slice(0, 5);
      console.log("    Eva top5: " + e5.map((x) => `${x.t} ${x.s}`).join(" | "));
    }
  }
};
run().catch((e) => { console.error(e.message); process.exit(1); });
