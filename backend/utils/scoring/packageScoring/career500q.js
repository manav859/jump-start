import {
  PERSONALITY_ARCHETYPES,
  buildReviewSummary,
  buildStrengths,
} from "../../resultProfiling.js";
import CAREER_500Q_CONFIG from "../configs/career500q.config.js";
import {
  getBandCareerImplication,
  getBandInterpretation,
  getBandLabel,
  resolveInterpretationBand,
} from "../interpreters/bandInterpreter.js";
import { buildSubsectionInterpretation } from "../interpreters/subsectionInterpretationRegistry.js";
import {
  resolveCareer500QSubsectionSpec,
  getQuestionMediaUrl,
  getAptitudeSubsectionKeyForQuestionId,
  isManualReviewRequired,
} from "../specs/career500qEvaluationSpec.js";
import { matchCareers } from "../careerMatcher.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const average = (values = []) =>
  values.length
    ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
    : 0;

const roundTo = (value, digits = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(digits));
};

const roundPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric);
};

const formatBandBoundary = (value, style = "score") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";

  if (style === "average") {
    if (Number.isInteger(numeric)) return numeric.toFixed(1);
    const fixedTwo = numeric.toFixed(2);
    return fixedTwo.endsWith("0") ? numeric.toFixed(1) : fixedTwo;
  }

  return Number.isInteger(numeric) ? `${numeric}` : `${roundTo(numeric, 2)}`;
};

const buildBandRangeLabel = (band, style = "score") => {
  if (!band || band.min == null || band.max == null) return "";
  return `${formatBandBoundary(band.min, style)}-${formatBandBoundary(band.max, style)}`;
};

const buildDefaultDisplayMode = (result = {}) =>
  Array.isArray(result.factorResults) && result.factorResults.length
    ? "high_signal_dimensions"
    : Array.isArray(result.clusterResults) && result.clusterResults.length
      ? "high_signal_dimensions"
      : "subsection_summary";

const finalizeSubsectionResult = (subsectionConfig, result = {}) => {
  const specMeta = resolveCareer500QSubsectionSpec(subsectionConfig);
  const baseResult = {
    subsectionId: specMeta.subsectionId || "",
    evaluationType: specMeta.evaluationType || subsectionConfig.scoringMethod || "",
    displayMode: specMeta.displayMode || buildDefaultDisplayMode(result),
    usedForPersonalityType: Boolean(specMeta.requiredForPersonalityType),
    ...result,
  };
  const interpretationPayload = buildSubsectionInterpretation(subsectionConfig, baseResult);

  return {
    ...baseResult,
    interpretation: interpretationPayload.summary || baseResult.interpretation || "",
    description: interpretationPayload.summary || baseResult.description || "",
    interpretationItems: Array.isArray(interpretationPayload.items)
      ? interpretationPayload.items
      : [],
  };
};

const likertToPercent = (avgValue) =>
  clamp(Math.round(((Number(avgValue || 0) - 1) / 4) * 100), 0, 100);

const getAnswerKey = (sectionId, questionIndex) => `${sectionId}-${questionIndex}`;

const normalizeAnswerLetter = (rawAnswer) =>
  String(rawAnswer || "").trim().toUpperCase();

const buildQuestionContextMap = (sections = [], answers = {}) => {
  const byQuestionNumber = new Map();

  sections.forEach((section) => {
    const questions = Array.isArray(section?.questions) ? section.questions : [];
    questions.forEach((question, questionIndex) => {
      const questionNumber = Number(
        question?.questionId || question?.question_id || questionIndex + 1
      );
      if (!Number.isFinite(questionNumber)) return;

      byQuestionNumber.set(questionNumber, {
        questionNumber,
        sectionId: Number(section.sectionId),
        sectionTitle: section.title || "",
        questionIndex,
        question,
        rawAnswer: answers[getAnswerKey(section.sectionId, questionIndex)],
      });
    });
  });

  return byQuestionNumber;
};

const getLikertValue = (rawAnswer, reverse = false) => {
  const numeric = Number(rawAnswer);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) return null;
  return reverse ? 6 - numeric : numeric;
};

const summarizeStatus = (answeredCount, totalQuestions, fallback = "completed") => {
  if (!totalQuestions) return fallback;
  return answeredCount >= totalQuestions ? "completed" : "incomplete";
};

// Prompt-5 fix: percentage-based objective aptitude bands applied
// uniformly to both demo and full 500Q scoring. Previous behavior used
// raw-count bands from the config ("23-25 correct = Excellent") which
// only worked for the canonical 25-question full-test set — any
// partial set degraded to Developing.
const OBJECTIVE_PERCENTAGE_BANDS = [
  { label: "Excellent", min: 80, max: 100 },
  { label: "Good", min: 60, max: 79 },
  { label: "Average", min: 40, max: 59 },
  { label: "Developing", min: 0, max: 39 },
];

const resolveAptitudeBandByPercentage = (percentage, configBands = []) => {
  const numeric = Number(percentage);
  if (!Number.isFinite(numeric)) return null;
  const baseBand = OBJECTIVE_PERCENTAGE_BANDS.find(
    (band) => numeric >= band.min && numeric <= band.max
  );
  if (!baseBand) return null;
  // Pull the rich interpretation + careerImplication text from the
  // config band whose label matches (each subsection has its own
  // language — "Strong verbal reasoning", "Excellent abstract pattern
  // recognition", etc.). Fall back to a generic line if not present.
  const enriched = (configBands || []).find(
    (band) => band.label === baseBand.label
  );
  return {
    label: baseBand.label,
    min: baseBand.min,
    max: baseBand.max,
    interpretation:
      enriched?.interpretation ||
      `${baseBand.label} band for this aptitude block.`,
    careerImplication: enriched?.careerImplication || "",
  };
};

// Prompt-5 fix: weighted overall-score formula. Section 4 (Aptitude
// Battery) is the heaviest weight because it's objective. Sections with
// no signal (null percentage) drop out and the remaining weights are
// renormalised — a partial completion is not penalised by being missing.
const SECTION_WEIGHTS = {
  1: 0.2, // Personality Assessment
  2: 0.2, // Multiple Intelligence Assessment
  3: 0.15, // Interest Assessment
  4: 0.3, // Aptitude Battery
  5: 0.15, // Emotional Intelligence Assessment
};

const computeWeightedOverallScore = (sectionBreakdown = []) => {
  const present = (Array.isArray(sectionBreakdown) ? sectionBreakdown : [])
    .filter((section) => Number.isFinite(Number(section?.percentage)));
  if (!present.length) return 0;

  let weightedSum = 0;
  let totalWeight = 0;
  for (const section of present) {
    const weight = SECTION_WEIGHTS[Number(section.sectionId)] ?? 0;
    if (weight === 0) continue;
    weightedSum += Number(section.percentage) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return roundPercent(average(present.map((s) => Number(s.percentage))));
  }
  return Math.round(weightedSum / totalWeight);
};

const uniqueQuestionCount = (questionNumbers = []) =>
  new Set(questionNumbers.map((value) => Number(value)).filter(Number.isFinite)).size;

