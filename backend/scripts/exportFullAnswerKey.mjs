// Export one markdown answer-key / question-bank file per section of the
// complete 500-question test. Produces five files in backend/exports/:
//
//   section1-personality-assessment.md   (Q1–Q120,   Likert)
//   section2-multiple-intelligence-eq.md (Q121–Q200, Likert)
//   section3-interest-assessment.md      (Q201–Q290, Likert + preference)
//   section4-aptitude-battery.md         (Q291–Q450, correct answers)
//   section5-personality-values.md       (Q451–Q500, Likert)
//
// Sections 1/2/3/5 are scored by trait/preference averages — there are no
// right or wrong answers, so each file carries a note saying so and shows
// the response scale (or the choice options for single-select preference
// items). Section 4 is the only section with definitive correct answers,
// which are printed under each question.
//
// Usage:  npm run export:answer-keys

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";
import CAREER_500Q_CONFIG from "../utils/scoring/configs/career500q.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "exports");

// ---------------------------------------------------------------------------
// Scoring-mapping indexes derived from career500q.config.js (the scoring
// source of truth). These let the export annotate each question with the
// trait/factor it loads onto, whether it is REVERSE-SCORED, and — for the
// single-select preference blocks — the answer key's per-option direction.
// The package's own `reverseScored`/`subscale` fields are intentionally NOT
// used: they carry an older personality model and disagree with the config.
// ---------------------------------------------------------------------------
const buildTraitIndex = (config) => {
  const index = new Map(); // qnum -> { traits:Set, reverse:Set(trait reverse) }
  const touch = (qnum) => {
    const n = Number(qnum);
    if (!index.has(n)) index.set(n, { traits: new Set(), reverse: false });
    return index.get(n);
  };
  for (const section of config.sections || []) {
    for (const sub of section.subsections || []) {
      if (Array.isArray(sub.factors)) {
        for (const factor of sub.factors) {
          const reverseSet = new Set((factor.reverseQuestions || []).map(Number));
          for (const qn of factor.questionNumbers || []) {
            const entry = touch(qn);
            entry.traits.add(factor.label);
            if (reverseSet.has(Number(qn))) entry.reverse = true;
          }
        }
      } else if (Array.isArray(sub.subjectClusters)) {
        for (const cluster of sub.subjectClusters) {
          for (const qn of cluster.questionNumbers || []) {
            touch(qn).traits.add(cluster.label);
          }
        }
      } else if (sub.scoringMethod === "banded_likert_average") {
        for (const qn of sub.questionNumbers || []) {
          touch(qn).traits.add(sub.label.replace(/^\d+(\.\d+)?\s*/, ""));
        }
      }
    }
  }
  return index;
};

// qnum -> per-option {profile, direction} (Work Style Q73-80)
const buildWorkStyleOptionIndex = (config) => {
  const index = new Map();
  for (const section of config.sections || []) {
    for (const sub of section.subsections || []) {
      const map = sub.answerKeyOptionMap;
      if (map && !map.dimensionRows) {
        for (const [qn, spec] of Object.entries(map)) index.set(Number(qn), spec);
      }
    }
  }
  return index;
};

// subsection-key -> dimensionRows (Activity / Environment preference blocks)
const buildDimensionRowIndex = (config) => {
  const index = new Map();
  for (const section of config.sections || []) {
    for (const sub of section.subsections || []) {
      if (sub.answerKeyOptionMap?.dimensionRows) {
        index.set(sub.key, sub.answerKeyOptionMap.dimensionRows);
      }
    }
  }
  return index;
};

const TRAIT_INDEX = buildTraitIndex(CAREER_500Q_CONFIG.default || CAREER_500Q_CONFIG);
const WORK_STYLE_OPTION_INDEX = buildWorkStyleOptionIndex(
  CAREER_500Q_CONFIG.default || CAREER_500Q_CONFIG
);
const DIMENSION_ROW_INDEX = buildDimensionRowIndex(
  CAREER_500Q_CONFIG.default || CAREER_500Q_CONFIG
);

// One-line scoring annotation for a Likert / factor question.
const traitAnnotation = (questionId) => {
  const entry = TRAIT_INDEX.get(Number(questionId));
  if (!entry || !entry.traits.size) return "";
  const traits = [...entry.traits].join(", ");
  return `_Scores: ${traits} · Reverse-scored: ${entry.reverse ? "Yes" : "No"}_`;
};

// Per-option direction lines for a Work Style question (Q73-80).
const workStyleAnnotation = (questionId) => {
  const spec = WORK_STYLE_OPTION_INDEX.get(Number(questionId));
  if (!spec) return "";
  const rows = ["a", "b", "c"]
    .filter((k) => spec[k])
    .map((k) => `   - **${k.toUpperCase()}** → ${spec[k].direction} _(profile ${spec[k].profile})_`);
  return [`_Answer-key mapping — ${spec.dimension}:_`, ...rows].join("\n");
};

