// Demo curation for the 50-question Client Demo Test (id: demo-aptitude-50q).
//
// Each questionId listed below is a direct reference to a question in the
// canonical 500-question bank (backend/config/comprehensive500Package.generated.js,
// surfaced in AssessmentConfig.packages[id="complete-aptitude-500q"]).
//
// Preserving the original questionId is required: the career500q scoring engine
// indexes its factor/subscale lookups by question number, so a Q1 answered in
// the demo still flows into "extraversion" exactly as it would in the full test.

export const DEMO_PACKAGE_ID = "demo-aptitude-50q";
export const DEMO_PACKAGE_TITLE = "Client Demo Test (50 Questions)";
export const DEMO_ALGORITHM_KEY = "career-500q-demo-v1";

// 50 curated question numbers, grouped by demo-section.
// Distribution matches the spec: 10 + 10 + 9 + 14 + 7.
export const DEMO_SECTION_BLUEPRINT = [
  {
    sectionId: 1,
    title: "Personality Assessment",
    durationMinutes: 4,
    scoringType: "mixed",
    // 3 OCEAN (extraversion/openness/conscientiousness) +
    // 3 HSPQ (warmth/reasoning/dominance) +
    // 2 Work Style + 2 Leadership
    questionIds: [1, 4, 7, 31, 32, 34, 73, 85, 97, 98],
  },
  {
    sectionId: 2,
    title: "Multiple Intelligence & EQ",
    durationMinutes: 4,
    scoringType: "likert",
    // 8 MI (one per intelligence) + 2 EQ (self-awareness + empathy seed)
    questionIds: [121, 131, 141, 151, 161, 171, 181, 191, 451, 481],
  },
  {
    sectionId: 3,
    title: "Interest Assessment",
    durationMinutes: 3,
    scoringType: "likert",
    // RIASEC: 2R + 1I + 2A + 1S + 2E + 1C
    questionIds: [201, 202, 207, 213, 214, 219, 225, 226, 231],
  },
  {
    sectionId: 4,
    title: "Aptitude Battery",
    durationMinutes: 8,
    scoringType: "objective",
    // 3 Verbal + 3 Numerical + 2 Abstract + 2 Spatial + 2 Mechanical + 2 Clerical
    questionIds: [
      291, 292, 293,
      316, 317, 318,
      341, 342,
      366, 367,
      391, 392,
      411, 412,
    ],
  },
  {
    sectionId: 5,
    title: "Personality & Values",
    durationMinutes: 3,
    scoringType: "likert",
    // Spread across EQ competencies that map to values/self-direction signals
    questionIds: [452, 461, 462, 471, 472, 482, 491],
  },
];

// Flat list of all 50 ids for quick validation
export const DEMO_QUESTION_IDS = DEMO_SECTION_BLUEPRINT.flatMap(
  (section) => section.questionIds
);

// Aptitude bands designed for a 2-3 question demo subsection, expressed as
// percentages so the demo scorer can override the full-test raw-count bands
// (which assume 10-25 questions and would otherwise pin every demo result to
// "Developing"). Keys match aptitude subsection keys in career500q.config.js.
export const DEMO_APTITUDE_BANDS = [
  {
    label: "Excellent",
    min: 80,
    max: 100,
    interpretation: "Strong aptitude signal in this area on the demo sample.",
    careerImplication: "Pursue careers that leverage this strength.",
  },
  {
    label: "Good",
    min: 60,
    max: 79,
    interpretation: "Solid aptitude signal in this area on the demo sample.",
    careerImplication: "Good fit for roles that draw on this skill.",
  },
  {
    label: "Average",
    min: 40,
    max: 59,
    interpretation: "Mixed aptitude signal in this area on the demo sample.",
    careerImplication: "Usable across general professional roles.",
  },
  {
    label: "Developing",
    min: 0,
    max: 39,
    interpretation:
      "Limited signal in this area on the demo sample — a fuller test would clarify the pattern.",
    careerImplication: "Consider careers that lean on other measured strengths.",
  },
];

// Aptitude subsection keys (from career500q.config.js section 4) that should
// receive the demo band override.
export const DEMO_APTITUDE_SUBSECTION_KEYS = new Set([
  "verbal_reasoning",
  "numerical_ability",
  "abstract_reasoning",
  "spatial_relations",
  "mechanical_reasoning",
  "clerical_accuracy",
  "critical_thinking",
  "problem_solving",
]);

const cloneQuestion = (question, demoQuestionIndex) => {
  const cloned = JSON.parse(JSON.stringify(question || {}));
  // Preserve original questionId — the scoring engine keys factor lookups on it.
  cloned.questionId = String(question?.questionId || demoQuestionIndex + 1);
  return cloned;
};

const indexQuestionsById = (pkg) => {
  const map = new Map();
  (pkg?.sections || []).forEach((section) => {
    (section?.questions || []).forEach((question) => {
      const id = String(question?.questionId || "").trim();
      if (id) map.set(id, question);
    });
  });
  return map;
};

// Assemble the full demo package document from the canonical 500-question
// source. Throws if any curated questionId is missing so seed failures are
// loud rather than silent.
export const buildDemoPackageDoc = (sourcePackage) => {
  if (!sourcePackage || !Array.isArray(sourcePackage.sections)) {
    throw new Error(
      "buildDemoPackageDoc: source 500-question package is missing or malformed"
    );
  }

  const questionsById = indexQuestionsById(sourcePackage);
  const missing = [];

  const sections = DEMO_SECTION_BLUEPRINT.map((blueprint) => {
    const questions = blueprint.questionIds.map((id, demoIdx) => {
      const source = questionsById.get(String(id));
      if (!source) {
        missing.push(id);
        return null;
      }
      return cloneQuestion(source, demoIdx);
    }).filter(Boolean);

    return {
      sectionId: blueprint.sectionId,
      title: blueprint.title,
      durationMinutes: blueprint.durationMinutes,
      enabled: true,
      scoringType: blueprint.scoringType,
      sheetCsvUrl: "",
      questions,
    };
  });

  if (missing.length) {
    throw new Error(
      `buildDemoPackageDoc: ${missing.length} curated question ids not found ` +
      `in source package: ${missing.join(", ")}`
    );
  }

  return {
    id: DEMO_PACKAGE_ID,
    title: DEMO_PACKAGE_TITLE,
    badge: "Free Demo",
    amount: 0,
    strikeAmount: null,
    features: [
      "50 curated questions across all 5 assessment types",
      "Full career profile output (strengths, careers, personality)",
      "Same scoring engine as the 500-question test",
      "No payment required",
    ],
    durationText: "~20-minute client demo",
    active: true,
    sortOrder: 0,
    sections,
  };
};

export default {
  DEMO_PACKAGE_ID,
  DEMO_PACKAGE_TITLE,
  DEMO_ALGORITHM_KEY,
  DEMO_SECTION_BLUEPRINT,
  DEMO_QUESTION_IDS,
  DEMO_APTITUDE_BANDS,
  DEMO_APTITUDE_SUBSECTION_KEYS,
  buildDemoPackageDoc,
};