const buildQuestionRangeLabel = (questionNumbers = []) => {
  const unique = [...new Set(questionNumbers.map(Number).filter(Number.isFinite))].sort(
    (a, b) => a - b
  );
  if (!unique.length) return "";
  if (unique.length === 1) return String(unique[0]);

  const groups = [];
  let start = unique[0];
  let previous = unique[0];

  for (let index = 1; index < unique.length; index += 1) {
    const current = unique[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    groups.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  groups.push(start === previous ? `${start}` : `${start}-${previous}`);
  return groups.join(", ");
};

const computeLikertMetrics = (questionNumbers = [], questionMap, reverseQuestions = []) => {
  const reverseSet = new Set(reverseQuestions.map(Number));
  const values = [];
  let answeredCount = 0;
  // Prompt-5 fix: the denominator must reflect the questions actually
  // ASSIGNED to the active package (e.g., 3 OCEAN questions in the demo)
  // — not the full 500-question bank's spec range (30 for OCEAN). Without
  // this, completion math falsely reported "3/30 incomplete" for fully
  // answered demo subsections.
  const assignedQuestionNumbers = [];

  questionNumbers.forEach((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    if (!entry) return;
    assignedQuestionNumbers.push(Number(questionNumber));
    const numeric = getLikertValue(entry.rawAnswer, reverseSet.has(Number(questionNumber)));
    if (numeric == null) return;
    values.push(numeric);
    answeredCount += 1;
  });

  const totalQuestions = assignedQuestionNumbers.length;
  const rawScore = values.length
    ? roundTo(values.reduce((sum, value) => sum + value, 0), 2)
    : null;
  const maxScore = totalQuestions * 5;
  // Average is sum(answered) / answeredCount — unanswered items are
  // excluded from both numerator and denominator (scale-invariant, valid
  // even at N=1 in the demo).
  const averageScore = values.length ? roundTo(average(values), 2) : null;
  const percentage = averageScore == null ? null : likertToPercent(averageScore);

  return {
    rawScore,
    maxScore,
    average: averageScore,
    percentage,
    answeredCount,
    totalQuestions,
    assignedQuestionNumbers,
    status: summarizeStatus(answeredCount, totalQuestions),
  };
};

const computeObjectiveMetrics = (questionNumbers = [], questionMap) => {
  let correctCount = 0;
  let scorableCount = 0;
  let answeredCount = 0;
  // Prompt-5 fix: same denominator correction as computeLikertMetrics —
  // count questions assigned to the active package, not the full bank.
  // Unanswered items are skipped from both correctCount and scorableCount,
  // never counted as incorrect.
  const assignedQuestionNumbers = [];

  questionNumbers.forEach((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    if (!entry) return;
    assignedQuestionNumbers.push(Number(questionNumber));
    const rawAnswer = normalizeAnswerLetter(entry.rawAnswer);
    const correctOption = normalizeAnswerLetter(entry.question?.correctOption);
    if (rawAnswer) answeredCount += 1;
    // Prompt-7: questions whose answer key is missing/ambiguous (i.e.,
    // isManualReviewRequired === true) are excluded from BOTH the
    // numerator and the scorable denominator. They neither help nor
    // hurt the subsection score until the admin makes a decision via
    // the manual-review flow. `correctOption` being empty is the
    // primary signal; isManualReviewRequired is the canonical name.
    if (!correctOption || isManualReviewRequired(entry.question)) return;
    scorableCount += 1;
    if (rawAnswer && rawAnswer === correctOption) correctCount += 1;
  });

  const totalQuestions = assignedQuestionNumbers.length;
  const percentage =
    scorableCount > 0 ? roundPercent((correctCount / scorableCount) * 100) : null;

  // Prompt-7: when totalQuestions is 0 (subsection not assigned in the
  // active package) status is "completed" — there's nothing to grade.
  // When questions are assigned but answer keys are missing, those
  // questions flow into manualReviewItems instead of dragging the
  // subsection into "review_required". The subsection status now
  // reflects answering progress only.
  return {
    rawScore: scorableCount > 0 ? correctCount : null,
    maxScore: scorableCount > 0 ? scorableCount : totalQuestions,
    average: null,
    percentage,
    answeredCount,
    totalQuestions,
    assignedQuestionNumbers,
    scorableCount,
    status: summarizeStatus(answeredCount, totalQuestions),
  };
};

const buildScoreSnapshot = ({
  scoreType,
  rawScore,
  maxScore,
  averageScore,
  percentage,
}) => {
  if (scoreType === "average") {
    return {
      score: averageScore,
      maxScore: 5,
      average: averageScore,
      percentage,
    };
  }

  return {
    score: rawScore,
    maxScore,
    average: averageScore,
    percentage,
  };
};

const buildAverageBandLabel = (label = "", band = "", key = "") => {
  const normalizedLabel = String(label || "").trim();
  const normalizedBand = String(band || "").trim();
  if (!normalizedLabel || !normalizedBand) return "";
  if (key === "neuroticism") {
    if (normalizedBand === "Low") return "Low Neuroticism";
    if (normalizedBand === "Moderate") return "Moderate Neuroticism";
    if (normalizedBand === "High") return "High Neuroticism";
  }
  return `${normalizedBand} ${normalizedLabel}`;
};

const buildDefaultLikertBands = (factor = {}) => [
  {
    label: "High",
    min: 4,
    max: 5,
    interpretation: buildAverageBandLabel(factor.label, "High", factor.key),
    careerImplication: factor.careerImplication || "",
  },
  {
    label: "Moderate",
    min: 3,
    max: 3.99,
    interpretation: buildAverageBandLabel(factor.label, "Moderate", factor.key),
    careerImplication: "",
  },
  {
    label: "Low",
    min: 1,
    max: 2.99,
    interpretation:
      factor.key === "neuroticism"
        ? "Low Neuroticism"
        : buildAverageBandLabel(factor.label, "Low", factor.key),
    careerImplication:
      factor.key === "neuroticism" ? factor.lowBandCareerImplication || "" : "",
  },
];

const buildSubjectPreferenceBands = (cluster = {}) => [
  {
    label: "High",
    min: 4,
    max: 5,
    interpretation: `High preference for ${cluster.label || "this subject group"}.`,
    careerImplication: "",
  },
  {
    label: "Moderate",
    min: 3,
    max: 3.99,
    interpretation: `Moderate preference for ${cluster.label || "this subject group"}.`,
    careerImplication: "",
  },
  {
    label: "Low",
    min: 1,
    max: 2.99,
    interpretation: `Low preference for ${cluster.label || "this subject group"}.`,
    careerImplication: "",
  },
];

const buildFactorNarrative = (factor = {}, band = null) => {
  const label = getBandLabel(band);
  const bandInterpretation = getBandInterpretation(band);
  if (bandInterpretation && bandInterpretation !== buildAverageBandLabel(factor.label, label, factor.key)) {
    return bandInterpretation;
  }

  if (factor.key === "neuroticism" && label === "Low") {
    return factor.lowBandText || "Calm, stable, resilient.";
  }

  if (label === "High") {
    return factor.highText || `Strong ${String(factor.label || "").toLowerCase()} signal.`;
  }

  if (label === "Moderate") {
    return `Balanced responses on ${String(factor.label || "this factor").toLowerCase()}.`;
  }

  if (label === "Low") {
    return `Lower ${String(factor.label || "factor").toLowerCase()} signal on the assessed items.`;
  }

  return "Factor interpretation unavailable.";
};

const joinList = (items = []) => {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
};

const ACTIVITY_OPTION_RULES = [
  { profile: "science", patterns: [/science|chemistry|laboratory|research|data|mathematics|museum|medical/i] },
  { profile: "business", patterns: [/business|campaign|market|government|event|client|management|finance|lead/i] },
  { profile: "artistic", patterns: [/art|design|creative|theater|musical|gallery|animation|visual/i] },
  { profile: "social", patterns: [/charity|hospital|clinic|tutoring|advice|coaching|younger students|help/i] },
  { profile: "technical", patterns: [/technology|prototype|invention|engineering|build|sports competition/i] },
];

const ENVIRONMENT_OPTION_RULES = [
  { profile: "research", patterns: [/laboratory|research|quiet|independently|specialized|rural|natural/i] },
  { profile: "collaborative", patterns: [/collaborative|clients|customers|team|suburban|balance|remote work/i] },
  { profile: "dynamic", patterns: [/fast-paced|leadership|entrepreneur|traveling|project|major city/i] },
  { profile: "creative", patterns: [/creative|innovative|materials|tools|flexible/i] },
];

const classifyByRules = (text = "", rules = []) => {
  const normalized = String(text || "").trim();
  if (!normalized) return "";
  const rule = rules.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(normalized))
  );
  return rule?.profile || "";
};

