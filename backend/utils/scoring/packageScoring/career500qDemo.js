import scoreCareer500QPackage from "./career500q.js";
import {
  DEMO_PACKAGE_ID,
  DEMO_ALGORITHM_KEY,
  DEMO_APTITUDE_BANDS,
  DEMO_APTITUDE_SUBSECTION_KEYS,
} from "../configs/career500qDemo.config.js";
import { matchCareers } from "../careerMatcher.js";

const DEMO_TOP_N = 6;
const APTITUDE_SECTION_KEY = "aptitude";

// Prompt-5 fix: weighted overall-score formula, mirrored from career500q.js
// so the wrapper can recompute after re-banding. Sections with null
// percentages drop out and the remaining weights renormalise.
const SECTION_WEIGHTS = {
  1: 0.2,
  2: 0.2,
  3: 0.15,
  4: 0.3,
  5: 0.15,
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
    return Math.round(
      present.reduce((sum, s) => sum + Number(s.percentage), 0) /
        present.length
    );
  }
  return Math.round(weightedSum / totalWeight);
};

const resolveDemoBand = (percentage) => {
  if (percentage == null || !Number.isFinite(Number(percentage))) return null;
  const numeric = Number(percentage);
  return (
    DEMO_APTITUDE_BANDS.find(
      (band) => numeric >= Number(band.min) && numeric <= Number(band.max)
    ) || null
  );
};

const rebandAptitudeSubsection = (subsection) => {
  if (!subsection || !DEMO_APTITUDE_SUBSECTION_KEYS.has(subsection.key)) {
    return subsection;
  }
  // Keep the original aptitude raw-correct count visible (already in
  // rawScore/maxScore), but replace the band/interpretation with a
  // percentage-aware version. With the Prompt-5 unification of bands in
  // career500q.js, the inner scorer already returns percentage-driven
  // bands, so this mainly re-aligns the displayed band labels with the
  // demo-specific copy.
  const band = resolveDemoBand(subsection.percentage);
  if (!band) return subsection;

  return {
    ...subsection,
    band: band.label,
    bandMin: band.min,
    bandMax: band.max,
    bandRangeLabel: `${band.min}-${band.max}%`,
    interpretation: band.interpretation,
    description: band.interpretation,
    careerImplication: band.careerImplication,
  };
};

const rebandSectionBreakdown = (sectionBreakdown = []) =>
  sectionBreakdown.map((section) => {
    if (section?.key !== APTITUDE_SECTION_KEY) return section;
    if (!Array.isArray(section.subsections)) return section;

    // After re-banding subsections, recompute the section's percentage as
    // the mean of subsection percentages (re-banding doesn't change the
    // percentage itself, but doing this here keeps the recompute pipeline
    // explicit per Prompt-5 Step 6).
    const rebanded = section.subsections.map(rebandAptitudeSubsection);
    const percentageValues = rebanded
      .map((sub) => Number(sub.percentage))
      .filter(Number.isFinite);
    const sectionPercentage = percentageValues.length
      ? Math.round(
          percentageValues.reduce((sum, v) => sum + v, 0) /
            percentageValues.length
        )
      : null;

    return {
      ...section,
      subsections: rebanded,
      percentage: sectionPercentage,
      score: sectionPercentage,
    };
  });

export const scoreCareer500QDemoPackage = (answers = {}, sections = []) => {
  // The demo runs the same scoring engine on a curated 50-question subset.
  // After the Prompt-5 fix to the inner scorer, denominators and section
  // completion already report against the *assigned* counts, so the
  // wrapper's job is mainly to re-band aptitude with demo-friendly
  // thresholds, recompute the dependent aggregates IN ORDER, and stamp
  // the demo metadata last.
  const result = scoreCareer500QPackage(answers, sections);
  if (!result) return null;

  // Step 1: re-band aptitude subsection scores using demo percentage
  // bands and update Section 4's section-level percentage from the
  // re-banded subsections.
  const rebandedBreakdown = rebandSectionBreakdown(result.sectionBreakdown);

  // Step 2: recompute the overall score using the weighted formula
  // against the re-banded section breakdown.
  const overallScore = computeWeightedOverallScore(rebandedBreakdown);

  // Step 3: recompute completedSections + completionStatus from the
  // re-banded breakdown. With the inner scorer's correct denominators,
  // a section is "completed" when none of its subsections are flagged
  // incomplete — but we recompute here to overwrite whatever the inner
  // scorer set, per Prompt-5 Step 6.
  const completedSections = rebandedBreakdown.filter(
    (section) => section.status !== "incomplete"
  ).length;
  const totalSections = rebandedBreakdown.length;
  const completionStatus =
    totalSections > 0 && completedSections >= totalSections
      ? "Complete"
      : "Incomplete";

  // Step 4: re-run matchCareers using the updated (post-rebanding)
  // aptitude scores. The named buckets themselves don't change from
  // re-banding (percentages are unchanged) but doing this explicitly
  // ensures any future band-derived signal flows through.
  const demoCareerRecommendations = matchCareers(
    {
      hollandProfile: result.hollandProfile,
      multipleIntelligences: result.multipleIntelligences,
      aptitudeScores: result.aptitudeScores,
      eqProfile: result.eqProfile,
    },
    DEMO_TOP_N
  );

  // Step 5: stamp the demo metadata LAST so nothing downstream can
  // clobber it.
  return {
    ...result,
    sectionBreakdown: rebandedBreakdown,
    overallScore,
    overallPercentile: `Top ${Math.max(8, 100 - Number(overallScore || 0))}% profile strength`,
    completedSections,
    totalSections,
    completionStatus,
    careerRecommendations: demoCareerRecommendations,
    careerPathwaysCount: demoCareerRecommendations.length,
    metadata: {
      ...(result.metadata || {}),
      algorithmKey: DEMO_ALGORITHM_KEY,
      packageId: DEMO_PACKAGE_ID,
      overallMaxScore: 100,
      scoringGuideSources: [
        ...(result.metadata?.scoringGuideSources || []),
        "demo: 50-question curated subset of complete-aptitude-500q",
      ],
    },
  };
};

export default scoreCareer500QDemoPackage;
