import { formatScoreValue } from "../../data/adminReview";
import ResultStatusBadge from "./ResultStatusBadge";

const getBreakdownStatusLabel = (status) => {
  if (status === "review_required") return "Review Required";
  if (status === "completed") return "Completed";
  return "Incomplete";
};

const SCORE_BAND_LABELS = new Set(["High", "Moderate", "Low"]);
const SUBSECTION_PREFIX_PATTERN = /^\d+(?:\.\d+)*\s*/;

const getDisplayLabel = (label) =>
  String(label || "").replace(SUBSECTION_PREFIX_PATTERN, "").trim();

const getLikertAverage = (item) => {
  if (Number.isFinite(Number(item?.average))) {
    return Number(item.average);
  }

  const percentage = Number(item?.percentage);
  if (Number.isFinite(percentage)) {
    return 1 + (percentage / 100) * 4;
  }

  return null;
};

const getDerivedInterpretationLabel = (item) => {
  const label = getDisplayLabel(item?.label);
  if (!label) return "";

  const band = String(item?.band || "").trim();
  if (SCORE_BAND_LABELS.has(band)) {
    if (item?.key === "neuroticism") return `${band} Neuroticism`;
    return `${band} ${label}`;
  }

  const average = getLikertAverage(item);
  if (!Number.isFinite(average)) return "";

  if (item?.key === "neuroticism") {
    if (average <= 2) return "Low Neuroticism";
    if (average < 4) return "Moderate Neuroticism";
    return "High Neuroticism";
  }

  if (average >= 4) return `High ${label}`;
  if (average >= 3) return `Moderate ${label}`;
  return `Low ${label}`;
};

const getInterpretationText = (item) =>
  getDerivedInterpretationLabel(item) ||
  item?.interpretation ||
  item?.description ||
  "Interpretation unavailable for this subsection.";

const getSecondaryDescription = (item, primaryText) =>
  [item?.interpretation, item?.description]
    .map((value) => String(value || "").trim())
    .find((value) => value && value !== primaryText) || "";

const getScoreDisplay = (subsection) => {
  if (subsection.scoreType === "average") {
    return {
      label: "Average",
      value:
        subsection.average == null
          ? "Review required"
          : `${formatScoreValue(subsection.average)} / 5`,
      meta:
        subsection.percentage == null
          ? subsection.band || ""
          : `${formatScoreValue(subsection.percentage)}%`,
    };
  }

  if (subsection.scoreType === "profile_consistency") {
    return {
      label: "Profile",
      value: subsection.band || "Review required",
      meta:
        subsection.percentage == null
          ? "Awaiting review"
          : `${formatScoreValue(subsection.percentage)}% consistency`,
    };
  }

  if (subsection.scoreType === "review_only") {
    return {
      label: "Review",
      value: "Manual review",
      meta: subsection.questionRangeLabel || "",
    };
  }

  return {
    label: "Score",
    value:
      subsection.score == null
        ? "Review required"
        : `${formatScoreValue(subsection.score)} / ${formatScoreValue(
            subsection.maxScore
          )}`,
    meta:
      subsection.percentage == null
        ? subsection.band || ""
        : `${formatScoreValue(subsection.percentage)}%`,
  };
};

export default function SubsectionBreakdownList({
  subsections = [],
  nested = false,
}) {
  if (!subsections.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#D8E6EC] bg-[#FBFCFD] px-3 py-4 text-[13px] text-[#65758B] sm:rounded-[20px] sm:px-4 sm:py-5 sm:text-sm">
        No subsection data available for this section.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subsections.map((subsection) => {
        const scoreDisplay = getScoreDisplay(subsection);
        const interpretationText = getInterpretationText(subsection);
        const secondaryDescription = getSecondaryDescription(
          subsection,
          interpretationText
        );
        const displayLabel = getDisplayLabel(subsection.label);
        return (
          <div
            key={subsection.id || subsection.key || subsection.label}
            className={`rounded-[16px] border border-[#E6EEF2] ${
              nested ? "bg-white" : "bg-[#FBFCFD]"
            } px-3 py-3 sm:rounded-[20px] sm:px-4 sm:py-4`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <p className="text-[14px] font-semibold leading-5 text-[#0F1729] sm:text-sm sm:leading-6">
                    {displayLabel}
                  </p>
                  <ResultStatusBadge status={getBreakdownStatusLabel(subsection.status)} />
                  {subsection.band && subsection.scoreType !== "profile_consistency" ? (
                    <span className="rounded-full bg-[#EAFBFB] px-2.5 py-1 text-[10px] font-semibold text-[#188B8B] sm:px-3 sm:text-[11px]">
                      {subsection.band}
                    </span>
                  ) : null}
                </div>

                {subsection.questionRangeLabel ? (
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A94A6] sm:mt-2 sm:text-xs sm:tracking-[0.12em]">
                    Question Pool: {subsection.questionRangeLabel}
                  </p>
                ) : null}

                <div className="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A94A6] sm:text-xs sm:tracking-[0.12em]">
                      Interpretation
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#4E5D72] sm:text-sm sm:leading-7">
                      {interpretationText}
                    </p>
                    {secondaryDescription ? (
                      <p className="mt-1.5 text-[13px] leading-6 text-[#8A94A6] sm:mt-2 sm:text-sm sm:leading-7">
                        {secondaryDescription}
                      </p>
                    ) : null}
                  </div>

                </div>
              </div>

              <div className="w-full rounded-[14px] bg-white px-3 py-2.5 text-left shadow-sm sm:min-w-[170px] sm:w-auto sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A94A6] sm:text-xs sm:tracking-[0.12em]">
                  {scoreDisplay.label}
                </p>
                <p className="mt-1 text-[18px] font-bold text-[#0F1729] sm:text-lg">
                  {scoreDisplay.value}
                </p>
                {scoreDisplay.meta ? (
                  <p className="mt-1 text-[10px] font-semibold text-[#188B8B] sm:text-xs">
                    {scoreDisplay.meta}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
