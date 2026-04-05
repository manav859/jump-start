import {
  PERSONALITY_ARCHETYPES,
  buildCareerRecommendations,
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

  questionNumbers.forEach((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    if (!entry) return;
    const numeric = getLikertValue(entry.rawAnswer, reverseSet.has(Number(questionNumber)));
    if (numeric == null) return;
    values.push(numeric);
    answeredCount += 1;
  });

  const totalQuestions = uniqueQuestionCount(questionNumbers);
  const rawScore = values.length
    ? roundTo(values.reduce((sum, value) => sum + value, 0), 2)
    : null;
  const maxScore = totalQuestions * 5;
  const averageScore = values.length ? roundTo(average(values), 2) : null;
  const percentage = averageScore == null ? null : likertToPercent(averageScore);

  return {
    rawScore,
    maxScore,
    average: averageScore,
    percentage,
    answeredCount,
    totalQuestions,
    status: summarizeStatus(answeredCount, totalQuestions),
  };
};

const computeObjectiveMetrics = (questionNumbers = [], questionMap) => {
  let correctCount = 0;
  let scorableCount = 0;
  let answeredCount = 0;

  questionNumbers.forEach((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    if (!entry) return;
    const rawAnswer = normalizeAnswerLetter(entry.rawAnswer);
    const correctOption = normalizeAnswerLetter(entry.question?.correctOption);
    if (rawAnswer) answeredCount += 1;
    if (!correctOption) return;
    scorableCount += 1;
    if (rawAnswer && rawAnswer === correctOption) correctCount += 1;
  });

  const totalQuestions = uniqueQuestionCount(questionNumbers);
  const percentage =
    scorableCount > 0 ? roundPercent((correctCount / scorableCount) * 100) : null;

  return {
    rawScore: scorableCount > 0 ? correctCount : null,
    maxScore: scorableCount > 0 ? scorableCount : totalQuestions,
    average: null,
    percentage,
    answeredCount,
    totalQuestions,
    scorableCount,
    status: summarizeStatus(answeredCount, totalQuestions, scorableCount > 0 ? "completed" : "review_required"),
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
  const requiresExplicitOptions = !rules.length && !hasDirectAnswerMapping;
  const missingOptionMetadata = subsectionConfig.questionNumbers.some((questionNumber) => {
    const entry = questionMap.get(Number(questionNumber));
    return !Array.isArray(entry?.question?.options) || entry.question.options.length < 3;
  });

  if (requiresExplicitOptions && missingOptionMetadata) {
    const totalQuestions = uniqueQuestionCount(subsectionConfig.questionNumbers);
    const answeredCount = subsectionConfig.questionNumbers.reduce((count, questionNumber) => {
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
      questionNumbers: subsectionConfig.questionNumbers,
      questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
      status: answeredCount ? "review_required" : "incomplete",
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
  const consistency = answeredCount
    ? roundPercent((dominantCount / answeredCount) * 100)
    : null;

  return {
    key: subsectionConfig.key,
    label: subsectionConfig.label,
    answerType: subsectionConfig.answerType,
    scoreType: subsectionConfig.scoreType,
    score: dominantCount || null,
    rawScore: dominantCount || null,
    maxScore: answeredCount || uniqueQuestionCount(subsectionConfig.questionNumbers),
    average: null,
    percentage: consistency,
    band: dominantProfile?.label || "",
    interpretation:
      dominantProfile?.interpretation ||
      "No dominant preference pattern could be resolved from the answered options.",
    careerImplication: dominantProfile?.careerImplication || "",
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: summarizeStatus(
      answeredCount,
      uniqueQuestionCount(subsectionConfig.questionNumbers)
    ),
    description:
      dominantProfile?.interpretation ||
      "No dominant preference pattern could be resolved from the answered options.",
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
    interpretation:
      getBandInterpretation(band) || "Interpretation unavailable for this subsection.",
    careerImplication: getBandCareerImplication(band),
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: metrics.status,
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
    return {
      ...cluster,
      average: metrics.average,
      percentage: metrics.percentage,
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
    band: clusterResults[0]?.label || "",
    interpretation,
    careerImplication,
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: summarizeStatus(questionScores.length, uniqueQuestionCount(subsectionConfig.questionNumbers)),
    description: interpretation,
    clusterResults,
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
  const band = resolveInterpretationBand(metrics.rawScore, subsectionConfig.bands || []);

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
    band: getBandLabel(band),
    interpretation:
      getBandInterpretation(band) || "Interpretation unavailable for this aptitude block.",
    careerImplication: getBandCareerImplication(band),
    questionNumbers: subsectionConfig.questionNumbers,
    questionRangeLabel: buildQuestionRangeLabel(subsectionConfig.questionNumbers),
    status: metrics.status,
    description:
      getBandInterpretation(band) || "Interpretation unavailable for this aptitude block.",
    answeredCount: metrics.answeredCount,
    totalQuestions: metrics.totalQuestions,
  };
};

const scoreSubsection = (subsectionConfig, questionMap) => {
  switch (subsectionConfig.scoringMethod) {
    case "banded_likert_average":
      return scoreBandedLikertAverage(subsectionConfig, questionMap);
    case "factor_profile":
      return scoreFactorProfile(subsectionConfig, questionMap);
    case "work_style_profile":
      return scoreCategoricalProfile(subsectionConfig, questionMap);
    case "subject_cluster_profile":
      return scoreSubjectClusterProfile(subsectionConfig, questionMap);
    case "interest_activity_profile":
      return scoreCategoricalProfile(subsectionConfig, questionMap, ACTIVITY_OPTION_RULES);
    case "environment_profile":
      return scoreCategoricalProfile(subsectionConfig, questionMap, ENVIRONMENT_OPTION_RULES);
    case "objective_correct":
    case "manual_review_only":
      return scoreObjectiveSubsection(subsectionConfig, questionMap);
    default:
      return {
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
  }
};

const buildSectionInterpretation = (sectionResult) => {
  const completedSubsections = (sectionResult.subsections || []).filter(
    (item) => item.status !== "incomplete"
  );
  const topSubsections = [...completedSubsections]
    .filter((item) => item.percentage != null)
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .slice(0, 2);

  if (!topSubsections.length) {
    return {
      interpretation: "Section-level interpretation is not available yet.",
      careerImplication: "",
    };
  }

  return {
    interpretation: `Strongest subsection signals: ${joinList(
      topSubsections.map((item) => item.label)
    )}.`,
    careerImplication: joinList(
      topSubsections.map((item) => item.careerImplication).filter(Boolean)
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
  const totalQuestions = uniqueQuestionCount(questionNumbers);
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
  const strengths = buildStrengths(flattenedSignals);
  const careerRecommendations = buildCareerRecommendations(flattenedSignals);
  const overallScore = roundPercent(
    average(
      sectionBreakdown
        .map((section) => section.percentage)
        .filter((value) => Number.isFinite(value))
    )
  );
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
    careerPathwaysCount: careerRecommendations.length,
    testResults,
    sectionBreakdown,
    strengths,
    careerRecommendations,
    personalityType: {
      code: personalityType.code,
      title: personalityType.title,
      description: personalityType.description,
      traits: personalityType.traits,
    },
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
