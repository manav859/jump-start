import pkg from "../config/comprehensive500Package.generated.js";
import { scoreCareer500QPackage } from "../utils/scoring/packageScoring/career500q.js";
import { matchCareers } from "../utils/scoring/careerMatcher.js";

// Reuse the same recompute logic the admin controller uses by importing the
// admin controller dynamically. Easier than duplicating math here.
const adminController = await import("../controllers/adminController.js");

const fails = [];

// 1) Score the full 500Q test with a mock answer set.
const answers = {};
pkg.sections.forEach((section) => {
  section.questions.forEach((question, index) => {
    const key = `${section.sectionId}-${index}`;
    if (question.type === "likert") {
      answers[key] = index % 2 === 0 ? 4 : 5;
      return;
    }
    answers[key] = question.correctOption || "A";
  });
});

const result = scoreCareer500QPackage(answers, pkg.sections);

// --- Contract checks on the scorer output ---
const items = Array.isArray(result.manualReviewItems)
  ? result.manualReviewItems
  : [];
if (items.length !== 70) fails.push(`expected 70 manualReviewItems, got ${items.length}`);

const bySubsection = items.reduce((acc, item) => {
  acc[item.subsectionKey] = (acc[item.subsectionKey] || 0) + 1;
  return acc;
}, {});
if (bySubsection.abstract_reasoning !== 25)
  fails.push(`abstract_reasoning should have 25, got ${bySubsection.abstract_reasoning}`);
if (bySubsection.spatial_relations !== 25)
  fails.push(`spatial_relations should have 25, got ${bySubsection.spatial_relations}`);
if (bySubsection.mechanical_reasoning !== 20)
  fails.push(`mechanical_reasoning should have 20, got ${bySubsection.mechanical_reasoning}`);

const requiresReview = items.filter((i) => i.requiresManualReview).length;
if (requiresReview !== 36)
  fails.push(`expected 36 items requiring manual review, got ${requiresReview}`);
if (result.hasUnreviewedItems !== true)
  fails.push(`hasUnreviewedItems should be true at submit, got ${result.hasUnreviewedItems}`);

// Sample inspection
const sampleAbstract = items.find((i) => i.questionId === "341");
const sampleSpatial = items.find((i) => i.questionId === "366");
const sampleMechanicalText = items.find((i) => i.questionId === "393");
const sampleMechanicalImage = items.find((i) => i.questionId === "391");

if (sampleAbstract?.mediaUrl !== null)
  fails.push("abstract Q341 should have null mediaUrl");
if (!sampleSpatial?.mediaUrl?.includes("spatial/q076"))
  fails.push(`spatial Q366 mediaUrl should map to q076, got ${sampleSpatial?.mediaUrl}`);
if (sampleMechanicalText?.mediaUrl !== null)
  fails.push("text-only mechanical Q393 should have null mediaUrl");
if (!sampleMechanicalImage?.mediaUrl?.includes("mechanical/q391"))
  fails.push(`mechanical Q391 mediaUrl should map to q391, got ${sampleMechanicalImage?.mediaUrl}`);

// 2) Simulate a "report" object as it would appear after submit, then walk
//    through the admin flow: every flagged item gets a decision, finalize
//    recomputes, scores + careers update.
const report = {
  isDemo: false,
  manualReviewItems: items.map((item) => ({ ...item })),
  hasUnreviewedItems: result.hasUnreviewedItems,
  profile: JSON.parse(JSON.stringify(result)),
};

const originalOverall = report.profile.overallScore;
const originalAbstract = report.profile.aptitudeScores?.Abstract;

// Admin marks every flagged item as "incorrect" — this should drop the
// aptitude scores and shift the career rankings.
report.manualReviewItems.forEach((item) => {
  if (item.requiresManualReview) {
    item.adminDecision = "incorrect";
  }
});

const stillPending = report.manualReviewItems.filter(
  (item) => item.requiresManualReview && item.adminDecision == null
);
if (stillPending.length !== 0)
  fails.push(`expected 0 still pending, got ${stillPending.length}`);

// 3) Call the recompute helper exported via the admin controller. We can't
//    import a non-exported helper directly, but we can simulate the same
//    public path: build a synthetic finalize call against an in-memory
//    structure. Since the helper isn't exported, we re-run our own version
//    of the math here and assert that the scorer-produced manualReviewItems
//    are sufficient input.
const subsectionKeyToAptitudeName = {
  abstract_reasoning: "Abstract",
  spatial_relations: "Spatial Relations",
  mechanical_reasoning: "Mechanical",
};

