import { readFileSync } from "node:fs";

const SPEC_FILE_URL = new URL("../../../../test500.json", import.meta.url);
const NESTED_DIMENSION_EVALUATION_TYPES = new Set([
  "subscale_average",
  "factor_average",
  "average_per_interest_cluster",
  "average_or_preference_strength",
]);
const SUBSECTION_PREFIX_PATTERN = /^\d+(?:\.\d+)*\s*/;

const normalizeLabel = (value = "") =>
  String(value || "")
    .replace(SUBSECTION_PREFIX_PATTERN, "")
    .trim()
    .toLowerCase();

const safeReadSpec = () => {
  try {
    return JSON.parse(readFileSync(SPEC_FILE_URL, "utf8"));
  } catch {
    return null;
  }
};

const SPEC = safeReadSpec();
const SUBSECTION_ENTRIES = Array.isArray(SPEC?.sections)
  ? SPEC.sections.flatMap((section = {}) =>
      (Array.isArray(section.subsections) ? section.subsections : []).map((subsection = {}) => ({
        sectionId: String(section.sectionId || ""),
        sectionName: section.name || "",
        subsectionId: String(subsection.subsectionId || ""),
        name: subsection.name || "",
        evaluationType: subsection.evaluationType || "",
        requiredForPersonalityType:
          Boolean(subsection?.output?.requiredForPersonalityType) ||
          Boolean(subsection?.usedForPersonalityType),
        questionRange: Array.isArray(subsection.questionRange)
          ? subsection.questionRange
          : [],
      }))
    )
  : [];

const matchesQuestionRange = (questionNumbers = [], questionRange = []) => {
  const numericQuestions = questionNumbers.map(Number).filter(Number.isFinite);
  if (!numericQuestions.length || questionRange.length !== 2) return false;
  const minQuestion = Math.min(...numericQuestions);
  const maxQuestion = Math.max(...numericQuestions);
  return minQuestion === Number(questionRange[0]) && maxQuestion === Number(questionRange[1]);
};

// ---------------------------------------------------------------------------
// Manual-review eligibility for Section 4 (Aptitude Battery)
// ---------------------------------------------------------------------------
// Prompt-7 rewrite: manual review now triggers ONLY when the algorithm
// genuinely cannot grade an answer — i.e., the answer key is missing or
// the evaluation type isn't one the scorer understands. The presence or
// absence of an image is irrelevant; image rendering is a UI concern, not
// a grading concern. Previously this module flagged every Q341-Q410
// item by range, producing 36 false-positive review tasks per submission.

// Question-id ranges are still useful for one thing: deciding which
// aptitude subsection a Section-4 question belongs to. They are NOT used
// for review eligibility anymore.
const ABSTRACT_RANGE = { start: 341, end: 365 };
const SPATIAL_RANGE = { start: 366, end: 390 };
const MECHANICAL_RANGE = { start: 391, end: 410 };

const inRange = (id, { start, end }) =>
  Number.isFinite(id) && id >= start && id <= end;

export const getAptitudeSubsectionKeyForQuestionId = (questionId) => {
  const id = Number(questionId);
  if (inRange(id, ABSTRACT_RANGE)) return "abstract_reasoning";
  if (inRange(id, SPATIAL_RANGE)) return "spatial_relations";
  if (inRange(id, MECHANICAL_RANGE)) return "mechanical_reasoning";
  return null;
};

// Returns the same URL the student's Livetest renders, or null when the
// question has no associated image. Kept for the admin review UI, but no
// longer drives review eligibility.
export const getQuestionMediaUrl = (questionId) => {
  const id = Number(questionId);
  if (!Number.isFinite(id)) return null;

  if (inRange(id, SPATIAL_RANGE)) {
    const folderNumber = id - 290; // Q366 → 76, Q390 → 100
    return `/question-media/spatial/q${String(folderNumber).padStart(3, "0")}/stimulus.png?v=2`;
  }

  // Mechanical (Q391-410) stimulus is disabled: the on-disk diagrams belong to
  // an older, different question set and don't match the current booklet text,
  // so we serve no image rather than a mismatched one. See
  // frontend/src/data/mechanicalQuestionMedia.js for the full root cause.
  if (inRange(id, MECHANICAL_RANGE)) return null;

  // Abstract reasoning (Q341-365) is text-only in the current build.
  return null;
};