const scoreCategoricalProfile = (subsectionConfig, questionMap, rules = []) => {
  const profileDictionary =
    subsectionConfig.profileOptions || subsectionConfig.dominantProfiles || {};
  const hasDirectAnswerMapping = Object.keys(profileDictionary).some((key) =>
    /^[A-Z]$/.test(String(key || "").trim())
  );
  // Prompt-5 fix: only check explicit-option presence against questions
  // ACTUALLY in the current package. Without this the demo (which assigns
  // 0 questions to subject/activity/environment subsections) was being
  // evaluated against the full bank's missing metadata and returning
  // "incomplete" for not-applicable subsections.
  const assignedQuestionNumbers = subsectionConfig.questionNumbers.filter(
    (questionNumber) => questionMap.has(Number(questionNumber))
  );
  const rules_has = rules.length;
  const requiresExplicitOptions = !rules_has && !hasDirectAnswerMapping;
  const missingOptionMetadata = assignedQuestionNumbers.some((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    return !Array.isArray(entry?.question?.options) || entry.question.options.length < 3;
  });

  if (requiresExplicitOptions && missingOptionMetadata) {
    const totalQuestions = assignedQuestionNumbers.length;
    const answeredCount = assignedQuestionNumbers.reduce((count, questionNumber) => {
      const entry = questionMap.get(Number(questionNumber));
      return count + (entry?.rawAnswer != null && `${entry.rawAnswer}` !== "" ? 1 : 0);
    }, 0);

    return {
      key: subsectionConfig.key,
      label: subsectionConfig.label,
      answerType: subsectionConfig.answerType,
      scoreType: subsectionConfig.scoreType,
      score: null,
      rawScore: null,
      maxScore: totalQuestions,
      average: null,
      percentage: null,
      band: "Review Required",
      interpretation:
        "The stored package does not include the A/B/C option set required by the PDF scoring guide for this subsection, so interpretation is flagged for review instead of inferred.",
      careerImplication: "",
      questionNumbers: assignedQuestionNumbers,
      questionRangeLabel: buildQuestionRangeLabel(assignedQuestionNumbers),
      // Prompt-5 fix: 0 assigned questions => "completed" (nothing to
      // grade), not "incomplete" (which would block the section).
      status: totalQuestions === 0
        ? "completed"
        : answeredCount
          ? "review_required"
          : "incomplete",
      answeredCount,
      totalQuestions,
      description:
        "The stored package does not include the A/B/C option set required by the PDF scoring guide for this subsection, so interpretation is flagged for review instead of inferred.",
    };
  }

  const profileCounts = Object.fromEntries(
    Object.keys(profileDictionary).map((key) => [key, 0])
  );
  let answeredCount = 0;

  subsectionConfig.questionNumbers.forEach((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    if (!entry) return;
    const answer = normalizeAnswerLetter(entry.rawAnswer);
    if (!answer) return;
    answeredCount += 1;
    const optionIndex = answer.charCodeAt(0) - 65;
    const optionText = Array.isArray(entry.question?.options)
      ? entry.question.options[optionIndex] || ""
      : "";
    const profileKey = rules.length
      ? classifyByRules(optionText, rules)
      : answer;
    if (profileKey && profileCounts[profileKey] != null) {
      profileCounts[profileKey] += 1;
    }
  });

  const rankedProfiles = Object.entries(profileCounts)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0);
  const [dominantKey, dominantCount] = rankedProfiles[0] || ["", 0];
  const dominantProfile = profileDictionary?.[dominantKey] || null;
  const profileBreakdown = rankedProfiles.map(([profileKey, count]) => ({
    key: profileKey,
    label: profileDictionary?.[profileKey]?.label || profileKey,
    count,
    percentage: answeredCount ? roundPercent((count / answeredCount) * 100) : null,
    interpretation: profileDictionary?.[profileKey]?.interpretation || "",
    careerImplication: profileDictionary?.[profileKey]?.careerImplication || "",
    highlights: Array.isArray(profileDictionary?.[profileKey]?.highlights)
      ? profileDictionary[profileKey].highlights
      : [],
  }));
  const consistency = answeredCount
    ? roundPercent((dominantCount / answeredCount) * 100)
    : null;

  // Prompt-5 fix: totalQuestions = assignedQuestionNumbers.length, not the
  // full-bank count. status falls through to "completed" when nothing
  // was assigned (subsection not in active package).
  const totalQuestions = assignedQuestionNumbers.length;

  // Prompt-8 fix: when the answered values look like Likert (numeric 1-5)
  // rather than option letters (A/B/C), the categorical path produces
  // nothing (profileCounts never increments because "4" isn't a known
  // profile key). This is the current Work Style state: questions are
  // stored as `type: "likert"` with empty options even though the spec
  // declares them as A/B/C single-choice — a known gap recorded in the
  // package ambiguityNotes. Fall back to a Likert-derived consistency
  // signal so the result is non-empty and meaningful instead of "0%".
  const hasLikertAnswers = assignedQuestionNumbers.some((qn) => {
    const entry = questionMap.get(Number(qn));
    return getLikertValue(entry?.rawAnswer) != null;
  });
  if (dominantCount === 0 && answeredCount > 0 && hasLikertAnswers) {
    const likertMetrics = computeLikertMetrics(
      assignedQuestionNumbers,
      questionMap
    );
    const likertAvg = likertMetrics.average;
    const extremeCount = assignedQuestionNumbers.reduce((count, qn) => {
      const value = getLikertValue(questionMap.get(Number(qn))?.rawAnswer);
      if (value == null) return count;
      // "Decisive" = answer leans clearly in one direction (>=4 or <=2),
      // not parked at neutral 3.
      return count + (value >= 4 || value <= 2 ? 1 : 0);
    }, 0);
    const consistencyFromLikert =
      likertMetrics.answeredCount > 0
        ? roundPercent((extremeCount / likertMetrics.answeredCount) * 100)
        : 0;

    // Map the Likert average to one of the three configured profile
    // options when possible. Mapping is positional (low avg → first
    // option, mid → second, high → third) — it can't be more precise
    // than that without the A/B/C metadata the source PDF supplies.
    const profileKeys = Object.keys(profileDictionary);
    let positionalProfile = null;
    if (profileKeys.length === 3 && likertAvg != null) {
      const idx = likertAvg <= 2.5 ? 0 : likertAvg >= 3.5 ? 2 : 1;
      positionalProfile = profileDictionary[profileKeys[idx]];
    }

    const fallbackBand = (() => {
      if (likertAvg == null) return "Balanced";
      if (likertAvg >= 4) return "Decisive";
      if (likertAvg <= 2) return "Cautious";
      return "Balanced";
    })();

    const interpretation = positionalProfile?.interpretation
      ? `${positionalProfile.interpretation} (Derived from Likert preference signal; A/B/C option metadata pending in package seed.)`
      : "Work-style preferences show a balanced pattern across the answered Likert questions.";

    return {
      key: subsectionConfig.key,
      label: subsectionConfig.label,
      answerType: subsectionConfig.answerType,
      scoreType: subsectionConfig.scoreType,
      score: likertAvg,
      rawScore: likertMetrics.rawScore,
      maxScore: 5,
      average: likertAvg,
      percentage: consistencyFromLikert,
      band: positionalProfile?.label || fallbackBand,
      interpretation,
      careerImplication: positionalProfile?.careerImplication || "",
      questionNumbers: assignedQuestionNumbers,
      questionRangeLabel: buildQuestionRangeLabel(assignedQuestionNumbers),
      status: summarizeStatus(likertMetrics.answeredCount, totalQuestions),
      answeredCount: likertMetrics.answeredCount,
      totalQuestions,
      description: interpretation,
      dominantProfileKey: positionalProfile
        ? profileKeys[likertAvg <= 2.5 ? 0 : likertAvg >= 3.5 ? 2 : 1]
        : "",
      profileBreakdown,
    };
  }

  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: dominantCount || null,
    rawScore: dominantCount || null,
    maxScore: answeredCount || totalQuestions,
    average: null,
    percentage: consistency,
    band: dominantProfile?.label || "",
    interpretation:
      dominantProfile?.interpretation ||
      "No dominant preference pattern could be resolved from the answered options.",
    careerImplication: dominantProfile?.careerImplication || "",
    questionNumbers: assignedQuestionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(assignedQuestionNumbers),
    status: summarizeStatus(answeredCount, totalQuestions),
    answeredCount,
    totalQuestions,
    description:
      dominantProfile?.interpretation ||
      "No dominant preference pattern could be resolved from the answered options.",
    dominantProfileKey: dominantKey || "",
    profileBreakdown,
  };
};

const scoreBandedLikertAverage = (subsectionConfig, questionMap) => {
  const metrics = computeLikertMetrics(subsectionConfig.questionNumbers, questionMap);
  const band = resolveInterpretationBand(metrics.average, subsectionConfig.bands || []);
  const scoreSnapshot = buildScoreSnapshot({
    scoreType: subsectionConfig.scoreType,
    rawScore: metrics.rawScore,
    maxScore: metrics.maxScore,
    averageScore: metrics.average,
    percentage: metrics.percentage,
  });

  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: scoreSnapshot.score,
    rawScore: metrics.rawScore,
    maxScore: scoreSnapshot.maxScore,
    average: metrics.average,
    percentage: metrics.percentage,
    band: getBandLabel(band),
    bandMin: band?.min == null ? null : Number(band.min),
    bandMax: band?.max == null ? null : Number(band.max),
    bandRangeLabel: buildBandRangeLabel(band, "average"),
    interpretation:
      getBandInterpretation(band) || "Interpretation unavailable for this subsection.",
    careerImplication: getBandCareerImplication(band),
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: metrics.status,
    answeredCount: metrics.answeredCount,
    totalQuestions: metrics.totalQuestions,
    description:
      getBandInterpretation(band) || "Interpretation unavailable for this subsection.",
  };
};

const formatFactorHighlight = (factorResult) => {
  if (!factorResult?.average) return "";
  return `${factorResult.label} ${factorResult.average}/5`;
};