// Subsection ranges sourced from career500q.config.js. label + inclusive
// question-id range per subsection.
const SUBSECTIONS = {
  1: [
    ["Big Five Personality Traits (OCEAN)", 1, 30],
    ["HSPQ-Style Personality Factors", 31, 72],
    ["Work Style Preferences", 73, 96],
    ["Leadership and Social Interaction", 97, 120],
  ],
  2: [
    ["Logical-Mathematical Intelligence", 121, 130],
    ["Linguistic-Verbal Intelligence", 131, 140],
    ["Spatial-Visual Intelligence", 141, 150],
    ["Musical-Rhythmic Intelligence", 151, 160],
    ["Bodily-Kinesthetic Intelligence", 161, 170],
    ["Interpersonal Intelligence", 171, 180],
    ["Intrapersonal Intelligence", 181, 190],
    ["Naturalistic Intelligence", 191, 200],
  ],
  3: [
    ["Holland Code (RIASEC) Assessment", 201, 236],
    ["Subject Preferences", 237, 254],
    ["Activity Preferences", 255, 272],
    ["Work Environment Preferences", 273, 290],
  ],
  4: [
    ["Verbal Reasoning", 291, 315],
    ["Numerical Ability", 316, 340],
    ["Abstract Reasoning", 341, 365],
    ["Spatial Relations", 366, 390],
    ["Mechanical Reasoning", 391, 410],
    ["Clerical Speed & Accuracy", 411, 430],
    ["Critical Thinking", 431, 440],
    ["Problem Solving", 441, 450],
  ],
  5: [
    ["Self-Awareness", 451, 460],
    ["Self-Regulation", 461, 470],
    ["Motivation", 471, 480],
    ["Empathy", 481, 490],
    ["Social Skills", 491, 500],
  ],
};

// Per-section file + display metadata. `hasCorrectAnswers` is true only for
// Section 4. `interestScale` swaps the agreement scale for an interest one
// on Section 3's Likert items.
const SECTION_META = {
  1: { file: "section1-personality-assessment.md", title: "Personality Assessment", hasCorrectAnswers: false },
  2: { file: "section2-multiple-intelligence-eq.md", title: "Multiple Intelligence Assessment", hasCorrectAnswers: false },
  3: { file: "section3-interest-assessment.md", title: "Interest Assessment", hasCorrectAnswers: false, interestScale: true },
  4: { file: "section4-aptitude-battery.md", title: "Aptitude Battery", hasCorrectAnswers: true },
  5: { file: "section5-personality-values.md", title: "Emotional Intelligence Assessment", hasCorrectAnswers: false },
};

const AGREEMENT_SCALE = "Scale: 1 = Strongly Disagree → 5 = Strongly Agree";
const INTEREST_SCALE = "Scale: 1 = Not at all interested → 5 = Extremely interested";

const optionLetter = (i) => String.fromCharCode(65 + i);

// Render the answer / scale block under a question.
const renderResponseBlock = (question, meta) => {
  const opts = Array.isArray(question.options) ? question.options : [];

  // Section 4 — definitive correct answer.
  if (meta.hasCorrectAnswers) {
    const lines = opts.map((opt, i) => `   ${optionLetter(i)}. ${opt}`);
    const letter = String(question.correctOption || "").trim().toUpperCase();
    let answerLine;
    if (letter) {
      const idx = letter.charCodeAt(0) - 65;
      const text = opts[idx];
      answerLine = text
        ? `Correct Answer: **${letter}** — ${text}`
        : `Correct Answer: **${letter}**`;
    } else {
      answerLine = "Correct Answer: _(no key — manual review required)_";
    }
    return [...lines, "", answerLine].filter(Boolean).join("\n");
  }

  // Non-Section-4 single-select preference items (e.g. Work Style,
  // Activity Preferences) — list the options, no "correct" answer.
  if (opts.length) {
    return opts.map((opt, i) => `   ${optionLetter(i)}. ${opt}`).join("\n");
  }

  // Likert items — show the response scale.
  return meta.interestScale ? INTEREST_SCALE : AGREEMENT_SCALE;
};