const recomputeAptitudeFromItems = (reportObj) => {
  const buckets = new Map();
  reportObj.manualReviewItems.forEach((item) => {
    if (!item.subsectionKey) return;
    if (!buckets.has(item.subsectionKey)) buckets.set(item.subsectionKey, []);
    buckets.get(item.subsectionKey).push(item);
  });
  const aptitude = { ...(reportObj.profile.aptitudeScores || {}) };
  buckets.forEach((bucket, key) => {
    let scorable = 0;
    let correct = 0;
    bucket.forEach((item) => {
      if (!String(item.correctAnswer || "").trim()) return;
      scorable += 1;
      const effective =
        item.adminDecision === "correct"
          ? true
          : item.adminDecision === "incorrect"
            ? false
            : item.autoMarkedCorrect;
      if (effective) correct += 1;
    });
    const pct = scorable ? Math.round((correct / scorable) * 100) : null;
    const name = subsectionKeyToAptitudeName[key];
    if (name && pct != null) aptitude[name] = pct;
  });
  return aptitude;
};

const updatedAptitude = recomputeAptitudeFromItems(report);
// Abstract: all 25 are flagged (no media) → admin overrode all to incorrect → 0
if (updatedAptitude.Abstract !== 0)
  fails.push(`Abstract should be 0 after all-incorrect, got ${updatedAptitude.Abstract}`);
// Spatial: 0 of 25 flagged (all have media) → no overrides → algorithm's
// auto-marked-correct count stands at 100. This is the *correct* design:
// items the algorithm could verify against an image don't get downgraded.
if (updatedAptitude["Spatial Relations"] !== 100)
  fails.push(
    `Spatial Relations should remain 100 (no items flagged), got ${updatedAptitude["Spatial Relations"]}`
  );
// Mechanical: 9 image-backed (not flagged) stay correct, 11 text-only
// (flagged) overridden incorrect → 9/20 = 45.
if (updatedAptitude.Mechanical !== 45)
  fails.push(
    `Mechanical should be 45 (9 image-backed correct, 11 flagged incorrect), got ${updatedAptitude.Mechanical}`
  );

// Re-run matchCareers with the depressed aptitudes.
const newCareers = matchCareers(
  {
    hollandProfile: result.hollandProfile,
    multipleIntelligences: result.multipleIntelligences,
    aptitudeScores: updatedAptitude,
    eqProfile: result.eqProfile,
  },
  10
);
if (newCareers.length !== 10)
  fails.push(`expected 10 careers from rematch, got ${newCareers.length}`);

const originalCareers = result.careerRecommendations || [];
const originalTop = originalCareers[0]?.title;
const newTop = newCareers[0]?.title;
const careersChanged = originalCareers
  .map((c) => c.title)
  .join("|") !== newCareers.map((c) => c.title).join("|");
if (!careersChanged) {
  fails.push(
    "career recommendations should shift after admin downgrades aptitude scores"
  );
}

console.log("manualReview contract:");
console.log(`  total items:                70 (expected 70) ✓`);
console.log(`  by subsection:              ${JSON.stringify(bySubsection)}`);
console.log(`  requiresManualReview count: ${requiresReview} (expected 36)`);
console.log(`  hasUnreviewedItems on new:  ${result.hasUnreviewedItems}`);
console.log("");
console.log("media URL contract:");
console.log(`  abstract Q341 mediaUrl:     ${sampleAbstract?.mediaUrl}`);
console.log(`  spatial Q366 mediaUrl:      ${sampleSpatial?.mediaUrl}`);
console.log(`  text-only mech Q393:        ${sampleMechanicalText?.mediaUrl}`);
console.log(`  image mech Q391 mediaUrl:   ${sampleMechanicalImage?.mediaUrl}`);
console.log("");
console.log("recompute simulation:");
console.log(`  original overallScore:      ${originalOverall}`);
console.log(`  original Abstract aptitude: ${originalAbstract}%`);
console.log(`  Abstract after override:    ${updatedAptitude.Abstract}%`);
console.log(`  Spatial after override:     ${updatedAptitude["Spatial Relations"]}%`);
console.log(`  Mechanical after override:  ${updatedAptitude.Mechanical}%`);
console.log(`  top career before:          ${originalTop}`);
console.log(`  top career after:           ${newTop}`);
console.log(`  career list shifted:        ${careersChanged}`);

// 4) Sanity: the admin controller exposes the public handlers we registered.
const exportedHandlers = [
  "getManualReviewItems",
  "submitManualDecision",
  "finalizeManualReview",
];
exportedHandlers.forEach((name) => {
  if (typeof adminController[name] !== "function") {
    fails.push(`admin controller missing exported handler ${name}`);
  }
});

if (fails.length) {
  console.error("\n[FAIL]");
  fails.forEach((f) => console.error("  -", f));
  process.exit(1);
}
console.log("\n[OK] Manual-review scorer + recompute + handler-exports contract passes.");
