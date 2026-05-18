// Audit personality profile output across three scenarios.
import pkg from "../config/comprehensive500Package.generated.js";
import { scoreCareer500QPackage } from "../utils/scoring/packageScoring/career500q.js";
import CAREER_500Q_CONFIG from "../utils/scoring/configs/career500q.config.js";

const buildAnswers = (scenario) => {
  const answers = {};
  pkg.sections.forEach((section) => {
    (section.questions || []).forEach((question, index) => {
      const key = `${section.sectionId}-${index}`;
      if (question.type === "likert") {
        if (scenario === "all-5") answers[key] = 5;
        else if (scenario === "all-1") answers[key] = 1;
        else answers[key] = index % 2 === 0 ? 4 : 5;
      } else {
        answers[key] = question.correctOption || "A";
      }
    });
  });
  return answers;
};

const summarisePersonality = (label, result) => {
  const breakdown = result?.sectionBreakdown || [];
  const personality = breakdown.find((s) => s.key === "personality");
  const subs = personality?.subsections || [];

  const ocean = subs.find((s) => s.key === "big_five_ocean");
  const hspq = subs.find((s) => s.key === "hspq_factors");
  const workStyle = subs.find((s) => s.key === "work_style_preferences");
  const leadership = subs.find((s) => s.key === "leadership_social_interaction");

  console.log(`\n=== ${label} ===`);
  console.log(`Top-level personalityType:`, result?.personalityType);
  console.log();

  console.log("OCEAN factor results:");
  (ocean?.factorResults || []).forEach((f) => {
    console.log(
      `  ${f.key.padEnd(20)} avg=${String(f.average).padEnd(5)} pct=${String(f.percentage).padEnd(4)} band="${f.band}"`
    );
  });

  console.log("\nHSPQ factor results:");
  (hspq?.factorResults || []).forEach((f) => {
    console.log(
      `  ${f.key.padEnd(25)} avg=${String(f.average).padEnd(5)} pct=${String(f.percentage).padEnd(4)} band="${f.band}"`
    );
  });

  console.log("\nWork Style:");
  console.log(`  band/dominant       : "${workStyle?.band}"`);
  console.log(`  percentage (consist): ${workStyle?.percentage}`);
  console.log(`  score (dominantCnt) : ${workStyle?.score}`);
  console.log(`  status              : ${workStyle?.status}`);
  console.log(`  interpretation      : "${workStyle?.interpretation}"`);
  console.log(`  answeredCount/total : ${workStyle?.answeredCount}/${workStyle?.totalQuestions}`);

  console.log("\nLeadership (the 4th personality subsection):");
  console.log(`  percentage          : ${leadership?.percentage}`);
  console.log(`  status              : ${leadership?.status}`);
  console.log(`  band                : "${leadership?.band}"`);
};

const runAll = () => {
  for (const scenario of ["all-5", "all-1", "mixed"]) {
    const answers = buildAnswers(scenario);
    const result = scoreCareer500QPackage(answers, pkg.sections);
    summarisePersonality(`FULL :: ${scenario}`, result);
  }
};

// Config audit
const oceanSubsection = CAREER_500Q_CONFIG.sections[0].subsections[0];
console.log(
  `\n=== OCEAN config audit (${oceanSubsection.label}) ===`
);
console.log(`Question range: Q${Math.min(...oceanSubsection.questionNumbers)}-Q${Math.max(...oceanSubsection.questionNumbers)}`);
const allOceanQs = new Set();
const oceanOverlaps = [];
oceanSubsection.factors.forEach((f) => {
  f.questionNumbers.forEach((q) => {
    if (allOceanQs.has(q)) oceanOverlaps.push({ q, factor: f.key });
    allOceanQs.add(q);
  });
});
console.log(`OCEAN factors defined:`, oceanSubsection.factors.map((f) => f.key));
console.log(`Total unique question IDs across factors: ${allOceanQs.size}`);
console.log(`Overlaps:`, oceanOverlaps.length ? oceanOverlaps : "none");
oceanSubsection.factors.forEach((f) => {
  console.log(
    `  ${f.key.padEnd(20)} questions: [${f.questionNumbers.join(", ")}]  reverse: [${(f.reverseQuestions || []).join(", ")}]`
  );
});

const hspqSubsection = CAREER_500Q_CONFIG.sections[0].subsections[1];
console.log(`\n=== HSPQ config audit ===`);
console.log(`HSPQ factors:`, hspqSubsection.factors.length);
hspqSubsection.factors.forEach((f) => {
  console.log(
    `  ${f.key.padEnd(22)} questions: [${f.questionNumbers.join(", ")}]  reverse: [${(f.reverseQuestions || []).join(", ")}]`
  );
});

const workStyleSubsection = CAREER_500Q_CONFIG.sections[0].subsections[2];
console.log(`\n=== Work Style config audit ===`);
console.log(`Question range: Q${Math.min(...workStyleSubsection.questionNumbers)}-Q${Math.max(...workStyleSubsection.questionNumbers)}`);
console.log(`profileOptions keys:`, Object.keys(workStyleSubsection.profileOptions || {}));
console.log(`Profile definitions:`);
Object.entries(workStyleSubsection.profileOptions || {}).forEach(([k, v]) => {
  console.log(`  ${k} = ${v.label} (${v.key})`);
});

runAll();
