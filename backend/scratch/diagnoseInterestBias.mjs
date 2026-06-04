import { matchCareers } from "../utils/scoring/careerMatcher.js";
import CAREER_500Q_CONFIG from "../utils/scoring/configs/career500q.config.js";

// ---- (a) Activity -> RIASEC option-map coverage -----------------------------
// Pull the live optionRiasecMap from the config (Activity Preferences 3.3).
const interestSection = CAREER_500Q_CONFIG.sections.find((s) => s.key === "interest");
const activitySub = interestSection.subsections.find((s) => s.key === "activity_preferences");
const map = activitySub.optionRiasecMap || {};
const cov = { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 };
Object.values(map).forEach((opts) =>
  Object.values(opts).forEach((k) => { if (cov[k] != null) cov[k] += 1; })
);
console.log("Activity->RIASEC option coverage (how many A/B/C options route to each type):");
Object.entries(cov).forEach(([k, v]) =>
  console.log(`  ${k.padEnd(15)} ${String(v).padStart(2)} options${v === 0 ? "   <<< UNREACHABLE" : v <= 2 ? "   <<< barely reachable" : ""}`)
);

// ---- (b) reverse-keying coverage in RIASEC Likert ---------------------------
const riasec = interestSection.subsections.find((s) => s.key === "holland_riasec");
const totalRev = riasec.factors.reduce((n, f) => n + (f.reverseQuestions?.length || 0), 0);
console.log(`\nRIASEC Likert reverse-scored questions: ${totalRev} (0 => acquiescence/agreement bias inflates ALL six types for "yes"-leaning students)`);

// ---- Model what the BIASED pipeline produces --------------------------------
// Real failure mode: the interest scorer flattens everyone toward a similar
// moderately-high E/S profile (acquiescence + extraversion + activity map that
// can't register I/C/A strongly enough to dominate). Underlying aptitude /
// intelligence still differ between students, but the dominant Holland signal
// is the SAME for all four. This reproduces the reported all-Sales clustering.
const FLAT_E_HOLLAND = { R: 50, I: 58, A: 55, S: 68, E: 70, C: 52 }; // same for all four
const biased = {
  "Eva (ENFP-T)":  { hollandProfile: { ...FLAT_E_HOLLAND }, multipleIntelligences: { "Logical-Math": 45, Linguistic: 85, Spatial: 62, Musical: 70, "Bodily-Kinesthetic": 55, Interpersonal: 84, Intrapersonal: 78, Naturalistic: 50 }, aptitudeScores: { Verbal: 82, Numerical: 48, Abstract: 60, "Spatial Relations": 55, Mechanical: 35, Clerical: 50, "Critical Thinking": 70, "Problem Solving": 60 }, eqProfile: { "Self-Awareness": 80, "Self-Regulation": 60, Motivation: 78, Empathy: 90, "Social Skills": 85 } },
  "Gopi (ENTP-A)": { hollandProfile: { ...FLAT_E_HOLLAND }, multipleIntelligences: { "Logical-Math": 88, Linguistic: 75, Spatial: 65, Musical: 40, "Bodily-Kinesthetic": 45, Interpersonal: 78, Intrapersonal: 65, Naturalistic: 55 }, aptitudeScores: { Verbal: 78, Numerical: 80, Abstract: 90, "Spatial Relations": 65, Mechanical: 55, Clerical: 45, "Critical Thinking": 88, "Problem Solving": 85 }, eqProfile: { "Self-Awareness": 70, "Self-Regulation": 60, Motivation: 82, Empathy: 60, "Social Skills": 82 } },
  "Yash (ENTJ-A)": { hollandProfile: { ...FLAT_E_HOLLAND }, multipleIntelligences: { "Logical-Math": 85, Linguistic: 72, Spatial: 55, Musical: 35, "Bodily-Kinesthetic": 50, Interpersonal: 82, Intrapersonal: 70, Naturalistic: 45 }, aptitudeScores: { Verbal: 80, Numerical: 88, Abstract: 78, "Spatial Relations": 60, Mechanical: 55, Clerical: 70, "Critical Thinking": 85, "Problem Solving": 82 }, eqProfile: { "Self-Awareness": 75, "Self-Regulation": 78, Motivation: 88, Empathy: 55, "Social Skills": 88 } },
  "Jatan (ENFP-A)":{ hollandProfile: { ...FLAT_E_HOLLAND }, multipleIntelligences: { "Logical-Math": 48, Linguistic: 82, Spatial: 68, Musical: 85, "Bodily-Kinesthetic": 60, Interpersonal: 85, Intrapersonal: 75, Naturalistic: 52 }, aptitudeScores: { Verbal: 80, Numerical: 50, Abstract: 62, "Spatial Relations": 60, Mechanical: 38, Clerical: 48, "Critical Thinking": 68, "Problem Solving": 62 }, eqProfile: { "Self-Awareness": 82, "Self-Regulation": 62, Motivation: 80, Empathy: 88, "Social Skills": 86 } },
};

console.log("\n" + "=".repeat(72));
console.log("Reproduction: when the interest scorer flattens everyone to E/S-dominant");
console.log("(same hollandProfile for all, different aptitude/intelligence):");
console.log("=".repeat(72));
const tops = [];
for (const [name, p] of Object.entries(biased)) {
  const top3 = matchCareers(p, 3);
  tops.push([name, top3[0].title]);
  console.log(`\n${name}:`);
  top3.forEach((c) => {
    const b = c.breakdown;
    console.log(`  ${c.title.padEnd(28)} ${String(c.score).padStart(5)}%  H:${b.hollandMatch} I:${b.intelligenceMatch} A:${b.aptitudeMatch} EQ:${b.eqMatch}`);
  });
}
const uniq = new Set(tops.map(([, t]) => t));
console.log(`\nDistinct top careers: ${uniq.size}/4 ${uniq.size === 1 ? "<<< CLUSTERED on " + [...uniq][0] : ""}`);
