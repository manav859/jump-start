import { matchCareers } from "../utils/scoring/careerMatcher.js";
import CAREER_MAPPINGS from "../data/careerMappingData.js";

// ---------------------------------------------------------------------------
// STEP 2 (run first because it informs the diagnosis): Holland PRIMARY
// distribution across the 125 careers. hollandCodes[0] is the primary code.
// ---------------------------------------------------------------------------
const primaryCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
const anyCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
CAREER_MAPPINGS.forEach((c) => {
  const codes = Array.isArray(c.hollandCodes) ? c.hollandCodes : [];
  if (codes[0]) primaryCounts[codes[0]] += 1;
  codes.forEach((code) => {
    if (anyCounts[code] != null) anyCounts[code] += 1;
  });
});
const LABEL = { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" };
console.log(`Total careers: ${CAREER_MAPPINGS.length}\n`);
console.log("Holland PRIMARY (hollandCodes[0]) distribution:");
Object.entries(primaryCounts).forEach(([k, v]) =>
  console.log(`  ${LABEL[k].padEnd(15)} primary: ${String(v).padStart(2)}   (appears anywhere: ${anyCounts[k]})`)
);

// How many careers list a "people skill" requirement that almost every
// extravert scores high on?
const reqInterpersonal = CAREER_MAPPINGS.filter((c) => (c.intelligenceTypes || []).includes("Interpersonal")).length;
const reqSocialSkills = CAREER_MAPPINGS.filter((c) => (c.eqCompetencies || []).includes("Social Skills")).length;
const reqMotivation = CAREER_MAPPINGS.filter((c) => (c.eqCompetencies || []).includes("Motivation")).length;
console.log(`\nCareers requiring Interpersonal intelligence: ${reqInterpersonal}/${CAREER_MAPPINGS.length}`);
console.log(`Careers requiring Social Skills EQ:         ${reqSocialSkills}/${CAREER_MAPPINGS.length}`);
console.log(`Careers requiring Motivation EQ:            ${reqMotivation}/${CAREER_MAPPINGS.length}`);

// ---------------------------------------------------------------------------
// STEP 1: reproduce the clustering. Four plausible profiles for the four
// flagged personality types. All four are Extraverted+Intuitive (so high
// Social Skills / Interpersonal / Motivation, as real extraverts answer), but
// each has a GENUINELY DIFFERENT dominant interest + intelligence + aptitude:
//   Eva  ENFP-T : Artistic + Social, linguistic/empathy, weak numerical
//   Gopi ENTP-A : Investigative + Enterprising, logical, strong abstract
//   Yash ENTJ-A : Enterprising + Conventional, logical, strong numerical
//   Jatan ENFP-A: Artistic + Social, musical/linguistic, weak numerical
// ---------------------------------------------------------------------------
const profiles = {
  "Eva (ENFP-T)": {
    hollandProfile: { R: 30, I: 45, A: 88, S: 82, E: 62, C: 35 },
    multipleIntelligences: {
      "Logical-Math": 45, Linguistic: 85, Spatial: 62, Musical: 70,
      "Bodily-Kinesthetic": 55, Interpersonal: 84, Intrapersonal: 78, Naturalistic: 50,
    },
    aptitudeScores: {
      Verbal: 82, Numerical: 48, Abstract: 60, "Spatial Relations": 55,
      Mechanical: 35, Clerical: 50, "Critical Thinking": 70, "Problem Solving": 60,
    },
    eqProfile: { "Self-Awareness": 80, "Self-Regulation": 60, Motivation: 78, Empathy: 90, "Social Skills": 85 },
  },
  "Gopi (ENTP-A)": {
    hollandProfile: { R: 45, I: 85, A: 60, S: 50, E: 80, C: 45 },
    multipleIntelligences: {
      "Logical-Math": 88, Linguistic: 75, Spatial: 65, Musical: 40,
      "Bodily-Kinesthetic": 45, Interpersonal: 78, Intrapersonal: 65, Naturalistic: 55,
    },
    aptitudeScores: {
      Verbal: 78, Numerical: 80, Abstract: 90, "Spatial Relations": 65,
      Mechanical: 55, Clerical: 45, "Critical Thinking": 88, "Problem Solving": 85,
    },
    eqProfile: { "Self-Awareness": 70, "Self-Regulation": 60, Motivation: 82, Empathy: 60, "Social Skills": 82 },
  },
  "Yash (ENTJ-A)": {
    hollandProfile: { R: 40, I: 70, A: 40, S: 50, E: 90, C: 78 },
    multipleIntelligences: {
      "Logical-Math": 85, Linguistic: 72, Spatial: 55, Musical: 35,
      "Bodily-Kinesthetic": 50, Interpersonal: 82, Intrapersonal: 70, Naturalistic: 45,
    },
    aptitudeScores: {
      Verbal: 80, Numerical: 88, Abstract: 78, "Spatial Relations": 60,
      Mechanical: 55, Clerical: 70, "Critical Thinking": 85, "Problem Solving": 82,
    },
    eqProfile: { "Self-Awareness": 75, "Self-Regulation": 78, Motivation: 88, Empathy: 55, "Social Skills": 88 },
  },
  "Jatan (ENFP-A)": {
    hollandProfile: { R: 35, I: 50, A: 90, S: 80, E: 65, C: 30 },
    multipleIntelligences: {
      "Logical-Math": 48, Linguistic: 82, Spatial: 68, Musical: 85,
      "Bodily-Kinesthetic": 60, Interpersonal: 85, Intrapersonal: 75, Naturalistic: 52,
    },
    aptitudeScores: {
      Verbal: 80, Numerical: 50, Abstract: 62, "Spatial Relations": 60,
      Mechanical: 38, Clerical: 48, "Critical Thinking": 68, "Problem Solving": 62,
    },
    eqProfile: { "Self-Awareness": 82, "Self-Regulation": 62, Motivation: 80, Empathy: 88, "Social Skills": 86 },
  },
};

console.log("\n" + "=".repeat(78));
console.log("STEP 1 — Top-5 career match breakdown per flagged profile");
console.log("=".repeat(78));
for (const [name, profile] of Object.entries(profiles)) {
  const top5 = matchCareers(profile, 5);
  console.log(`\n${name}:`);
  top5.forEach((c) => {
    const b = c.breakdown;
    console.log(
      `  ${c.title.padEnd(26)} ${String(c.score).padStart(5)}%  -> ` +
        `Holland:${String(b.hollandMatch).padStart(4)}  Intel:${String(b.intelligenceMatch).padStart(4)}  ` +
        `Apt:${String(b.aptitudeMatch).padStart(4)}  EQ:${String(b.eqMatch).padStart(4)}`
    );
  });
}

// Top-1 summary
console.log("\n" + "-".repeat(78));
console.log("TOP CAREER PER PROFILE:");
const tops = Object.entries(profiles).map(([name, p]) => [name, matchCareers(p, 1)[0].title]);
tops.forEach(([name, title]) => console.log(`  ${name.padEnd(16)} -> ${title}`));
const uniqueTops = new Set(tops.map(([, t]) => t));
console.log(`\nDistinct top careers: ${uniqueTops.size}/4  ${uniqueTops.size === 1 ? "<<< CLUSTERED" : ""}`);