const scoreFactorProfile = (subsectionConfig, questionMap) => {
  const factorResults = (subsectionConfig.factors || []).map((factor) => {
    const metrics = computeLikertMetrics(
      factor.questionNumbers,
      questionMap,
      factor.reverseQuestions || []
    );
    const bandDefinitions =
      Array.isArray(factor.bands) && factor.bands.length
        ? factor.bands
        : buildDefaultLikertBands(factor);
    const band = resolveInterpretationBand(metrics.average, bandDefinitions);
    const primaryInterpretation =
      buildAverageBandLabel(factor.label, getBandLabel(band), factor.key) ||
      getBandInterpretation(band) ||
      factor.highText ||
      "Factor interpretation unavailable.";
    const narrative = buildFactorNarrative(factor, band);
    return {
      id: `${subsectionConfig.key}.${factor.key}`,
      ...factor,
      answerType: subsectionConfig.answerType,
      scoreType: "average",
      score: metrics.average,
      rawScore: metrics.rawScore,
      maxScore: 5,
      average: metrics.average,
      percentage: metrics.percentage,
      band: getBandLabel(band),
      bandMin: band?.min == null ? null : Number(band.min),
      bandMax: band?.max == null ? null : Number(band.max),
      bandRangeLabel: buildBandRangeLabel(band, "average"),
      interpretation: primaryInterpretation,
      careerImplication:
        getBandCareerImplication(band) || factor.careerImplication || "",
      questionRangeLabel: buildQuestionRangeLabel(factor.questionNumbers || []),
      status: metrics.status,
      answeredCount: metrics.answeredCount,
      totalQuestions: metrics.totalQuestions,
      description: narrative,
    };
  });

  const answeredCount = factorResults.reduce(
    (sum, item) => sum + Number(item.answeredCount || 0),
    0
  );
  const totalQuestions = factorResults.reduce(
    (sum, item) => sum + Number(item.totalQuestions || 0),
    0
  );
  const averageScore = factorResults.length
    ? roundTo(average(factorResults.map((item) => item.average).filter(Boolean)), 2)
    : null;
  const percentage = averageScore == null ? null : likertToPercent(averageScore);
  const rankedFactors = [...factorResults]
    .filter((item) => item.average != null)
    .sort((a, b) => Number(b.average || 0) - Number(a.average || 0));
  const topFactors = rankedFactors.slice(0, 2);

  let interpretation = subsectionConfig.interpretationPrompt || "";
  let careerImplication = "";

  if (subsectionConfig.key === "big_five_ocean") {
    const neuroticism = factorResults.find((item) => item.key === "neuroticism");
    const leadingTraits = topFactors.map((item) => item.label);
    interpretation = leadingTraits.length
      ? `Dominant Big Five signals: ${joinList(
          topFactors.map(formatFactorHighlight)
        )}.`
      : "Big Five trait data was not sufficient to summarize.";
    careerImplication = topFactors
      .map((item) => item.careerImplication)
      .filter(Boolean)
      .join(" | ");
    if (neuroticism?.average != null && neuroticism.average <= 2) {
      interpretation += ` ${neuroticism.lowBandText}.`;
      careerImplication = [careerImplication, neuroticism.lowBandCareerImplication]
        .filter(Boolean)
        .join(" | ");
    }
  } else {
    const matchedCombination = (subsectionConfig.combinationRules || []).find((rule) => {
      const requiredOk = (rule.requiredFactors || []).every((key) => {
        const factor = factorResults.find((item) => item.key === key);
        return factor?.average != null && factor.average >= Number(rule.minAverage || 0);
      });
      const maxOk = (rule.maxFactors || []).every((key) => {
        const factor = factorResults.find((item) => item.key === key);
        return factor?.average != null && factor.average <= Number(rule.maxAverage || 5);
      });
      return requiredOk && maxOk;
    });

    interpretation = matchedCombination?.interpretation
      ? matchedCombination.interpretation
      : topFactors.length
        ? `Leading signals: ${joinList(topFactors.map(formatFactorHighlight))}.`
        : "Factor profile data was not sufficient to summarize.";
    careerImplication = matchedCombination?.careerImplication
      ? matchedCombination.careerImplication
      : topFactors
          .map((item) => item.careerImplication)
          .filter(Boolean)
          .join(" | ");
  }

  if (subsectionConfig.key === "holland_riasec") {
    const code = rankedFactors
      .slice(0, 3)
      .map((item) => item.label.charAt(0).toUpperCase())
      .join("");
    const matchedCode = (subsectionConfig.hollandCombinations || []).find(
      (item) => item.code === code
    );
    interpretation = matchedCode?.interpretation
      ? `${matchedCode.interpretation} Top themes: ${joinList(
          topFactors.map(formatFactorHighlight)
        )}.`
      : `Top Holland themes: ${joinList(topFactors.map(formatFactorHighlight))}.`;
    careerImplication = matchedCode?.careerImplication || careerImplication;
  }

  const scoreSnapshot = buildScoreSnapshot({
    scoreType: subsectionConfig.scoreType,
    rawScore: null,
    maxScore: totalQuestions * 5,
    averageScore,
    percentage,
  });

  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: scoreSnapshot.score,
    rawScore: roundTo(averageScore == null ? 0 : averageScore * factorResults.length, 2),
    maxScore: scoreSnapshot.maxScore,
    average: averageScore,
    percentage,
    band: topFactors[0]?.band || "",
    interpretation,
    careerImplication,
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: summarizeStatus(answeredCount, totalQuestions),
    answeredCount,
    totalQuestions,
    description: interpretation,
    factorResults,
  };
};

const SUBJECT_COMBINATION_MATCHERS = [
  {
    keys: ["Mathematics and Statistics", "Physics and Chemistry", "Engineering and Applied Sciences"],
    interpretation: "Top subject preferences lean toward traditional engineering foundations.",
    careerImplication: "Traditional Engineering",
  },
  {
    keys: ["Biology and Life Sciences", "Medicine and Health Sciences"],
    interpretation: "Science preferences lean toward medical and life-science pathways.",
    careerImplication: "Healthcare / Medical track",
  },
  {
    keys: ["Computer Science and Technology", "Mathematics and Statistics"],
    interpretation: "Subject preferences lean toward technology-oriented analytical work.",
    careerImplication: "Technology track",
  },
  {
    keys: ["Literature and Language Arts", "History and Social Studies"],
    interpretation: "Subject preferences align with humanities and liberal-arts pathways.",
    careerImplication: "Liberal Arts track",
  },
  {
    keys: ["Philosophy and Ethics", "Law and Legal Studies"],
    interpretation: "Subject preferences align with policy, law, and ethics-focused study.",
    careerImplication: "Legal / Policy track",
  },
  {
    keys: ["Art and Creative Expression", "Communication and Media"],
    interpretation: "Creative expression combined with communication points toward media and design.",
    careerImplication: "Media / Design track",
  },
];

const scoreSubjectClusterProfile = (subsectionConfig, questionMap) => {
  const clusterResults = (subsectionConfig.subjectClusters || []).map((cluster) => {
    const metrics = computeLikertMetrics(cluster.questionNumbers, questionMap);
    const bandDefinitions = buildSubjectPreferenceBands(cluster);
    const band = resolveInterpretationBand(metrics.average, bandDefinitions);
    return {
      id: `${subsectionConfig.key}.${cluster.key}`,
      key: cluster.key,
      label: cluster.label,
      answerType: subsectionConfig.answerType,
      scoreType: "average",
      score: metrics.average,
      rawScore: metrics.rawScore,
      maxScore: 5,
      average: metrics.average,
      percentage: metrics.percentage,
      band: getBandLabel(band),
      bandMin: band?.min == null ? null : Number(band.min),
      bandMax: band?.max == null ? null : Number(band.max),
      bandRangeLabel: buildBandRangeLabel(band, "average"),
      status: summarizeStatus(metrics.answeredCount, metrics.totalQuestions),
      description: getBandInterpretation(band),
      interpretation: getBandInterpretation(band),
      careerImplication: "",
      questionNumbers: cluster.questionNumbers,
      questionRangeLabel: buildQuestionRangeLabel(cluster.questionNumbers || []),
      answeredCount: metrics.answeredCount,
      totalQuestions: metrics.totalQuestions,
    };
  });

  const questionScores = subsectionConfig.questionNumbers
    .map((questionNumber) => {
      const entry = questionMap.get(Number(questionNumber));
      if (!entry) return null;
      const value = getLikertValue(entry.rawAnswer);
      if (value == null) return null;
      return {
        questionNumber,
        label: entry.question?.text || `Question ${questionNumber}`,
        average: value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.average || 0) - Number(a.average || 0));

  const topSubjects = questionScores.slice(0, 3);
  const combinationMatch = SUBJECT_COMBINATION_MATCHERS.find((matcher) =>
    matcher.keys.every((key) =>
      topSubjects.some((item) => String(item.label || "").trim() === key)
    )
  );

  const averageScore = clusterResults.length
    ? roundTo(average(clusterResults.map((item) => item.average).filter(Boolean)), 2)
    : null;
  const interpretation = combinationMatch?.interpretation
    ? `${combinationMatch.interpretation} Top subjects: ${joinList(
        topSubjects.map((item) => item.label)
      )}.`
    : topSubjects.length
      ? `Top subject pull: ${joinList(topSubjects.map((item) => item.label))}.`
      : "Subject preference signals were not strong enough to summarize.";
  const careerImplication =
    combinationMatch?.careerImplication ||
    (topSubjects[0]?.label ? `Leading subject preference: ${topSubjects[0].label}` : "");

  // Prompt-5 fix: assignedCount + dynamic totalQuestions, matching the
  // helper-function fixes above. Not having any questions in the active
  // package falls through to status="completed" (nothing to grade)
  // rather than blocking the section as "incomplete".
  const assignedQuestionNumbersSubject = subsectionConfig.questionNumbers.filter(
    (questionNumber) => questionMap.has(Number(questionNumber))
  );
  const totalQuestionsSubject = assignedQuestionNumbersSubject.length;
  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: averageScore,
    rawScore: questionScores.length
      ? roundTo(questionScores.reduce((sum, item) => sum + item.average, 0), 2)
      : null,
    maxScore: 5,
    average: averageScore,
    percentage: averageScore == null ? null : likertToPercent(averageScore),
    band: "",
    bandMin: null,
    bandMax: null,
    bandRangeLabel: "",
    interpretation,
    careerImplication,
    questionNumbers: assignedQuestionNumbersSubject,
    questionRangeLabel: buildQuestionRangeLabel(assignedQuestionNumbersSubject),
    status: summarizeStatus(questionScores.length, totalQuestionsSubject),
    answeredCount: questionScores.length,
    totalQuestions: totalQuestionsSubject,
    description: interpretation,
    clusterResults,
    topSubjects,
    combinationMatch: combinationMatch || null,
  };
};

