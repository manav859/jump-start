// Audit how many Section 4 questions have a valid correctOption.
import pkg from "../config/comprehensive500Package.generated.js";

const section4 = pkg.sections.find((s) => Number(s.sectionId) === 4);
if (!section4) {
  console.error("Section 4 not found");
  process.exit(1);
}

const questions = section4.questions || [];
const total = questions.length;

const SUBSECTION_RANGES = [
  { key: "verbal_reasoning",    start: 291, end: 315 },
  { key: "numerical_ability",   start: 316, end: 340 },
  { key: "abstract_reasoning",  start: 341, end: 365 },
  { key: "spatial_relations",   start: 366, end: 390 },
  { key: "mechanical_reasoning",start: 391, end: 410 },
  { key: "clerical_accuracy",   start: 411, end: 430 },
  { key: "critical_thinking",   start: 431, end: 440 },
  { key: "problem_solving",     start: 441, end: 450 },
];

const subForId = (id) => SUBSECTION_RANGES.find((r) => id >= r.start && id <= r.end)?.key || "(out of range)";

const withKey = [];
const missingKey = [];

for (const q of questions) {
  const id = Number(q.questionId);
  const correct = String(q.correctOption || "").trim();
  if (correct) withKey.push({ id, sub: subForId(id) });
  else missingKey.push({ id, sub: subForId(id), text: String(q.text || "").slice(0, 70) });
}

const tally = (rows) =>
  rows.reduce((acc, r) => ((acc[r.sub] = (acc[r.sub] || 0) + 1), acc), {});

console.log(`Section 4 answer-key audit (full 500Q package):`);
console.log(`  Total objective questions:     ${total}`);
console.log(`  Has valid answer key:          ${withKey.length}`);
console.log(`  Missing answer key (-> review): ${missingKey.length}`);
console.log();
console.log("Per-subsection (with key / missing):");
const withTally = tally(withKey);
const missingTally = tally(missingKey);
SUBSECTION_RANGES.forEach((r) => {
  const expected = r.end - r.start + 1;
  const wk = withTally[r.key] || 0;
  const mk = missingTally[r.key] || 0;
  console.log(`  ${r.key.padEnd(24)} ${wk}/${expected} have key   ${mk} missing`);
});

if (missingKey.length) {
  console.log("\nSample of questions missing an answer key:");
  missingKey.slice(0, 10).forEach((row) => {
    console.log(`  Q${row.id} [${row.sub}]  ${row.text}`);
  });
}
