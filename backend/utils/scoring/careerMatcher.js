import {
  CAREER_MAPPINGS,
  HOLLAND_CODES,
  INTELLIGENCE_TYPES,
  APTITUDE_SECTIONS,
  EQ_COMPETENCIES,
} from "../../data/careerMappingData.js";

// Public scoring weights — exported so tests and downstream tooling can
// inspect the contract without re-deriving it.
export const CAREER_MATCH_WEIGHTS = Object.freeze({
  holland: 0.35,
  intelligence: 0.25,
  aptitude: 0.25,
  eq: 0.15,
});

const SECONDARY_HOLLAND_WEIGHT = 0.6;

// Profile lookups gracefully fall back to 50 (neutral) when a signal is
// missing. The matcher never throws on partial profiles.
const NEUTRAL_SCORE = 50;
const HIGH_SIGNAL_THRESHOLD = 60;

const toFinite = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const roundTo = (value, digits = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const factor = 10 ** digits;
  return Math.round(numeric * factor) / factor;
};

const lookupScore = (bucket, key, fallback = NEUTRAL_SCORE) => {
  const numeric = toFinite(bucket?.[key]);
  return numeric == null ? fallback : clamp(numeric);
};

const average = (values = []) => {
  const finite = values.map(toFinite).filter((v) => v != null);
  if (!finite.length) return null;
  return finite.reduce((sum, v) => sum + v, 0) / finite.length;
};

const scoreHollandMatch = (career, profile) => {
  const codes = Array.isArray(career.hollandCodes) ? career.hollandCodes : [];
  if (!codes.length) return NEUTRAL_SCORE;

  // Primary code: full weight. Each secondary code is scaled by 0.6 — same
  // shape the task spec describes — then averaged across the matched values.
  const weighted = codes.map((code, idx) => {
    const raw = lookupScore(profile.hollandProfile, code, NEUTRAL_SCORE);
    return idx === 0 ? raw : raw * SECONDARY_HOLLAND_WEIGHT;
  });

  return clamp(average(weighted) || NEUTRAL_SCORE);
};

const scoreBucketAverage = (career, profile, careerKey, profileKey) => {
  const requested = Array.isArray(career[careerKey]) ? career[careerKey] : [];
  if (!requested.length) return NEUTRAL_SCORE;
  const values = requested.map((name) =>
    lookupScore(profile[profileKey], name, NEUTRAL_SCORE)
  );
  return clamp(average(values) || NEUTRAL_SCORE);
};

const joinList = (items = []) => {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
};

const filterHighSignals = (names = [], bucket = {}) =>
  names.filter((name) => Number(bucket?.[name] ?? 0) >= HIGH_SIGNAL_THRESHOLD);

const HOLLAND_LABELS = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const formatHollandReason = (career, profile) => {
  const codes = Array.isArray(career.hollandCodes) ? career.hollandCodes : [];
  if (!codes.length) return "Career does not specify Holland codes.";
  const strong = codes.filter(
    (code) => Number(profile.hollandProfile?.[code] ?? 0) >= HIGH_SIGNAL_THRESHOLD
  );
  if (strong.length) {
    const labeled = strong.map((c) => `${c} (${HOLLAND_LABELS[c] || c})`);
    return `Your dominant interest code${strong.length === 1 ? "" : "s"} ${joinList(labeled)} align${strong.length === 1 ? "s" : ""} with this path.`;
  }
  const primary = codes[0];
  return `Career leans on ${primary} (${HOLLAND_LABELS[primary] || primary}) interests — partial match on your current profile.`;
};

const formatBucketReason = ({
  career,
  profile,
  careerKey,
  profileKey,
  labelHigh,
  labelPartial,
}) => {
  const requested = Array.isArray(career[careerKey]) ? career[careerKey] : [];
  if (!requested.length) return `${labelPartial} not specified for this career.`;
  const strong = filterHighSignals(requested, profile[profileKey]);
  if (strong.length) return `${labelHigh} ${joinList(strong)}.`;
  return `${labelPartial} ${joinList(requested)} — partial signal on your profile.`;
};

