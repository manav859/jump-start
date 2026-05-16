import { matchCareers, CAREER_MATCHER_INFO } from "../utils/scoring/careerMatcher.js";

console.log("CAREER_MATCHER_INFO:", CAREER_MATCHER_INFO);

// A differentiated profile: this student leans investigative + logical,
// strong numerical/abstract aptitudes, high self-regulation.
const stemProfile = {
  hollandProfile: { R: 50, I: 92, A: 35, S: 40, E: 55, C: 70 },
  multipleIntelligences: {
    "Logical-Math": 90,
    Linguistic: 55,
    Spatial: 70,
    Musical: 30,
    "Bodily-Kinesthetic": 35,
    Interpersonal: 50,
    Intrapersonal: 65,
    Naturalistic: 60,
  },
  aptitudeScores: {
    Verbal: 60,
    Numerical: 95,
    Abstract: 90,
    "Spatial Relations": 75,
    Mechanical: 55,
    Clerical: 45,
    "Critical Thinking": 85,
    "Problem Solving": 80,
  },
  eqProfile: {
    "Self-Awareness": 65,
    "Self-Regulation": 85,
    Motivation: 80,
    Empathy: 50,
    "Social Skills": 55,
  },
};

const top10 = matchCareers(stemProfile, 10);
console.log("\nSTEM-leaning profile · top 10:");
top10.forEach((c, i) => {
  console.log(
    `${String(i + 1).padStart(2)}. ${c.title.padEnd(36)} ` +
      `[${c.category}]  score=${c.score}  H=${c.breakdown.hollandMatch} ` +
      `I=${c.breakdown.intelligenceMatch} A=${c.breakdown.aptitudeMatch} ` +
      `E=${c.breakdown.eqMatch}`
  );
});

// A social/artistic profile: should pull different careers
const artsSocialProfile = {
  hollandProfile: { R: 30, I: 40, A: 90, S: 88, E: 60, C: 35 },
  multipleIntelligences: {
    "Logical-Math": 45,
    Linguistic: 88,
    Spatial: 65,
    Musical: 80,
    "Bodily-Kinesthetic": 60,
    Interpersonal: 90,
    Intrapersonal: 80,
    Naturalistic: 45,
  },
  aptitudeScores: {
    Verbal: 90,
    Numerical: 55,
    Abstract: 70,
    "Spatial Relations": 60,
    Mechanical: 40,
    Clerical: 55,
    "Critical Thinking": 80,
    "Problem Solving": 65,
  },
  eqProfile: {
    "Self-Awareness": 85,
    "Self-Regulation": 70,
    Motivation: 75,
    Empathy: 92,
    "Social Skills": 88,
  },
};

const top10Arts = matchCareers(artsSocialProfile, 10);
console.log("\nArts/Social-leaning profile · top 10:");
top10Arts.forEach((c, i) => {
  console.log(
    `${String(i + 1).padStart(2)}. ${c.title.padEnd(36)} [${c.category}]  score=${c.score}`
  );
});

console.log("\nSample matchReasons (top STEM career):");
console.log(JSON.stringify(top10[0].matchReasons, null, 2));

// Contract checks
const fails = [];
if (top10.length !== 10) fails.push(`top10 length ${top10.length} !== 10`);
if (top10[0].score < 60) fails.push(`top STEM score ${top10[0].score} < 60`);
const titles = top10.map((c) => c.title);
if (new Set(titles).size !== titles.length) fails.push("duplicate titles in top10");
const requiredKeys = ["title", "category", "score", "matchReasons"];
requiredKeys.forEach((k) => {
  if (!(k in top10[0])) fails.push(`missing key ${k}`);
});
const reasonKeys = ["holland", "intelligence", "aptitude", "eq"];
reasonKeys.forEach((k) => {
  if (!top10[0].matchReasons[k]) fails.push(`missing matchReason.${k}`);
});

// Differentiation check: top STEM list should look different from top arts list
const stemTopThree = top10.slice(0, 3).map((c) => c.title);
const artsTopThree = top10Arts.slice(0, 3).map((c) => c.title);
const overlap = stemTopThree.filter((t) => artsTopThree.includes(t));
if (overlap.length === 3) fails.push("STEM and Arts profiles produced identical top 3 (bad)");

if (fails.length) {
  console.error("\n[FAIL]", fails);
  process.exit(1);
}
console.log("\n[OK] careerMatcher contract checks pass.");
