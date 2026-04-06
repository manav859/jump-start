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

