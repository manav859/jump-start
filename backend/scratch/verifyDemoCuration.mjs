import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";
import {
  DEMO_QUESTION_IDS,
  DEMO_SECTION_BLUEPRINT,
  buildDemoPackageDoc,
} from "../utils/scoring/configs/career500qDemo.config.js";
import scoreCareer500QDemoPackage from "../utils/scoring/packageScoring/career500qDemo.js";

const sourceById = new Map();
for (const section of COMPREHENSIVE_500_PACKAGE.sections || []) {
  for (const q of section.questions || []) {
    sourceById.set(String(q.questionId), { section: section.title, q });
  }
}

const missing = DEMO_QUESTION_IDS.filter((id) => !sourceById.has(String(id)));
const present = DEMO_QUESTION_IDS.filter((id) => sourceById.has(String(id)));

console.log(`Total curated IDs: ${DEMO_QUESTION_IDS.length}`);
console.log(`Present in source: ${present.length}`);
console.log(`Missing from source: ${missing.length}`);
if (missing.length) {
  console.log("Missing IDs:", missing);
  process.exit(1);
}

const demoPkg = buildDemoPackageDoc(COMPREHENSIVE_500_PACKAGE);
console.log(`\nBuilt demo package: ${demoPkg.id}`);
demoPkg.sections.forEach((s) => {
  const types = new Set(s.questions.map((q) => q.type));
  console.log(
    `  s${s.sectionId} "${s.title}": ${s.questions.length}q  types=${[...types].join(",")}`
  );
});

const answers = {};
demoPkg.sections.forEach((s) => {
  s.questions.forEach((q, idx) => {
    const key = `${s.sectionId}-${idx}`;
    if (q.type === "likert") {
      answers[key] = 4;
    } else {
      answers[key] = q.correctOption || "A";
    }
  });
});

const result = scoreCareer500QDemoPackage(answers, demoPkg.sections);
if (!result) {
  console.error("Scorer returned null");
  process.exit(1);
}

console.log("\nScoring result:");
console.log("  overallScore:", result.overallScore);
console.log("  overallPercentile:", result.overallPercentile);
console.log("  algorithmKey:", result.metadata?.algorithmKey);
console.log("  packageId in metadata:", result.metadata?.packageId);
console.log("  strengths:", result.strengths?.length || 0);
console.log("  careerRecommendations:", result.careerRecommendations?.length || 0);
console.log("  personalityType:", result.personalityType?.code, "-", result.personalityType?.title);
console.log("  sectionBreakdown sections:", result.sectionBreakdown?.length || 0);

const aptitudeSection = (result.sectionBreakdown || []).find((s) => s.key === "aptitude");
if (aptitudeSection) {
  console.log("\n  Aptitude subsection bands (should be percentage-driven):");
  (aptitudeSection.subsections || []).forEach((sub) => {
    console.log(
      `    ${sub.key}: percentage=${sub.percentage}%  band=${sub.band}  range=${sub.bandRangeLabel}`
    );
  });
}

if (result.careerRecommendations?.length < 3) {
  console.error("\n[FAIL] Expected >=3 career recommendations");
  process.exit(1);
}
if (result.overallScore == null) {
  console.error("\n[FAIL] overallScore is null");
  process.exit(1);
}
if (result.metadata?.algorithmKey !== "career-500q-demo-v1") {
  console.error("\n[FAIL] algorithmKey not stamped correctly");
  process.exit(1);
}
console.log("\n[OK] Demo curation + scoring smoke passed.");