// Evaluation types the scorer can definitively grade without admin help.
// "objective" / "single" / "multiple_choice" all map to the answer-key
// comparison in computeObjectiveMetrics. Likert isn't relevant here
// (Section 4 is objective) but is listed so future callers using this
// helper on other sections behave correctly.
const SUPPORTED_EVALUATION_TYPES = new Set([
  "objective",
  "single",
  "multiple_choice",
  "likert",
]);

const isAmbiguousAnswer = (raw) => {
  const value = String(raw == null ? "" : raw).trim().toLowerCase();
  if (!value) return false;
  return value === "ambiguous" || value === "review" || value === "?";
};

// Decide whether a question requires admin manual review. The presence or
// absence of an image is irrelevant — only the answer key and evaluation
// type matter.
//
// Returns true ONLY when:
//   1. correctAnswer is null / undefined / empty string
//   2. correctAnswer is explicitly flagged ambiguous (e.g., "ambiguous")
//   3. evaluationType is unsupported by the auto-grader
export const isManualReviewRequired = (questionSpec) => {
  if (!questionSpec) return false;

  // Accept either { correctAnswer } from a spec object or { correctOption }
  // from a package-question object — the scorer hands us the package
  // shape in practice.
  const answer =
    questionSpec.correctAnswer !== undefined
      ? questionSpec.correctAnswer
      : questionSpec.correctOption;

  if (answer === null || answer === undefined || String(answer).trim() === "") {
    return true;
  }
  if (isAmbiguousAnswer(answer)) {
    return true;
  }

  // Some package questions don't carry an evaluationType (the field lives
  // on the spec). Default to the field on the question object first,
  // then fall back to "type" which the package config uses
  // ("likert" | "single").
  const evalType = String(
    questionSpec.evaluationType || questionSpec.type || ""
  )
    .trim()
    .toLowerCase();

  // Empty evalType is treated as supported (legacy reports) so we don't
  // flag every existing question. Only flag if the type is set AND not
  // in the supported list.
  if (evalType && !SUPPORTED_EVALUATION_TYPES.has(evalType)) {
    return true;
  }

  return false;
};

// Legacy export kept for callers that still ask for the range-based list.
// Returns an empty array now — manual review eligibility is decided
// per-question by isManualReviewRequired.
export const getManualReviewEligibleIds = () => [];

// Legacy boolean helper, also driven by the new rule. Accepts a question
// object so callers don't have to refactor; if only a question id is
// passed in, returns false (no spec available to inspect).
export const isManualReviewEligible = (questionOrId) => {
  if (questionOrId && typeof questionOrId === "object") {
    return isManualReviewRequired(questionOrId);
  }
  return false;
};

export const MANUAL_REVIEW_QUESTION_RANGES = Object.freeze({
  abstract: { ...ABSTRACT_RANGE, subsectionKey: "abstract_reasoning" },
  spatial: { ...SPATIAL_RANGE, subsectionKey: "spatial_relations" },
  mechanical: { ...MECHANICAL_RANGE, subsectionKey: "mechanical_reasoning" },
});

export const resolveCareer500QSubsectionSpec = (subsectionConfig = {}) => {
  const normalizedLabel = normalizeLabel(subsectionConfig.label);
  const byLabel = SUBSECTION_ENTRIES.find(
    (entry) => normalizeLabel(entry.name) === normalizedLabel
  );
  const matchedEntry =
    byLabel ||
    SUBSECTION_ENTRIES.find((entry) =>
      matchesQuestionRange(subsectionConfig.questionNumbers || [], entry.questionRange)
    );

  if (!matchedEntry) {
    return {
      subsectionId: "",
      evaluationType: "",
      displayMode: "",
      requiredForPersonalityType: false,
    };
  }

  return {
    subsectionId: matchedEntry.subsectionId,
    evaluationType: matchedEntry.evaluationType,
    displayMode: NESTED_DIMENSION_EVALUATION_TYPES.has(matchedEntry.evaluationType)
      ? "high_signal_dimensions"
      : "subsection_summary",
    requiredForPersonalityType: matchedEntry.requiredForPersonalityType,
  };
};

