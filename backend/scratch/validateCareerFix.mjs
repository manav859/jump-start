import { matchCareers, CAREER_MATCH_WEIGHTS } from "../utils/scoring/careerMatcher.js";
import CAREER_MAPPINGS from "../data/careerMappingData.js";
import { ipsatizeInterestScores } from "../utils/scoring/packageScoring/career500q.js";

// ---------------------------------------------------------------------------
// Faithful replica of the PRE-FIX matcher so this one script can show BEFORE
// (old weights 0.35/0.25/0.25/0.15, plain-average buckets, NO ipsatization)
// vs AFTER (new engine + interest ipsatization) on the SAME profiles.
// ---------------------------------------------------------------------------
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const look = (bucket, k) => {
  const n = Number(bucket?.[k]);
  return Number.isFinite(n) ? clamp(n) : 50;
};
const oldMatch = (profile, n = 3) => {
  const scored = CAREER_MAPPINGS.map((c) => {
    const codes = c.hollandCodes || [];
    const hw = codes.map((code, i) => (i === 0 ? look(profile.hollandProfile, code) : look(profile.hollandProfile, code) * 0.6));
    const h = codes.length ? clamp(avg(hw)) : 50;
    const i = (c.intelligenceTypes || []).length ? clamp(avg(c.intelligenceTypes.map((k) => look(profile.multipleIntelligences, k)))) : 50;
    const a = (c.aptitudeStrengths || []).length ? clamp(avg(c.aptitudeStrengths.map((k) => look(profile.aptitudeScores, k)))) : 50;
    const e = (c.eqCompetencies || []).length ? clamp(avg(c.eqCompetencies.map((k) => look(profile.eqProfile, k)))) : 50;
    const score = Math.round((h * 0.35 + i * 0.25 + a * 0.25 + e * 0.15) * 10) / 10;
    return { title: c.title, score };
  });
  scored.sort((x, y) => y.score - x.score || x.title.localeCompare(y.title));
  return scored.slice(0, n);
};

const newMatch = (profile, n = 3) =>
  matchCareers({ ...profile, hollandProfile: ipsatizeInterestScores(profile.hollandProfile) }, n)
    .map((c) => ({ title: c.title, score: c.score }));

const fmt = (arr) => arr.map((c, i) => `${i + 1}. ${c.title} (${c.score})`);

const compare = (heading, profiles) => {
  console.log("\n" + "=".repeat(74) + `\n${heading}\n` + "=".repeat(74));
  const beforeTops = [], afterTops = [];
  for (const [name, p] of Object.entries(profiles)) {
    const before = oldMatch(p, 3), after = newMatch(p, 3);
    beforeTops.push(before[0].title); afterTops.push(after[0].title);
    console.log(`\n${name}`);
    console.log(`  BEFORE: ${fmt(before).join("  |  ")}`);
    console.log(`  AFTER : ${fmt(after).join("  |  ")}`);
  }
  const u = (a) => new Set(a).size;
  console.log(`\n  distinct top career  BEFORE: ${u(beforeTops)}/${beforeTops.length}   AFTER: ${u(afterTops)}/${afterTops.length}`);
  console.log(`  leading w/ Sales Manager  BEFORE: ${beforeTops.filter((t) => t === "Sales Manager").length}   AFTER: ${afterTops.filter((t) => t === "Sales Manager").length}`);
  return { beforeTops, afterTops };
};

console.log("new weights:", JSON.stringify(CAREER_MATCH_WEIGHTS));

// ---- STEP 5: four synthetic profiles, genuinely different dominant signals ---
const synthetic = {
  "A: Investigative/STEM": {
    hollandProfile: { R: 55, I: 92, A: 35, S: 38, E: 45, C: 65 },
    multipleIntelligences: { "Logical-Math": 92, Linguistic: 55, Spatial: 70, Musical: 30, "Bodily-Kinesthetic": 35, Interpersonal: 45, Intrapersonal: 65, Naturalistic: 60 },
    aptitudeScores: { Verbal: 60, Numerical: 95, Abstract: 92, "Spatial Relations": 72, Mechanical: 55, Clerical: 45, "Critical Thinking": 88, "Problem Solving": 85 },
    eqProfile: { "Self-Awareness": 65, "Self-Regulation": 80, Motivation: 78, Empathy: 45, "Social Skills": 50 },
  },
  "B: Artistic/Creative": {
    hollandProfile: { R: 40, I: 42, A: 93, S: 55, E: 50, C: 30 },
    multipleIntelligences: { "Logical-Math": 40, Linguistic: 65, Spatial: 90, Musical: 75, "Bodily-Kinesthetic": 62, Interpersonal: 58, Intrapersonal: 78, Naturalistic: 45 },
    aptitudeScores: { Verbal: 65, Numerical: 45, Abstract: 78, "Spatial Relations": 90, Mechanical: 50, Clerical: 42, "Critical Thinking": 60, "Problem Solving": 58 },
    eqProfile: { "Self-Awareness": 82, "Self-Regulation": 60, Motivation: 70, Empathy: 65, "Social Skills": 55 },
  },
  "C: Social/Helping": {
    hollandProfile: { R: 35, I: 45, A: 50, S: 93, E: 55, C: 40 },
    multipleIntelligences: { "Logical-Math": 45, Linguistic: 78, Spatial: 50, Musical: 55, "Bodily-Kinesthetic": 55, Interpersonal: 93, Intrapersonal: 75, Naturalistic: 50 },
    aptitudeScores: { Verbal: 80, Numerical: 50, Abstract: 58, "Spatial Relations": 50, Mechanical: 40, Clerical: 55, "Critical Thinking": 70, "Problem Solving": 60 },
    eqProfile: { "Self-Awareness": 80, "Self-Regulation": 70, Motivation: 75, Empathy: 95, "Social Skills": 88 },
  },
  "D: Enterprising/Business": {
    hollandProfile: { R: 45, I: 55, A: 45, S: 60, E: 93, C: 70 },
    multipleIntelligences: { "Logical-Math": 70, Linguistic: 78, Spatial: 50, Musical: 35, "Bodily-Kinesthetic": 50, Interpersonal: 90, Intrapersonal: 72, Naturalistic: 45 },
    aptitudeScores: { Verbal: 80, Numerical: 78, Abstract: 65, "Spatial Relations": 55, Mechanical: 50, Clerical: 68, "Critical Thinking": 80, "Problem Solving": 78 },
    eqProfile: { "Self-Awareness": 75, "Self-Regulation": 72, Motivation: 90, Empathy: 60, "Social Skills": 92 },
  },
};