const scoreObjectiveSubsection = (subsectionConfig, questionMap) => {
  if (subsectionConfig.scoringMethod === "manual_review_only") {
    const totalQuestions = uniqueQuestionCount(subsectionConfig.questionNumbers);
    const answeredCount = subsectionConfig.questionNumbers.reduce((count, questionNumber) => {
      const entry = questionMap.get(Number(questionNumber));
      return count + (normalizeAnswerLetter(entry?.rawAnswer) ? 1 : 0);
    }, 0);

    return {
      key: subsectionConfig.key,
      label: subsectionConfig.label,
      answerType: subsectionConfig.answerType,
      scoreType: subsectionConfig.scoreType,
      score: null,
      rawScore: null,
      maxScore: totalQuestions,
      average: null,
      percentage: null,
      band: "Review Required",
      interpretation: subsectionConfig.reviewNote,
      careerImplication: "",
      questionNumbers: subsectionConfig.questionNumbers,
      questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
      status: answeredCount ? "review_required" : "incomplete",
      description: subsectionConfig.reviewNote,
      answeredCount,
      totalQuestions,
    };
  }

  const metrics = computeObjectiveMetrics(subsectionConfig.questionNumbers, questionMap);
  // Prompt-5 fix: pick the band from the percentage (0-100), not the
  // raw-correct count. Previously a perfect demo set (2/2) would map to
  // the "Developing 0-16" band because the config bands are tuned for
  // the 25-question full-test version. resolveAptitudeBandByPercentage
  // returns a label by percentage AND enriches it with the
  // per-subsection interpretation text from the config.
  const band = resolveAptitudeBandByPercentage(
    metrics.percentage,
    subsectionConfig.bands || []
  );
  const assignedQuestionNumbers =
    metrics.assignedQuestionNumbers && metrics.assignedQuestionNumbers.length
      ? metrics.assignedQuestionNumbers
      : subsectionConfig.questionNumbers;

  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: metrics.rawScore,
    rawScore: metrics.rawScore,
    maxScore: metrics.maxScore,
    average: null,
    percentage: metrics.percentage,
    band: band?.label || "",
    bandMin: band?.min == null ? null : Number(band.min),
    bandMax: band?.max == null ? null : Number(band.max),
    bandRangeLabel: band ? `${band.min}-${band.max}%` : "",
    interpretation:
      band?.interpretation ||
      "Interpretation unavailable for this aptitude block.",
    careerImplication: band?.careerImplication || "",
    questionNumbers: assignedQuestionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(assignedQuestionNumbers),
    status: metrics.status,
    description:
      band?.interpretation ||
      "Interpretation unavailable for this aptitude block.",
    answeredCount: metrics.answeredCount,
    totalQuestions: metrics.totalQuestions,
  };
};

const scoreSubsection = (subsectionConfig, questionMap) => {
  let result;
  switch (subsectionConfig.scoringMethod) {
    case "banded_likert_average":
      result = scoreBandedLikertAverage(subsectionConfig, questionMap);
      break;
    case "factor_profile":
      result = scoreFactorProfile(subsectionConfig, questionMap);
      break;
    case "work_style_profile":
      result = scoreCategoricalProfile(subsectionConfig, questionMap);
      break;
    case "subject_cluster_profile":
      result = scoreSubjectClusterProfile(subsectionConfig, questionMap);
      break;
    case "interest_activity_profile":
      result = scoreCategoricalProfile(
        subsectionConfig,
        questionMap,
        ACTIVITY_OPTION_RULES
      );
      break;
    case "environment_profile":
      result = scoreCategoricalProfile(
        subsectionConfig,
        questionMap,
        ENVIRONMENT_OPTION_RULES
      );
      break;
    case "objective_correct":
    case "manual_review_only":
      result = scoreObjectiveSubsection(subsectionConfig, questionMap);
      break;
    default:
      result = {
        key: subsectionConfig.key,
        label: subsectionConfig.label,
        answerType: subsectionConfig.answerType,
        scoreType: subsectionConfig.scoreType,
        score: null,
        rawScore: null,
        maxScore: null,
        average: null,
        percentage: null,
        band: "",
        interpretation: "Scoring method not implemented for this subsection.",
        careerImplication: "",
        questionNumbers: subsectionConfig.questionNumbers || [],
        questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers || []),
        status: "incomplete",
        description: "Scoring method not implemented for this subsection.",
      };
      break;
  }

  return finalizeSubsectionResult(subsectionConfig, result);
};

const buildSectionInterpretation = (sectionResult) => {
  const completedSubsections = (sectionResult.subsections || []).filter(
    (item) => item.status !== "incomplete"
  );
  const topFindings = completedSubsections
    .flatMap((item) =>
      (Array.isArray(item.interpretationItems) ? item.interpretationItems : [])
        .slice(0, 1)
        .map((entry) => entry.title)
    )
    .filter(Boolean)
    .slice(0, 3);

  if (!topFindings.length) {
    return {
      interpretation: "Section-level interpretation is not available yet.",
      careerImplication: "",
    };
  }

  return {
    interpretation: `Key findings: ${joinList(topFindings)}.`,
    careerImplication: joinList(
      completedSubsections.map((item) => item.careerImplication).filter(Boolean).slice(0, 3)
    ),
  };
};

const buildSectionResult = (sectionConfig, questionMap) => {
  const subsectionResults = (sectionConfig.subsections || [])
    .map((subsection) => scoreSubsection(subsection, questionMap))
    .sort((a, b) => {
      const subA = sectionConfig.subsections.find((item) => item.key === a.key);
      const subB = sectionConfig.subsections.find((item) => item.key === b.key);
      return Number(subA?.displayOrder || 0) - Number(subB?.displayOrder || 0);
    });

  const percentageValues = subsectionResults
    .map((item) => item.percentage)
    .filter((value) => Number.isFinite(value));
  const answeredCount = subsectionResults.reduce(
    (sum, item) => sum + Number(item.answeredCount || 0),
    0
  );
  const questionNumbers = [
    ...new Set(
      subsectionResults.flatMap((item) =>
        Array.isArray(item.questionNumbers) ? item.questionNumbers : []
      )
    ),
  ];
  // Prompt-5 fix: section totalQuestions sums the per-subsection assigned
  // counts (which are now accurate to the active package). Previously
  // this used uniqueQuestionCount(questionNumbers) — i.e., the full
  // bank's union of spec ranges — and produced "0/120" style nonsense
  // for any partial package.
  const totalQuestions = subsectionResults.reduce(
    (sum, item) => sum + Number(item.totalQuestions || 0),
    0
  );
  const percentage = percentageValues.length
    ? roundPercent(average(percentageValues))
    : null;
  const status = subsectionResults.some((item) => item.status === "incomplete")
    ? "incomplete"
    : subsectionResults.some((item) => item.status === "review_required")
      ? "review_required"
      : "completed";
  const sectionText = buildSectionInterpretation({
    ...sectionConfig,
    subsections: subsectionResults,
  });

  return {
    sectionId: sectionConfig.sectionId,
    key: sectionConfig.key,
    title: sectionConfig.label,
    score: percentage,
    maxScore: 100,
    average: null,
    percentage,
    answeredCount,
    totalQuestions,
    status,
    interpretation: sectionText.interpretation,
    careerImplication: sectionText.careerImplication,
    scoringType: "package_specific",
    answerType: "mixed",
    scoreType: "percentage",
    questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(questionNumbers),
    subsections: subsectionResults,
  };
};

