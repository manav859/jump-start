const HIGH_SIGNAL_BANDS = new Set(["High", "Excellent", "Strong"]);
const MID_SIGNAL_BANDS = new Set(["Moderate", "Good", "Average"]);
const POSITIVE_LOW_FACTOR_KEYS = new Set(["neuroticism"]);
const SUBSECTION_PREFIX_PATTERN = /^\d+(?:\.\d+)*\s*/;

const cleanLabel = (value = "") =>
  String(value || "")
    .replace(SUBSECTION_PREFIX_PATTERN, "")
    .trim();

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const trimSentence = (value = "") =>
  cleanText(value).replace(/[.!,;:\s]+$/g, "");

const appendCareerImplication = (description = "", careerImplication = "") => {
  const narrative = trimSentence(description);
  const implication = trimSentence(careerImplication);

  if (narrative && implication) {
    return `${narrative} -> ${implication}`;
  }

  return narrative || implication || "";
};

const formatScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(1);
};

const joinList = (items = []) => {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
};

const createItem = ({ key, title, detail = "", meta = "" }) => ({
  key: String(key || title || ""),
  title: cleanText(title),
  detail: cleanText(detail),
  meta: cleanText(meta),
});

const buildCoverageFallback = (subsectionResult = {}) => {
  const answeredCount = Number(subsectionResult.answeredCount || 0);
  const totalQuestions = Number(subsectionResult.totalQuestions || 0);
  const detail = totalQuestions
    ? `Only ${answeredCount}/${totalQuestions} questions were answered for this subsection.`
    : "This subsection does not have enough answered data yet.";

  return {
    summary: "Insufficient answered data.",
    items: [
      createItem({
        key: `${subsectionResult.key}.incomplete`,
        title: "Insufficient data",
        detail,
      }),
    ],
  };
};

const buildReviewRequiredFallback = (subsectionResult = {}) => ({
  summary: trimSentence(subsectionResult.interpretation) || "Manual review required.",
  items: [
    createItem({
      key: `${subsectionResult.key}.review`,
      title: "Manual review required",
      detail:
        cleanText(subsectionResult.interpretation) ||
        "This subsection requires manual interpretation review.",
    }),
  ],
});

const buildGenericFallback = (subsectionConfig = {}, subsectionResult = {}) => ({
  summary:
    trimSentence(subsectionResult.interpretation) ||
    trimSentence(subsectionResult.description) ||
    cleanLabel(subsectionConfig.label) ||
    "Interpretation unavailable.",
  items: [
    createItem({
      key: `${subsectionResult.key || subsectionConfig.key}.summary`,
      title:
        trimSentence(subsectionResult.interpretation) ||
        trimSentence(subsectionResult.description) ||
        cleanLabel(subsectionConfig.label) ||
        "Interpretation unavailable",
      detail: appendCareerImplication("", subsectionResult.careerImplication),
    }),
  ],
});

const isPositiveLowFactor = (factorResult = {}) =>
  POSITIVE_LOW_FACTOR_KEYS.has(String(factorResult.key || "").trim()) &&
  String(factorResult.band || "").trim() === "Low";

const resolveFactorPriority = (factorResult = {}) => {
  const band = String(factorResult.band || "").trim();
  if (isPositiveLowFactor(factorResult)) return 4;
  if (HIGH_SIGNAL_BANDS.has(band)) return 3;
  if (MID_SIGNAL_BANDS.has(band)) return 2;
  return 1;
};

const resolveFactorStrength = (factorResult = {}) => {
  const average = Number(factorResult.average);
  if (Number.isFinite(average)) {
    return isPositiveLowFactor(factorResult) ? 6 - average : average;
  }

  const percentage = Number(factorResult.percentage);
  if (Number.isFinite(percentage)) return percentage;

  const score = Number(factorResult.score);
  if (Number.isFinite(score)) return score;

  return 0;
};

const sortFactorSignals = (items = []) =>
  [...items].sort((a, b) => {
    const priorityDiff = resolveFactorPriority(b) - resolveFactorPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    const strengthDiff = resolveFactorStrength(b) - resolveFactorStrength(a);
    if (strengthDiff !== 0) return strengthDiff;

    return cleanLabel(a.label).localeCompare(cleanLabel(b.label));
  });