// ---- STEP 6: four "real" report models reproducing the ACTUAL bug. The
// broken interest scorer (no reverse-keying + activity map that can't register
// C/E) compressed everyone into a narrow, E/S-inflated Holland band: each
// student's genuine peak survives only a few points above the inflated
// baseline (~65). High Social Skills EQ is shared by all (extraverts). This is
// the input that made the OLD engine cluster everyone on Sales/people careers.
// Eva and Jatan are both ENFP; their genuine separation is intelligence
// (Eva = linguistic writer, Jatan = musician).
const realReports = {
  "Eva (ENFP-T)": {
    hollandProfile: { R: 60, I: 64, A: 74, S: 72, E: 70, C: 58 }, // genuine A, just above the band
    multipleIntelligences: { "Logical-Math": 45, Linguistic: 88, Spatial: 60, Musical: 58, "Bodily-Kinesthetic": 50, Interpersonal: 80, Intrapersonal: 82, Naturalistic: 50 },
    aptitudeScores: { Verbal: 86, Numerical: 48, Abstract: 60, "Spatial Relations": 52, Mechanical: 35, Clerical: 50, "Critical Thinking": 70, "Problem Solving": 60 },
    eqProfile: { "Self-Awareness": 84, "Self-Regulation": 60, Motivation: 78, Empathy: 88, "Social Skills": 82 },
  },
  "Gopi (ENTP-A)": {
    hollandProfile: { R: 64, I: 76, A: 66, S: 68, E: 74, C: 60 }, // genuine I, just above the band
    multipleIntelligences: { "Logical-Math": 90, Linguistic: 75, Spatial: 66, Musical: 40, "Bodily-Kinesthetic": 45, Interpersonal: 76, Intrapersonal: 65, Naturalistic: 55 },
    aptitudeScores: { Verbal: 76, Numerical: 82, Abstract: 92, "Spatial Relations": 66, Mechanical: 55, Clerical: 45, "Critical Thinking": 90, "Problem Solving": 86 },
    eqProfile: { "Self-Awareness": 70, "Self-Regulation": 60, Motivation: 82, Empathy: 58, "Social Skills": 80 },
  },
  "Yash (ENTJ-A)": {
    hollandProfile: { R: 60, I: 70, A: 56, S: 70, E: 80, C: 72 }, // genuine E, just above the band
    multipleIntelligences: { "Logical-Math": 85, Linguistic: 72, Spatial: 55, Musical: 35, "Bodily-Kinesthetic": 50, Interpersonal: 84, Intrapersonal: 70, Naturalistic: 45 },
    aptitudeScores: { Verbal: 80, Numerical: 88, Abstract: 78, "Spatial Relations": 60, Mechanical: 55, Clerical: 72, "Critical Thinking": 85, "Problem Solving": 82 },
    eqProfile: { "Self-Awareness": 75, "Self-Regulation": 80, Motivation: 88, Empathy: 55, "Social Skills": 90 },
  },
  "Jatan (ENFP-A)": {
    hollandProfile: { R: 58, I: 62, A: 75, S: 73, E: 70, C: 56 }, // genuine A, just above the band
    multipleIntelligences: { "Logical-Math": 48, Linguistic: 68, Spatial: 66, Musical: 90, "Bodily-Kinesthetic": 64, Interpersonal: 78, Intrapersonal: 76, Naturalistic: 52 },
    aptitudeScores: { Verbal: 70, Numerical: 50, Abstract: 62, "Spatial Relations": 62, Mechanical: 40, Clerical: 48, "Critical Thinking": 64, "Problem Solving": 60 },
    eqProfile: { "Self-Awareness": 80, "Self-Regulation": 62, Motivation: 80, Empathy: 86, "Social Skills": 84 },
  },
};

const s = compare("STEP 5 — Synthetic profiles (target: 4/4 distinct, AFTER)", synthetic);
const r = compare("STEP 6 — Real-report models (target: not all Sales Manager, AFTER)", realReports);

console.log("\n" + "#".repeat(74));
console.log("SUMMARY");
console.log(`  synthetic distinct  BEFORE ${new Set(s.beforeTops).size}/4  ->  AFTER ${new Set(s.afterTops).size}/4`);
console.log(`  real distinct       BEFORE ${new Set(r.beforeTops).size}/4  ->  AFTER ${new Set(r.afterTops).size}/4`);