const buildPersonalityType = ({ bigFiveSection, emotionalSection }) => {
  const factorMap = Object.fromEntries(
    (bigFiveSection?.factorResults || []).map((item) => [item.key, item])
  );
  const eqMap = Object.fromEntries(
    (emotionalSection?.subsections || []).map((item) => [item.key, item])
  );

  const extraversion = likertToPercent(factorMap.extraversion?.average || 3);
  const openness = likertToPercent(factorMap.openness?.average || 3);
  const agreeableness = likertToPercent(factorMap.agreeableness?.average || 3);
  const conscientiousness = likertToPercent(
    factorMap.conscientiousness?.average || 3
  );
  const neuroticismAverage = factorMap.neuroticism?.average || 3;
  const emotionalStability = likertToPercent(6 - neuroticismAverage);

  const feeling = clamp(
    Math.round(
      agreeableness * 0.55 +
        Number(eqMap.empathy?.percentage || 50) * 0.3 +
        Number(eqMap.social_skills?.percentage || 50) * 0.15
    ),
    0,
    100
  );
  const judging = clamp(
    Math.round(
      conscientiousness * 0.75 + Number(eqMap.self_regulation?.percentage || 50) * 0.25
    ),
    0,
    100
  );
  const assertive = clamp(
    Math.round(
      emotionalStability * 0.6 +
        Number(eqMap.self_regulation?.percentage || 50) * 0.25 +
        Number(eqMap.motivation?.percentage || 50) * 0.15
    ),
    0,
    100
  );

  const baseCode = `${extraversion >= 50 ? "E" : "I"}${openness >= 50 ? "N" : "S"}${
    feeling >= 50 ? "F" : "T"
  }${judging >= 50 ? "J" : "P"}`;
  const archetype = PERSONALITY_ARCHETYPES[baseCode] || {
    title: "Career Explorer",
    description: "Balanced across structure, curiosity, and interpersonal awareness.",
  };

  return {
    code: `${baseCode}-${assertive >= 50 ? "A" : "T"}`,
    title: archetype.title,
    description: archetype.description,
    traits: [
      {
        name: extraversion >= 50 ? "Extraversion" : "Introversion",
        value: extraversion >= 50 ? extraversion : 100 - extraversion,
      },
      {
        name: openness >= 50 ? "Intuition" : "Sensing",
        value: openness >= 50 ? openness : 100 - openness,
      },
      {
        name: feeling >= 50 ? "Feeling" : "Thinking",
        value: feeling >= 50 ? feeling : 100 - feeling,
      },
      {
        name: judging >= 50 ? "Judging" : "Perceiving",
        value: judging >= 50 ? judging : 100 - judging,
      },
    ],
    metrics: {
      extraversion,
      openness,
      agreeableness,
      conscientiousness,
      emotionalStability,
      feeling,
      judging,
      assertive,
    },
  };
};

const getSectionByKey = (sectionBreakdown = [], key) =>
  sectionBreakdown.find((item) => item.key === key) || null;

const buildFlattenedSignals = ({ sectionBreakdown = [], personalityType }) => {
  const lookupSubsection = (sectionKey, subsectionKey) =>
    getSectionByKey(sectionBreakdown, sectionKey)?.subsections?.find(
      (item) => item.key === subsectionKey
    ) || null;

  const lookupFactor = (sectionKey, subsectionKey, factorKey) =>
    lookupSubsection(sectionKey, subsectionKey)?.factorResults?.find(
      (item) => item.key === factorKey
    ) || null;

  const personalityMetrics = personalityType?.metrics || {};

  return {
    realistic: lookupFactor("interest", "holland_riasec", "realistic")?.percentage ?? 50,
    investigative:
      lookupFactor("interest", "holland_riasec", "investigative")?.percentage ?? 50,
    artistic: lookupFactor("interest", "holland_riasec", "artistic")?.percentage ?? 50,
    social: lookupFactor("interest", "holland_riasec", "social")?.percentage ?? 50,
    enterprising:
      lookupFactor("interest", "holland_riasec", "enterprising")?.percentage ?? 50,
    conventional:
      lookupFactor("interest", "holland_riasec", "conventional")?.percentage ?? 50,
    logicalMathematical:
      lookupSubsection("multiple_intelligence", "logical_mathematical")?.percentage ?? 50,
    linguistic:
      lookupSubsection("multiple_intelligence", "linguistic_verbal")?.percentage ?? 50,
    visualSpatial:
      lookupSubsection("multiple_intelligence", "spatial_visual")?.percentage ?? 50,
    musical:
      lookupSubsection("multiple_intelligence", "musical_rhythmic")?.percentage ?? 50,
    bodilyKinesthetic:
      lookupSubsection("multiple_intelligence", "bodily_kinesthetic")?.percentage ?? 50,
    interpersonal:
      lookupSubsection("multiple_intelligence", "interpersonal")?.percentage ?? 50,
    intrapersonal:
      lookupSubsection("multiple_intelligence", "intrapersonal")?.percentage ?? 50,
    naturalistic:
      lookupSubsection("multiple_intelligence", "naturalistic")?.percentage ?? 50,
    selfAwareness:
      lookupSubsection("emotional_intelligence", "self_awareness")?.percentage ?? 50,
    selfRegulation:
      lookupSubsection("emotional_intelligence", "self_regulation")?.percentage ?? 50,
    motivation:
      lookupSubsection("emotional_intelligence", "motivation")?.percentage ?? 50,
    empathy: lookupSubsection("emotional_intelligence", "empathy")?.percentage ?? 50,
    socialSkills:
      lookupSubsection("emotional_intelligence", "social_skills")?.percentage ?? 50,
    verbalReasoning: lookupSubsection("aptitude", "verbal_reasoning")?.percentage ?? 50,
    quantitativeReasoning:
      lookupSubsection("aptitude", "numerical_ability")?.percentage ?? 50,
    logicalReasoning: roundPercent(
      average(
        [
          lookupSubsection("aptitude", "abstract_reasoning")?.percentage,
          lookupSubsection("aptitude", "critical_thinking")?.percentage,
          lookupSubsection("aptitude", "problem_solving")?.percentage,
        ].filter((value) => Number.isFinite(value))
      ) || 50
    ),
    mechanicalReasoning:
      lookupSubsection("aptitude", "mechanical_reasoning")?.percentage ?? 50,
    extraversion: personalityMetrics.extraversion ?? 50,
    introversion: 100 - Number(personalityMetrics.extraversion ?? 50),
    intuition: personalityMetrics.openness ?? 50,
    sensing: 100 - Number(personalityMetrics.openness ?? 50),
    feeling: personalityMetrics.feeling ?? 50,
    thinking: 100 - Number(personalityMetrics.feeling ?? 50),
    judging: personalityMetrics.judging ?? 50,
    perceiving: 100 - Number(personalityMetrics.judging ?? 50),
    assertive: personalityMetrics.assertive ?? 50,
    turbulent: 100 - Number(personalityMetrics.assertive ?? 50),
    openness: personalityMetrics.openness ?? 50,
  };
};

const buildSpecialObservations = ({ sectionBreakdown = [], personalityType, flattenedSignals }) => {
  const observations = [];
  const topStream = [...CAREER_500Q_CONFIG.streamIndicators]
    .map((stream) => ({
      ...stream,
      value: average(
        stream.requiredSignals
          .map((key) => flattenedSignals[key])
          .filter((value) => Number.isFinite(value))
      ),
    }))
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))[0];

  if (topStream?.label) {
    observations.push(
      `Primary stream indicator: ${topStream.label}. ${topStream.interpretation}`
    );
  }

  const bigFive = getSectionByKey(sectionBreakdown, "personality")?.subsections?.find(
    (item) => item.key === "big_five_ocean"
  );
  if (bigFive?.interpretation) {
    observations.push(bigFive.interpretation);
  }

  if (personalityType?.code) {
    observations.push(
      `Estimated personality profile: ${personalityType.code} (${personalityType.title}).`
    );
  }

  if (flattenedSignals.motivation < 40) {
    observations.push(
      CAREER_500Q_CONFIG.redFlags.find((item) => item.key === "low_motivation")?.message
    );
  }

  if (
    flattenedSignals.selfRegulation < 45 &&
    Number(personalityType?.metrics?.emotionalStability ?? 50) < 45
  ) {
    observations.push(
      CAREER_500Q_CONFIG.redFlags.find(
        (item) => item.key === "high_neuroticism_low_regulation"
      )?.message
    );
  }

  const signalValues = [
    flattenedSignals.logicalMathematical,
    flattenedSignals.linguistic,
    flattenedSignals.visualSpatial,
    flattenedSignals.interpersonal,
    flattenedSignals.investigative,
    flattenedSignals.social,
    flattenedSignals.artistic,
  ].filter((value) => Number.isFinite(value));
  const variance =
    signalValues.length > 1
      ? Math.max(...signalValues) - Math.min(...signalValues)
      : 0;
  if (variance < 12) {
    observations.push(
      CAREER_500Q_CONFIG.redFlags.find((item) => item.key === "flat_profile")?.message
    );
  }

  return observations.filter(Boolean);
};