const buildMatchReasons = (career, profile) => ({
  holland: formatHollandReason(career, profile),
  intelligence: formatBucketReason({
    career,
    profile,
    careerKey: "intelligenceTypes",
    profileKey: "multipleIntelligences",
    labelHigh: "Strong intelligence signals in",
    labelPartial: "This career draws on",
  }),
  aptitude: formatBucketReason({
    career,
    profile,
    careerKey: "aptitudeStrengths",
    profileKey: "aptitudeScores",
    labelHigh: "Strong aptitude scores in",
    labelPartial: "Key aptitude areas",
  }),
  eq: formatBucketReason({
    career,
    profile,
    careerKey: "eqCompetencies",
    profileKey: "eqProfile",
    labelHigh: "High EQ in",
    labelPartial: "Career leans on EQ areas",
  }),
});

const validateProfile = (profile) => {
  if (!profile || typeof profile !== "object") {
    return {
      hollandProfile: {},
      multipleIntelligences: {},
      aptitudeScores: {},
      eqProfile: {},
    };
  }
  return {
    hollandProfile: profile.hollandProfile || {},
    multipleIntelligences: profile.multipleIntelligences || {},
    aptitudeScores: profile.aptitudeScores || {},
    eqProfile: profile.eqProfile || {},
  };
};

// Map career-match output into the legacy careerRecommendation shape so
// existing renderers and DB writes don't break while the frontend transitions
// to the richer fields (category, score, matchReasons).
const formatCareerSkills = (career) => {
  const skills = [
    ...(Array.isArray(career.intelligenceTypes) ? career.intelligenceTypes : []),
    ...(Array.isArray(career.aptitudeStrengths) ? career.aptitudeStrengths : []),
  ];
  // Dedupe + cap at 6 so the UI doesn't get a long tail.
  return [...new Set(skills)].slice(0, 6);
};

export const matchCareers = (profile, topN = 10) => {
  const safeProfile = validateProfile(profile);
  const safeTopN = Math.max(
    1,
    Math.min(CAREER_MAPPINGS.length, Number(topN) || 10)
  );

  const scored = CAREER_MAPPINGS.map((career) => {
    const hollandMatch = scoreHollandMatch(career, safeProfile);
    const intelligenceMatch = scoreBucketAverage(
      career,
      safeProfile,
      "intelligenceTypes",
      "multipleIntelligences"
    );
    const aptitudeMatch = scoreBucketAverage(
      career,
      safeProfile,
      "aptitudeStrengths",
      "aptitudeScores"
    );
    const eqMatch = scoreBucketAverage(
      career,
      safeProfile,
      "eqCompetencies",
      "eqProfile"
    );

    const blended =
      hollandMatch * CAREER_MATCH_WEIGHTS.holland +
      intelligenceMatch * CAREER_MATCH_WEIGHTS.intelligence +
      aptitudeMatch * CAREER_MATCH_WEIGHTS.aptitude +
      eqMatch * CAREER_MATCH_WEIGHTS.eq;
    const score = roundTo(clamp(blended), 1);

    return {
      title: career.title,
      category: career.category,
      score,
      // Legacy field — older clients (and the existing schema) still read
      // matchPercent. Kept aligned with score so nothing regresses.
      matchPercent: Math.round(score),
      hollandCodes: career.hollandCodes,
      intelligenceTypes: career.intelligenceTypes,
      aptitudeStrengths: career.aptitudeStrengths,
      eqCompetencies: career.eqCompetencies,
      breakdown: {
        hollandMatch: roundTo(hollandMatch, 1),
        intelligenceMatch: roundTo(intelligenceMatch, 1),
        aptitudeMatch: roundTo(aptitudeMatch, 1),
        eqMatch: roundTo(eqMatch, 1),
      },
      matchReasons: buildMatchReasons(career, safeProfile),
      description: "",
      skills: formatCareerSkills(career),
      salaryRange: "",
      link: "",
    };
  });

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, safeTopN);
};

export const CAREER_MATCHER_INFO = Object.freeze({
  totalCareers: CAREER_MAPPINGS.length,
  weights: CAREER_MATCH_WEIGHTS,
  hollandCodes: HOLLAND_CODES,
  intelligenceTypes: INTELLIGENCE_TYPES,
  aptitudeSections: APTITUDE_SECTIONS,
  eqCompetencies: EQ_COMPETENCIES,
});

export default matchCareers;
