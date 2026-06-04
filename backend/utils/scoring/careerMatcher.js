import {
  CAREER_MAPPINGS,
  HOLLAND_CODES,
  INTELLIGENCE_TYPES,
  APTITUDE_SECTIONS,
  EQ_COMPETENCIES,
} from "../../data/careerMappingData.js";

// Public scoring weights — exported so tests and downstream tooling can
// inspect the contract without re-deriving it.
// Clustering fix — differentiation-tuned weights:
//   - eq cut 0.15 -> 0.10: Social Skills / Motivation are high-baseline for
//     almost every sociable student and are required by a large share of
//     careers, so a heavy EQ weight added a flat lift that floated every
//     business/people career (Sales Manager especially) for anyone outgoing.
//   - aptitude nudged 0.25 -> 0.30: it's the only objective, right/wrong
//     signal and varies most between students, so it discriminates best. The
//     nudge is deliberately modest — over-weighting aptitude penalises
//     intelligence-driven arts/music careers whose aptitude requirement is
//     thin (e.g. Musician lists only "Abstract").
//   - holland (0.35) and intelligence (0.25) held: Holland is the interest
//     anchor (now de-biased upstream by ipsatizeInterestScores) and
//     intelligence carries the arts/music spikes (Musical, Spatial).
export const CAREER_MATCH_WEIGHTS = Object.freeze({
  holland: 0.35,
  intelligence: 0.25,
  aptitude: 0.30,
  eq: 0.10,
});

// Holland match is PRIMARY-DOMINANT: the career's primary code carries this
// share of the score and the secondary codes split the rest. The earlier
// formula averaged primary (1.0x) with each secondary (0.6x), which had two
// bad effects: (1) a strong secondary-less single-code career (e.g. Sales
// Manager ["E"]) got the student's full E with no dilution, while (2) a
// multi-code career whose PRIMARY matches the student's peak (e.g. Banking
// ["C","E"] for a C-dominant student) was dragged BELOW its primary by the
// averaging — so single-code "people/business" careers won unfairly. Anchoring
// on the primary fixes both: a career is scored mainly on how well the
// student's interest matches its principal theme, with secondaries as a bonus.
const PRIMARY_HOLLAND_WEIGHT = 0.75;

// Bumped whenever the scoring engine changes in a way that alters stored
// careerRecommendations (interest ipsatization + the re-tuned weights below).
// Reports carry this on `profile.careerRematch.version`; the rematch migration
// (backend/scratch/migrateCareerRematch.mjs) uses it to skip reports already
// produced by — or already migrated to — the current engine, which keeps the
// migration idempotent and stops it from double-ipsatizing fresh reports.
export const CAREER_MATCHER_VERSION = "ipsatize-weights-v1";

// Peak-reward blend for the intelligence and aptitude buckets. Instead of a
// flat mean over the career's required dimensions, a fraction of the bucket
// score is driven by the student's SINGLE strongest aligned dimension. This
// rewards careers whose requirements line up with where a student genuinely
// spikes (e.g. a spatial-spiker toward design/engineering) and stops a career
// that asks only for universally-high "easy" dimensions from out-scoring a
// career that needs a specific strength the student actually has.
const PEAK_BLEND = 0.4;

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

  // Primary-dominant: anchor on the primary code; secondary codes split the
  // remaining weight as a bonus (never diluting the primary below itself).
  const primary = lookupScore(profile.hollandProfile, codes[0], NEUTRAL_SCORE);
  if (codes.length === 1) return clamp(primary);
  const secondaryAvg =
    average(codes.slice(1).map((code) => lookupScore(profile.hollandProfile, code, NEUTRAL_SCORE))) ??
    NEUTRAL_SCORE;
  return clamp(primary * PRIMARY_HOLLAND_WEIGHT + secondaryAvg * (1 - PRIMARY_HOLLAND_WEIGHT));
};

const scoreBucketAverage = (
  career,
  profile,
  careerKey,
  profileKey,
  { peakReward = false } = {}
) => {
  const requested = Array.isArray(career[careerKey]) ? career[careerKey] : [];
  if (!requested.length) return NEUTRAL_SCORE;
  const values = requested.map((name) =>
    lookupScore(profile[profileKey], name, NEUTRAL_SCORE)
  );
  const avg = average(values) || NEUTRAL_SCORE;
  if (!peakReward) return clamp(avg);
  // Blend the mean with the strongest aligned dimension so genuine spikes
  // pull careers that need them. avg-only would wash individuality out.
  const peak = Math.max(...values);
  return clamp(avg * (1 - PEAK_BLEND) + peak * PEAK_BLEND);
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

// Threshold-based filter rules:
//   - include every career whose score >= MATCH_THRESHOLD
//   - always include at least MIN_RESULTS top-scoring careers, even if
//     they fall below the threshold (so a low-signal profile still
//     gets actionable recommendations)
//   - never return more than `maxN` results
export const MATCH_THRESHOLD = 60;
export const MIN_RESULTS = 3;

export const matchCareers = (profile, maxN = 15) => {
  const safeProfile = validateProfile(profile);
  const safeMaxN = Math.max(
    MIN_RESULTS,
    Math.min(CAREER_MAPPINGS.length, Number(maxN) || 15)
  );

  const scored = CAREER_MAPPINGS.map((career) => {
    const hollandMatch = scoreHollandMatch(career, safeProfile);
    const intelligenceMatch = scoreBucketAverage(
      career,
      safeProfile,
      "intelligenceTypes",
      "multipleIntelligences",
      { peakReward: true }
    );
    const aptitudeMatch = scoreBucketAverage(
      career,
      safeProfile,
      "aptitudeStrengths",
      "aptitudeScores",
      { peakReward: true }
    );
    // EQ stays a plain mean (and low weight): it's a baseline human-skills
    // signal, not a differentiator — peak-rewarding it would re-introduce the
    // flat people-skills lift this fix is removing.
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

  // Apply threshold: keep all >= MATCH_THRESHOLD, but guarantee at
  // least MIN_RESULTS so we never return an empty (or near-empty) list
  // for a low-signal profile. Hard cap at safeMaxN.
  const aboveThreshold = scored.filter((c) => c.score >= MATCH_THRESHOLD);
  const minBaseline = scored.slice(0, MIN_RESULTS);
  const merged =
    aboveThreshold.length >= MIN_RESULTS ? aboveThreshold : minBaseline;

  return merged.slice(0, safeMaxN);
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