// Prompt-8: career-facing per-trait OCEAN interpretation strings. The
// generic "High Openness" label isn't useful in a result report. These
// strings explain what the trait score means in terms of work and
// career fit, keyed by trait + band.
const OCEAN_INTERPRETATIONS = {
  openness: {
    High: "Strong curiosity and appetite for new ideas. Suits research, design, innovation, and roles that reward exploration.",
    Moderate: "Open to new ideas while staying grounded in proven approaches. Fits most professional roles.",
    Low: "Prefers familiar methods and concrete tasks. Suits structured, well-defined work where reliability matters more than reinvention.",
  },
  conscientiousness: {
    High: "Reliable, organised, and detail-oriented. Strong fit for medicine, accounting, engineering, law, and any role with high accountability.",
    Moderate: "Balanced between structure and flexibility. Adapts well to most professional contexts.",
    Low: "More flexible and spontaneous than methodical. Better suited to creative, adaptive, or fast-changing roles than to precision-heavy work.",
  },
  extraversion: {
    High: "Energised by people and outward engagement. Suits sales, teaching, management, public-facing roles, and group leadership.",
    Moderate: "Comfortable in both group and solo contexts. Adapts to varied work environments.",
    Low: "Recharges through quieter, focused work. Suits research, writing, programming, and independent technical roles.",
  },
  agreeableness: {
    High: "Cooperative, empathetic, and oriented toward harmony. Suits counselling, healthcare, social work, teaching, and people-development roles.",
    Moderate: "Balances cooperation with independent judgement. Fits most professional roles.",
    Low: "More direct and task-focused than relationship-focused. Suits competitive, analytical, or decisive roles like law, finance, and operations.",
  },
  neuroticism: {
    // For neuroticism, the bands carry opposite career meaning — Low is
    // the desirable signal (emotional stability) and High flags stress
    // sensitivity. The interpretation text reflects this asymmetry.
    Low: "Calm and emotionally stable under pressure. Suits high-stress careers like surgery, emergency response, leadership, and crisis management.",
    Moderate: "Generally stable with normal emotional response to pressure. Suits most professional roles.",
    High: "Emotionally reactive and stress-sensitive. Benefits from supportive environments and stress-management strategies before pursuing high-pressure paths.",
  },
};

const HSPQ_HIGH_DESCRIPTORS = {
  warmth: "Warm",
  reasoning: "Reasoning-Strong",
  emotional_stability: "Emotionally Stable",
  dominance: "Dominant",
  liveliness: "Lively",
  rule_consciousness: "Rule-Conscious",
  social_boldness: "Socially Bold",
  sensitivity: "Sensitive",
};

const buildOceanProfileSnapshot = (bigFiveSection) => {
  const factorResults = bigFiveSection?.factorResults || [];
  // Prompt-8: when a trait has no answered questions in the active
  // package (e.g., the 50-question demo only probes 3 OCEAN traits),
  // emit a clear "Not Measured" band + explanatory interpretation
  // instead of leaving the band empty. Lets the frontend render an
  // honest "not assessed in this test" state.
  const toEntry = (factor, key) => {
    if (!factor) {
      return {
        score: null,
        band: "Not Measured",
        interpretation: `${key.charAt(0).toUpperCase() + key.slice(1)} was not assessed by this test package.`,
        average: null,
      };
    }
    const factorKey = factor.key;
    const band = factor.band || "";
    const score = factor.percentage ?? null;
    if (!band || score == null) {
      return {
        score: null,
        band: "Not Measured",
        interpretation: `${(factor.label || factorKey).trim()} was not assessed by this test package.`,
        average: factor.average ?? null,
      };
    }
    const interpretation =
      OCEAN_INTERPRETATIONS?.[factorKey]?.[band] ||
      factor.description ||
      `${band} ${factor.label || ""}`.trim();
    return { score, band, interpretation, average: factor.average ?? null };
  };

  const factorByKey = Object.fromEntries(
    factorResults.map((f) => [f.key, f])
  );

  const oceanProfile = {
    openness: toEntry(factorByKey.openness, "openness"),
    conscientiousness: toEntry(factorByKey.conscientiousness, "conscientiousness"),
    extraversion: toEntry(factorByKey.extraversion, "extraversion"),
    agreeableness: toEntry(factorByKey.agreeableness, "agreeableness"),
    neuroticism: toEntry(factorByKey.neuroticism, "neuroticism"),
  };

  // Dominant traits = top 2 non-neuroticism scorers among the traits
  // that were actually measured. Neuroticism is in the profile but
  // excluded from "strengths" because high N isn't a strength. Traits
  // that weren't measured (score === null) are skipped from the
  // ranking — only what we measured counts.
  const ranked = ["openness", "conscientiousness", "extraversion", "agreeableness"]
    .filter((key) => Number.isFinite(Number(oceanProfile[key].score)))
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      score: Number(oceanProfile[key].score),
    }))
    .sort((a, b) => b.score - a.score);
  const dominantTraits = ranked.slice(0, 2).map((t) => t.label);

  return { ...oceanProfile, dominantTraits };
};

const buildHspqSignature = (hspqSubsection) => {
  const factorResults = hspqSubsection?.factorResults || [];
  const ranked = factorResults
    .filter((f) => Number.isFinite(Number(f.percentage)))
    .sort((a, b) => Number(b.percentage) - Number(a.percentage));
  const topThree = ranked.slice(0, 3);
  return topThree.map((f) => {
    const band = String(f.band || "").trim();
    const descriptor =
      HSPQ_HIGH_DESCRIPTORS[f.key] || (f.label || f.key || "").trim();
    return band ? `${band} ${descriptor}` : descriptor;
  });
};

const buildWorkStyleSnapshot = (workStyleSubsection) => {
  if (!workStyleSubsection) {
    return {
      dominantStyle: "Not Measured",
      description: "Work-style preferences were not assessed by this test package.",
      consistency: 0,
    };
  }
  // Prompt-9 Fix 4: when the active package doesn't include any work-style
  // questions (e.g., the post-fix demo no longer probes Q73-Q96), surface
  // a clear "Not Measured" state instead of an ambiguous 0% / Balanced
  // result. Mirrors the OCEAN "Not Measured" pattern.
  const totalAssigned = Number(workStyleSubsection.totalQuestions ?? 0);
  const answeredCount = Number(workStyleSubsection.answeredCount ?? 0);
  if (totalAssigned === 0 || answeredCount === 0) {
    return {
      dominantStyle: "Not Measured",
      description: "Work-style preferences were not assessed by this test package.",
      consistency: 0,
    };
  }
  return {
    dominantStyle: workStyleSubsection.band || "Balanced",
    description:
      workStyleSubsection.interpretation ||
      workStyleSubsection.description ||
      "Balanced work-style preferences across answered questions.",
    consistency: Number(workStyleSubsection.percentage ?? 0),
  };
};

const buildRichPersonalityProfile = (sectionBreakdown, personalityType) => {
  const personality = sectionBreakdown.find((s) => s.key === "personality");
  if (!personality) return null;
  const bigFive = (personality.subsections || []).find(
    (s) => s.key === "big_five_ocean"
  );
  const hspq = (personality.subsections || []).find(
    (s) => s.key === "hspq_factors"
  );
  const workStyle = (personality.subsections || []).find(
    (s) => s.key === "work_style_preferences"
  );

  const code = String(personalityType?.code || "");
  const suffixMatch = code.match(/^([EI][NS][FT][JP])-([AT])$/);
  const mbtiType = suffixMatch ? suffixMatch[1] : code.replace(/-[AT]$/, "");
  const assertivenessLetter = suffixMatch ? suffixMatch[2] : "";
  const assertiveness =
    assertivenessLetter === "A"
      ? "Assertive"
      : assertivenessLetter === "T"
        ? "Turbulent"
        : "";

  return {
    mbtiType,
    assertiveness,
    personalityType: code,
    archetypeName: personalityType?.title || "",
    archetypeDescription: personalityType?.description || "",
    oceanProfile: buildOceanProfileSnapshot(bigFive),
    hspqSignature: buildHspqSignature(hspq),
    workStyle: buildWorkStyleSnapshot(workStyle),
  };
};

// Prompt-7 rewrite: build manualReviewItems ONLY for Section 4 objective
// questions that the algorithm cannot grade — i.e., the answer key is
// missing/ambiguous or the evaluation type isn't supported.
// Questions with a valid answer key are graded automatically by the
// existing objective scoring loop (computeObjectiveMetrics) and never
// appear here. Image-based questions with a valid answer key are NOT
// flagged — image rendering is a UI concern, not a grading concern.
const buildManualReviewItems = ({ sections = [], questionMap }) => {
  const items = [];

  sections.forEach((section) => {
    if (Number(section?.sectionId) !== 4) return;
    const questions = Array.isArray(section?.questions) ? section.questions : [];
    questions.forEach((question, questionIndex) => {
      const questionId = Number(
        question?.questionId || question?.question_id || questionIndex + 1
      );
      if (!Number.isFinite(questionId)) return;

      // The new gate: only flag if the algorithm cannot decide.
      if (!isManualReviewRequired(question)) return;

      const entry = questionMap.get(questionId);
      const rawAnswer = String(entry?.rawAnswer || "").trim().toUpperCase();
      const correctAnswer = String(question?.correctOption || "").trim().toUpperCase();
      const mediaUrl = getQuestionMediaUrl(questionId);

      // Prompt-9 Fix 2: normalise the question's options into a stable
      // [{label, text}] shape so the admin review card can render every
      // choice with the correct one highlighted. Package data stores
      // options as a string[]; convert to A/B/C/D-labelled entries.
      const rawOptions = Array.isArray(question?.options) ? question.options : [];
      const options = rawOptions.map((opt, idx) => {
        if (opt && typeof opt === "object") {
          return {
            label: String(opt.label || String.fromCharCode(65 + idx)).trim(),
            text: String(opt.text || opt.label || "").trim(),
          };
        }
        return {
          label: String.fromCharCode(65 + idx),
          text: String(opt || "").trim(),
        };
      });

      items.push({
        questionId: String(questionId),
        questionText: String(question?.text || "").trim(),
        mediaUrl: mediaUrl || null,
        studentAnswer: rawAnswer || "",
        // correctAnswer is null when the answer key is missing — that's
        // the whole reason this item is in the review list.
        correctAnswer: correctAnswer || null,
        options,
        // Cannot auto-grade. That's why this item is here.
        autoMarkedCorrect: false,
        requiresManualReview: true,
        adminDecision: null,
        adminNote: null,
        subsectionKey: getAptitudeSubsectionKeyForQuestionId(questionId) || "",
      });
    });
  });

  items.sort(
    (a, b) => Number(a.questionId || 0) - Number(b.questionId || 0)
  );

  // hasUnreviewedItems is true only when at least one item is flagged
  // AND still awaiting an admin decision. When manualReviewItems is
  // empty (the common case now that all 160 Section-4 questions have
  // valid answer keys), this is false and the admin can approve
  // immediately with no review step.
  const hasUnreviewedItems = items.some(
    (item) => item.requiresManualReview && item.adminDecision == null
  );

  return { items, hasUnreviewedItems };
};