const buildFactorTitle = (factorResult = {}) => {
  const label = cleanLabel(factorResult.label);
  const band = String(factorResult.band || "").trim();

  if (isPositiveLowFactor(factorResult)) {
    return "Low Neuroticism";
  }

  return band ? `${band} ${label}` : label;
};

const buildFactorItem = (factorResult = {}) =>
  createItem({
    key: factorResult.id || factorResult.key || factorResult.label,
    title: buildFactorTitle(factorResult),
    detail: appendCareerImplication(
      factorResult.description || factorResult.interpretation,
      factorResult.careerImplication
    ),
    meta: factorResult.bandRangeLabel || "",
  });

const resolveMatchedCombination = (subsectionConfig = {}, factorResults = []) =>
  (subsectionConfig.combinationRules || []).find((rule) => {
    const requiredOk = (rule.requiredFactors || []).every((key) => {
      const factor = factorResults.find((item) => item.key === key);
      return factor?.average != null && factor.average >= Number(rule.minAverage || 0);
    });
    const maxOk = (rule.maxFactors || []).every((key) => {
      const factor = factorResults.find((item) => item.key === key);
      return factor?.average != null && factor.average <= Number(rule.maxAverage || 5);
    });
    return requiredOk && maxOk;
  }) || null;

const buildFactorBasedInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  const factorResults = Array.isArray(subsectionResult.factorResults)
    ? subsectionResult.factorResults.filter((item) => item?.status !== "incomplete")
    : [];

  if (!factorResults.length) {
    return buildGenericFallback(subsectionConfig, subsectionResult);
  }

  const matchedCombination = resolveMatchedCombination(subsectionConfig, factorResults);
  const positiveSignals = factorResults.filter(
    (item) =>
      HIGH_SIGNAL_BANDS.has(String(item.band || "").trim()) || isPositiveLowFactor(item)
  );
  const displayLimit = subsectionConfig.key === "big_five_ocean" ? 5 : 3;
  const selectedSignals = sortFactorSignals(
    positiveSignals.length ? positiveSignals : factorResults
  ).slice(0, displayLimit);

  const items = [];
  if (matchedCombination?.interpretation) {
    items.push(
      createItem({
        key: `${subsectionConfig.key}.pattern`,
        title: matchedCombination.label || "Combined factor pattern",
        detail: appendCareerImplication(
          matchedCombination.interpretation,
          matchedCombination.careerImplication
        ),
      })
    );
  }

  items.push(...selectedSignals.map((item) => buildFactorItem(item)));

  return {
    summary:
      trimSentence(matchedCombination?.interpretation) ||
      joinList(selectedSignals.map((item) => buildFactorTitle(item))) ||
      trimSentence(subsectionResult.interpretation),
    items,
  };
};

const buildHollandInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  const factorResults = Array.isArray(subsectionResult.factorResults)
    ? subsectionResult.factorResults.filter((item) => item?.status !== "incomplete")
    : [];

  if (!factorResults.length) {
    return buildGenericFallback(subsectionConfig, subsectionResult);
  }

  const rankedFactors = sortFactorSignals(factorResults);
  const highSignals = factorResults.filter((item) =>
    HIGH_SIGNAL_BANDS.has(String(item.band || "").trim())
  );
  const selectedSignals = (highSignals.length ? sortFactorSignals(highSignals) : rankedFactors).slice(
    0,
    3
  );
  const code = rankedFactors
    .slice(0, 3)
    .map((item) => cleanLabel(item.label).charAt(0).toUpperCase())
    .join("");
  const matchedCode = (subsectionConfig.hollandCombinations || []).find(
    (item) => item.code === code
  );

  const items = [];
  if (code) {
    items.push(
      createItem({
        key: `${subsectionConfig.key}.hollandCode`,
        title: `Top Holland Pattern: ${code}`,
        detail: appendCareerImplication(
          matchedCode?.interpretation || subsectionResult.interpretation,
          matchedCode?.careerImplication || subsectionResult.careerImplication
        ),
      })
    );
  }

  items.push(
    ...selectedSignals.map((item) =>
      createItem({
        key: item.id || item.key || item.label,
        title: `${String(item.band || "").trim() || "Top"} ${cleanLabel(item.label)} Interest`,
        detail: appendCareerImplication(
          item.description || item.interpretation,
          item.careerImplication
        ),
        meta: item.bandRangeLabel || "",
      })
    )
  );

  return {
    summary:
      trimSentence(matchedCode?.interpretation) ||
      trimSentence(subsectionResult.interpretation) ||
      `Top Holland Pattern: ${code}`,
    items,
  };
};

const buildAverageBandInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  const label = cleanLabel(subsectionConfig.label || subsectionResult.label);
  const title = subsectionResult.band
    ? `${subsectionResult.band} ${label}`
    : label || trimSentence(subsectionResult.interpretation);
  const detail = appendCareerImplication(
    trimSentence(subsectionResult.interpretation).toLowerCase() === title.toLowerCase()
      ? ""
      : subsectionResult.interpretation,
    subsectionResult.careerImplication
  );

  return {
    summary: trimSentence(subsectionResult.interpretation) || title,
    items: [
      createItem({
        key: `${subsectionResult.key}.average`,
        title,
        detail,
        meta:
          subsectionResult.bandRangeLabel ||
          (subsectionResult.average != null
            ? `${formatScore(subsectionResult.average)} / 5 average`
            : ""),
      }),
    ],
  };
};

const buildCorrectCountInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  if (subsectionResult.scoreType === "review_only") {
    return buildReviewRequiredFallback(subsectionResult);
  }

  const title =
    trimSentence(subsectionResult.interpretation) ||
    `${subsectionResult.band} ${cleanLabel(subsectionConfig.label || subsectionResult.label)}`;
  const detail = appendCareerImplication("", subsectionResult.careerImplication);
  const items = [
    createItem({
      key: `${subsectionResult.key}.countBand`,
      title,
      detail,
    }),
  ];

  if (subsectionResult.score != null && subsectionResult.maxScore != null) {
    items.push(
      createItem({
        key: `${subsectionResult.key}.scoreBand`,
        title: "Score band",
        detail: `${formatScore(subsectionResult.score)}/${formatScore(
          subsectionResult.maxScore
        )} correct`,
        meta: subsectionResult.bandRangeLabel || "",
      })
    );
  }

  return {
    summary: title,
    items,
  };
};

const buildChoicePatternInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  const breakdown = Array.isArray(subsectionResult.profileBreakdown)
    ? subsectionResult.profileBreakdown.filter((item) => Number(item.count || 0) > 0)
    : [];
  const dominant = breakdown[0] || null;
  const secondary = breakdown[1] || null;

  if (!dominant) {
    const label = cleanLabel(subsectionConfig.label || subsectionResult.label || "Preference");
    return {
      summary: `Mixed ${label.toLowerCase()} pattern`,
      items: [
        createItem({
          key: `${subsectionResult.key}.mixed`,
          title: `Mixed ${label} pattern`,
          detail:
            "Responses were distributed across multiple preference styles without one clear dominant tendency.",
        }),
      ],
    };
  }

  const items = [];
  if (
    secondary &&
    Number.isFinite(Number(dominant.percentage)) &&
    Number.isFinite(Number(secondary.percentage)) &&
    Number(dominant.percentage) - Number(secondary.percentage) <= 10
  ) {
    items.push(
      createItem({
        key: `${subsectionResult.key}.mixed`,
        title: "Mixed preference pattern",
        detail: `Responses sit between ${dominant.label} and ${secondary.label}.`,
      })
    );
  }

  const highlights = Array.isArray(dominant.highlights) ? dominant.highlights.slice(0, 3) : [];
  if (highlights.length) {
    items.push(
      ...highlights.map((highlight, index) =>
        createItem({
          key: `${subsectionResult.key}.highlight.${index}`,
          title: trimSentence(highlight),
          detail: "",
        })
      )
    );
  } else {
    items.push(
      createItem({
        key: `${subsectionResult.key}.dominant`,
        title: dominant.label || subsectionResult.band || cleanLabel(subsectionConfig.label),
        detail: appendCareerImplication(
          dominant.interpretation || subsectionResult.interpretation,
          dominant.careerImplication || subsectionResult.careerImplication
        ),
        meta:
          subsectionResult.percentage != null
            ? `${formatScore(subsectionResult.percentage)}% consistency`
            : "",
      })
    );
  }

  return {
    summary:
      trimSentence(subsectionResult.interpretation) ||
      dominant.label ||
      cleanLabel(subsectionConfig.label),
    items,
  };
};

const buildSubjectPreferenceInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  const items = [];
  const combinationMatch = subsectionResult.combinationMatch || null;

  if (combinationMatch?.interpretation) {
    items.push(
      createItem({
        key: `${subsectionResult.key}.subjectPattern`,
        title: "Top subject pattern",
        detail: appendCareerImplication(
          combinationMatch.interpretation,
          combinationMatch.careerImplication
        ),
      })
    );
  }

  const topSubjects = Array.isArray(subsectionResult.topSubjects)
    ? subsectionResult.topSubjects.slice(0, 3)
    : [];
  if (topSubjects.length) {
    items.push(
      ...topSubjects.map((subject, index) =>
        createItem({
          key: `${subsectionResult.key}.subject.${index}`,
          title: `${
            Number(subject.average || 0) >= 4 ? "Strong preference for" : "Notable interest in"
          } ${cleanLabel(subject.label)}`,
          detail: "",
          meta: subject.average != null ? `${formatScore(subject.average)} / 5` : "",
        })
      )
    );
  }

  if (!items.length) {
    const clusterResults = Array.isArray(subsectionResult.clusterResults)
      ? subsectionResult.clusterResults.filter((item) => item?.status !== "incomplete")
      : [];
    const selectedClusters = sortFactorSignals(clusterResults).slice(0, 3);
    items.push(...selectedClusters.map((item) => buildFactorItem(item)));
  }

  return {
    summary: trimSentence(subsectionResult.interpretation) || items[0]?.title || "Subject preferences",
    items,
  };
};

export const buildCompositeProfileInterpretation = (profile = {}) => {
  if (!profile?.code) return { summary: "", items: [] };

  const traits = Array.isArray(profile.traits) ? profile.traits.slice(0, 4) : [];
  return {
    summary: `Estimated profile ${profile.code}`,
    items: [
      createItem({
        key: `${profile.code}.archetype`,
        title: `${profile.code} (${profile.title || "Career Explorer"})`,
        detail: cleanText(profile.description),
      }),
      ...traits.map((trait, index) =>
        createItem({
          key: `${profile.code}.trait.${index}`,
          title: `${cleanLabel(trait.name)} signal`,
          detail: "",
          meta: trait.value != null ? `${formatScore(trait.value)}%` : "",
        })
      ),
    ],
  };
};

export const buildSubsectionInterpretation = (subsectionConfig = {}, subsectionResult = {}) => {
  if (subsectionResult.status === "incomplete") {
    return buildCoverageFallback(subsectionResult);
  }

  if (subsectionResult.status === "review_required" || subsectionResult.scoreType === "review_only") {
    return buildReviewRequiredFallback(subsectionResult);
  }

  if (subsectionConfig.key === "big_five_ocean") {
    return buildFactorBasedInterpretation(subsectionConfig, subsectionResult);
  }

  if (subsectionConfig.key === "holland_riasec") {
    return buildHollandInterpretation(subsectionConfig, subsectionResult);
  }

  if (subsectionConfig.key === "subject_preferences") {
    return buildSubjectPreferenceInterpretation(subsectionConfig, subsectionResult);
  }

  const interpretationMode =
    subsectionResult.evaluationType || subsectionConfig.scoringMethod || "";

  switch (interpretationMode) {
    case "factor_profile":
    case "subscale_average":
    case "factor_average":
    case "average_per_dimension":
      return buildFactorBasedInterpretation(subsectionConfig, subsectionResult);
    case "banded_likert_average":
    case "average":
      return buildAverageBandInterpretation(subsectionConfig, subsectionResult);
    case "objective_correct":
    case "manual_review_only":
    case "correct_answer_count":
      return buildCorrectCountInterpretation(subsectionConfig, subsectionResult);
    case "work_style_profile":
    case "interest_activity_profile":
    case "environment_profile":
    case "categorical_preference_grouping":
    case "choice_pattern_analysis":
      return buildChoicePatternInterpretation(subsectionConfig, subsectionResult);
    case "subject_cluster_profile":
    case "average_or_preference_strength":
      return buildSubjectPreferenceInterpretation(subsectionConfig, subsectionResult);
    default:
      return buildGenericFallback(subsectionConfig, subsectionResult);
  }
};