const buildSectionFile = (section, meta, subsections) => {
  const questions = [...(section.questions || [])].sort(
    (a, b) => Number(a.questionId) - Number(b.questionId)
  );
  const total = questions.length;
  const idOf = (q) => Number(q.questionId);
  const firstId = total ? idOf(questions[0]) : "?";
  const lastId = total ? idOf(questions[total - 1]) : "?";

  const lines = [];
  lines.push("# JUMPSTART CAREER APTITUDE TEST");
  lines.push(`# Section ${section.sectionId} — ${meta.title}`);
  lines.push("# Answer Key / Question Bank");
  lines.push("");
  lines.push(`_Generated ${new Date().toISOString().slice(0, 10)} — ${total} questions (Q${firstId}–Q${lastId})_`);
  lines.push("");
  if (!meta.hasCorrectAnswers) {
    lines.push(
      "_This section is scored by averages. There are no correct or incorrect answers._"
    );
    lines.push("");
  }

  const covered = [];
  subsections.forEach(([label, start, end]) => {
    const bucket = questions.filter((q) => idOf(q) >= start && idOf(q) <= end);
    if (!bucket.length) return;
    covered.push({ label, start, end, count: bucket.length });

    lines.push("---");
    lines.push("");
    lines.push(`## ${label} (Q${start}–Q${end}) — ${bucket.length} questions`);
    lines.push("");

    // Subsection-level answer-key option mapping for the Activity /
    // Environment preference blocks (the PDF documents these as recurring
    // dimension rows rather than per-question keys).
    const dimKey = label.includes("Activity")
      ? "activity_preferences"
      : label.includes("Environment")
        ? "work_environment_preferences"
        : null;
    if (dimKey && DIMENSION_ROW_INDEX.has(dimKey)) {
      lines.push("_Answer-key option mapping (per recurring dimension):_");
      lines.push("");
      lines.push("| Dimension | Option A | Option B | Option C |");
      lines.push("| --- | --- | --- | --- |");
      DIMENSION_ROW_INDEX.get(dimKey).forEach((row) => {
        lines.push(`| ${row.dimension} | ${row.a} | ${row.b} | ${row.c} |`);
      });
      lines.push("");
    }

    bucket.forEach((q) => {
      const text = String(q.text || "").trim() || "_(question text missing)_";
      lines.push(`**Q${q.questionId}.** ${text}`);
      lines.push("");
      lines.push(renderResponseBlock(q, meta));
      const traitNote = traitAnnotation(q.questionId);
      const wsNote = workStyleAnnotation(q.questionId);
      if (traitNote) {
        lines.push("");
        lines.push(traitNote);
      }
      if (wsNote) {
        lines.push("");
        lines.push(wsNote);
      }
      lines.push("");
    });
  });

  // Anything outside the documented subsection ranges (should never happen
  // for a well-formed bank, but surfaced rather than dropped silently).
  const coveredIds = new Set();
  subsections.forEach(([, start, end]) => {
    questions.forEach((q) => {
      const id = idOf(q);
      if (id >= start && id <= end) coveredIds.add(id);
    });
  });
  const orphans = questions.filter((q) => !coveredIds.has(idOf(q)));
  if (orphans.length) {
    lines.push("---");
    lines.push("");
    lines.push(`## Uncategorised (${orphans.length} questions)`);
    lines.push("");
    orphans.forEach((q) => {
      lines.push(`**Q${q.questionId}.** ${String(q.text || "").trim()}`);
      lines.push("");
      lines.push(renderResponseBlock(q, meta));
      lines.push("");
    });
  }

  // Summary footer.
  lines.push("---");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  covered.forEach((s) => {
    lines.push(`- **${s.label}**: ${s.count} questions (Q${s.start}–Q${s.end})`);
  });
  lines.push(`- **Total**: ${total} questions across ${covered.length} subsections`);
  if (orphans.length) {
    lines.push(`- **Uncategorised**: ${orphans.length} questions`);
  }
  lines.push("");

  return { body: lines.join("\n"), total, subsectionCount: covered.length };
};

function run() {
  const pkg = COMPREHENSIVE_500_PACKAGE.default || COMPREHENSIVE_500_PACKAGE;
  const sections = pkg.sections || [];

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let grandTotal = 0;
  sections.forEach((section) => {
    const meta = SECTION_META[section.sectionId];
    const subsections = SUBSECTIONS[section.sectionId];
    if (!meta || !subsections) {
      console.warn(`[export:answer-keys] no metadata for section ${section.sectionId} — skipped`);
      return;
    }
    const { body, total, subsectionCount } = buildSectionFile(section, meta, subsections);
    const outPath = path.join(OUTPUT_DIR, meta.file);
    fs.writeFileSync(outPath, body, "utf8");
    grandTotal += total;
    console.log(
      `[export:answer-keys] ${meta.file.padEnd(40)} ${total} questions, ${subsectionCount} subsections`
    );
  });

  console.log(`[export:answer-keys] done — ${grandTotal} questions across ${sections.length} files`);
}

run();