// Build the four named profile buckets the careerMatcher consumes. Keys
// match the careerMappingData display names (e.g. "Logical-Math") so the
// matcher can look up directly. Falls back to 50 (neutral) per the
// flattenedSignals defaults when a subsection produced no usable signal.
const buildNamedProfileObjects = ({ sectionBreakdown = [], flattenedSignals = {} }) => {
  const aptitudeSection = getSectionByKey(sectionBreakdown, "aptitude");
  const aptitudeByKey = new Map(
    (aptitudeSection?.subsections || []).map((sub) => [sub.key, sub])
  );
  const eqSection = getSectionByKey(sectionBreakdown, "emotional_intelligence");
  const eqByKey = new Map(
    (eqSection?.subsections || []).map((sub) => [sub.key, sub])
  );

  const aptitudePercentage = (key) => {
    const pct = aptitudeByKey.get(key)?.percentage;
    return Number.isFinite(pct) ? pct : 50;
  };
  const eqPercentage = (key) => {
    const pct = eqByKey.get(key)?.percentage;
    return Number.isFinite(pct) ? pct : 50;
  };

  return {
    hollandProfile: {
      R: flattenedSignals.realistic ?? 50,
      I: flattenedSignals.investigative ?? 50,
      A: flattenedSignals.artistic ?? 50,
      S: flattenedSignals.social ?? 50,
      E: flattenedSignals.enterprising ?? 50,
      C: flattenedSignals.conventional ?? 50,
    },
    multipleIntelligences: {
      "Logical-Math": flattenedSignals.logicalMathematical ?? 50,
      Linguistic: flattenedSignals.linguistic ?? 50,
      Spatial: flattenedSignals.visualSpatial ?? 50,
      Musical: flattenedSignals.musical ?? 50,
      "Bodily-Kinesthetic": flattenedSignals.bodilyKinesthetic ?? 50,
      Interpersonal: flattenedSignals.interpersonal ?? 50,
      Intrapersonal: flattenedSignals.intrapersonal ?? 50,
      Naturalistic: flattenedSignals.naturalistic ?? 50,
    },
    aptitudeScores: {
      Verbal: aptitudePercentage("verbal_reasoning"),
      Numerical: aptitudePercentage("numerical_ability"),
      Abstract: aptitudePercentage("abstract_reasoning"),
      "Spatial Relations": aptitudePercentage("spatial_relations"),
      Mechanical: aptitudePercentage("mechanical_reasoning"),
      Clerical: aptitudePercentage("clerical_accuracy"),
      "Critical Thinking": aptitudePercentage("critical_thinking"),
      "Problem Solving": aptitudePercentage("problem_solving"),
    },
    eqProfile: {
      "Self-Awareness": eqPercentage("self_awareness"),
      "Self-Regulation": eqPercentage("self_regulation"),
      Motivation: eqPercentage("motivation"),
      Empathy: eqPercentage("empathy"),
      "Social Skills": eqPercentage("social_skills"),
    },
  };
};

export const scoreCareer500QPackage = (answers = {}, sections = []) => {
  if (!answers || typeof answers !== "object") return null;
  const questionMap = buildQuestionContextMap(sections, answers);
  if (!questionMap.size) return null;

  const sectionBreakdown = CAREER_500Q_CONFIG.sections
    .map((sectionConfig) => buildSectionResult(sectionConfig, questionMap))
    .sort((a, b) => Number(a.sectionId || 0) - Number(b.sectionId || 0));

  const personalitySection = getSectionByKey(sectionBreakdown, "personality");
  const emotionalSection = getSectionByKey(sectionBreakdown, "emotional_intelligence");
  const personalityType = buildPersonalityType({
    bigFiveSection:
      personalitySection?.subsections?.find((item) => item.key === "big_five_ocean") || null,
    emotionalSection,
  });

  const flattenedSignals = buildFlattenedSignals({
    sectionBreakdown,
    personalityType,
  });
  const namedProfile = buildNamedProfileObjects({
    sectionBreakdown,
    flattenedSignals,
  });
  const { items: manualReviewItems, hasUnreviewedItems } =
    buildManualReviewItems({ sections, questionMap });
  const strengths = buildStrengths(flattenedSignals);
  // Career recommendations now flow through the matchCareers engine
  // (backend/utils/scoring/careerMatcher.js) — weighted Holland +
  // intelligence + aptitude + EQ scoring against the 125-career source.
  const careerRecommendations = matchCareers(namedProfile, 10);
  // Prompt-5 fix: overall is a WEIGHTED average per section weight, not
  // a plain mean. Sections with null percentages drop out and remaining
  // weights are renormalised so partial completions aren't penalised.
  const overallScore = computeWeightedOverallScore(sectionBreakdown);
  const completedSections = sectionBreakdown.filter(
    (section) => section.status !== "incomplete"
  ).length;
  const totalSectionsCount = sectionBreakdown.length;
  const completionStatus =
    totalSectionsCount > 0 && completedSections >= totalSectionsCount
      ? "Complete"
      : "Incomplete";
  const testResults = sectionBreakdown.map((section) => ({
    sectionId: section.sectionId,
    sectionName: section.title,
    testName: section.title,
    completedAt: new Date(),
    score: section.percentage,
    maxScore: 100,
    reportUrl: "",
    interpretation: section.interpretation,
  }));
  const reviewSummary = buildReviewSummary({
    strengths,
    careerRecommendations,
    personalityType,
    sectionBreakdown,
    completedTestsCount: testResults.length,
    totalTestsCount: CAREER_500Q_CONFIG.sections.length,
  });
  const observations = buildSpecialObservations({
    sectionBreakdown,
    personalityType,
    flattenedSignals,
  });

  return {
    overallScore,
    overallPercentile: `Top ${Math.max(8, 100 - Number(overallScore || 0))}% profile strength`,
    completedTestsCount: testResults.length,
    totalTestsCount: CAREER_500Q_CONFIG.sections.length,
    // Prompt-5 fix: surface explicit completion-state fields at the top
    // level so the admin payload doesn't have to re-derive them (and so
    // the demo wrapper can overwrite them after re-banding).
    completedSections,
    totalSections: totalSectionsCount,
    completionStatus,
    careerPathwaysCount: careerRecommendations.length,
    testResults,
    sectionBreakdown,
    strengths,
    careerRecommendations,
    // Named profile buckets exposed for downstream consumers — the demo
    // scorer inherits them via spread, and matchCareers can be re-run on a
    // stored profile without re-deriving from sectionBreakdown.
    hollandProfile: namedProfile.hollandProfile,
    multipleIntelligences: namedProfile.multipleIntelligences,
    aptitudeScores: namedProfile.aptitudeScores,
    eqProfile: namedProfile.eqProfile,
    // Section 4 manual-review queue. Persisted on the report (not the
    // profile) once the user submits — see createAssessmentReportEntry.
    manualReviewItems,
    hasUnreviewedItems,
    personalityType: {
      code: personalityType.code,
      title: personalityType.title,
      description: personalityType.description,
      traits: personalityType.traits,
    },
    // Prompt-8: rich personality aggregator that surfaces the full
    // personality picture (MBTI + OCEAN + HSPQ + Work Style) in one
    // structured field. Lets the frontend render a complete personality
    // panel without having to dig into sectionBreakdown.subsections.
    personalityProfile: buildRichPersonalityProfile(
      sectionBreakdown,
      personalityType
    ),
    reviewSummary: {
      ...reviewSummary,
      observations: [...(reviewSummary.observations || []), ...observations].filter(Boolean),
    },
    metadata: {
      algorithmKey: CAREER_500Q_CONFIG.algorithmKey,
      overallMaxScore: 100,
      packageId: CAREER_500Q_CONFIG.packageIds[0],
      scoringGuideSources: CAREER_500Q_CONFIG.scoringGuideSources,
      ambiguityNotes: CAREER_500Q_CONFIG.ambiguityNotes,
    },
  };
};

export default scoreCareer500QPackage;
