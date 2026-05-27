// Export the Section 4 (Aptitude Battery) answer key as a clean,
// shareable markdown file.
//
// Why
// ---
// Counsellors and the client occasionally need the canonical answer key
// to spot-check graded reports or to prepare reference material. The
// 160 Section 4 questions live inside the package config — this script
// pulls them out, groups them by subsection (verbal / numerical /
// abstract / spatial / mechanical / clerical / critical / problem-
// solving), and emits a markdown document ready to share or convert
// to PDF.
//
// Usage
// -----
//   npm run export:answer-key
//
// Output
//   backend/exports/section4-answer-key.md

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "exports");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "section4-answer-key.md");

// Subsection ranges sourced from career500qEvaluationSpec.js + the
// SECTION 4 sub-structure in test500.json. Each entry maps a contiguous
// question-id range to a human-readable subsection title.
const SUBSECTIONS = [
  { title: "Verbal Reasoning",     start: 291, end: 315 },
  { title: "Numerical Ability",    start: 316, end: 340 },
  { title: "Abstract Reasoning",   start: 341, end: 365 },
  { title: "Spatial Relations",    start: 366, end: 390 },
  { title: "Mechanical Reasoning", start: 391, end: 410 },
  { title: "Clerical Accuracy",    start: 411, end: 430 },
  { title: "Critical Thinking",    start: 431, end: 440 },
  { title: "Problem Solving",      start: 441, end: 450 },
];

const subsectionFor = (id) => {
  const n = Number(id);
  return SUBSECTIONS.find((s) => n >= s.start && n <= s.end) || null;
};

// Render an answer line. Single-choice items show the letter and the
// matching option text (so the answer key is self-contained — no need
// to cross-reference). Items with a blank correctAnswer (rare — almost
// all Section 4 items have one) emit a "manual review" placeholder so
// the reader knows it isn't a typo.
const formatAnswer = (question) => {
  const letter = String(question.correctOption || "").trim().toUpperCase();
  if (!letter) return "_(no key — manual review required)_";
  const idx = letter.charCodeAt(0) - "A".charCodeAt(0);
  const options = Array.isArray(question.options) ? question.options : [];
  const optionText = options[idx];
  if (optionText) {
    return `**${letter}** — ${optionText}`;
  }
  return `**${letter}**`;
};

const renderQuestionBlock = (question) => {
  const id = question.questionId;
  const text = String(question.text || "").trim() || "_(question text missing)_";
  const opts = Array.isArray(question.options) ? question.options : [];
  const renderedOptions = opts
    .map((opt, i) => `   ${String.fromCharCode(65 + i)}. ${opt}`)
    .join("\n");

  return [
    `**Q${id}.** ${text}`,
    renderedOptions || null,
    `      Correct Answer: ${formatAnswer(question)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

async function run() {
  const pkg = COMPREHENSIVE_500_PACKAGE.default || COMPREHENSIVE_500_PACKAGE;
  const section4 = (pkg.sections || []).find(
    (s) => Number(s.sectionId) === 4
  );
  if (!section4 || !Array.isArray(section4.questions)) {
    throw new Error("Section 4 not found in comprehensive500Package");
  }

  const questions = [...section4.questions].sort(
    (a, b) => Number(a.questionId) - Number(b.questionId)
  );

  // Bucket questions into subsections; record any IDs that don't fit a
  // known range so the export remains transparent (no silent drops).
  const buckets = new Map(SUBSECTIONS.map((s) => [s.title, []]));
  const orphans = [];
  questions.forEach((q) => {
    const sub = subsectionFor(q.questionId);
    if (sub) {
      buckets.get(sub.title).push(q);
    } else {
      orphans.push(q);
    }
  });

  const lines = [];
  lines.push("# SECTION 4 — APTITUDE BATTERY");
  lines.push("# Answer Key");
  lines.push("");
  lines.push(
    `_Generated ${new Date().toISOString().slice(0, 10)} from \`comprehensive500Package.generated.js\` — ${questions.length} questions total._`
  );
  lines.push("");

  SUBSECTIONS.forEach((sub) => {
    const bucket = buckets.get(sub.title);
    if (!bucket.length) return;
    lines.push("---");
    lines.push("");
    lines.push(
      `## ${sub.title.toUpperCase()} (Q${sub.start}–Q${sub.end}) — ${bucket.length} questions`
    );
    lines.push("");
    bucket.forEach((q) => {
      lines.push(renderQuestionBlock(q));
      lines.push("");
    });
  });

  if (orphans.length) {
    lines.push("---");
    lines.push("");
    lines.push(`## UNCATEGORISED (${orphans.length} questions)`);
    lines.push("");
    lines.push(
      "_These question IDs fell outside the documented Section 4 subsection ranges. Check the source package or update SUBSECTIONS in this script._"
    );
    lines.push("");
    orphans.forEach((q) => {
      lines.push(renderQuestionBlock(q));
      lines.push("");
    });
  }

  // Summary footer — useful at a glance to confirm the document is
  // complete without scrolling through 160 entries.
  lines.push("---");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  SUBSECTIONS.forEach((sub) => {
    const bucket = buckets.get(sub.title);
    lines.push(`- **${sub.title}**: ${bucket.length} questions (Q${sub.start}–Q${sub.end})`);
  });
  lines.push(`- **Total**: ${questions.length} questions`);
  if (orphans.length) {
    lines.push(`- **Uncategorised**: ${orphans.length} questions`);
  }
  lines.push("");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");

  console.log(`[export:answer-key] wrote ${OUTPUT_PATH}`);
  console.log(`[export:answer-key] ${questions.length} questions across ${SUBSECTIONS.length} subsections`);
  SUBSECTIONS.forEach((sub) => {
    const bucket = buckets.get(sub.title);
    console.log(`  ${sub.title.padEnd(22)} ${bucket.length} questions`);
  });
  if (orphans.length) {
    console.log(`  (uncategorised)        ${orphans.length} questions`);
  }
}

run().catch((err) => {
  console.error("[export:answer-key] fatal:", err);
  process.exit(1);
});
