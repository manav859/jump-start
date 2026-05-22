import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Download,
  Sparkles,
  Target,
} from "lucide-react";
import api from "../api/api";
import ResultPendingPanel from "../components/ResultPendingPanel";
import SectionBreakdownCard from "../components/admin/SectionBreakdownCard";
import StatusPill from "../components/results/StatusPill";
import usePrintableDocument from "../hooks/usePrintableDocument";
import {
  formatStudentDate,
  getResultMeta,
  normalizeStudentReportPayload,
} from "../data/studentResults";
import { getCareerDetailContent } from "../data/careerDetails";

const fallbackStrengths = [
  {
    name: "Structured Thinking",
    value: 0,
    desc: "Strength highlights will appear here as more report data is available.",
  },
];

export default function StudentReport() {
  const { t } = useTranslation();
  const { reportId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(() =>
    normalizeStudentReportPayload({})
  );
  const { isPreparingPrint, printDocument } = usePrintableDocument();

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      setError("Result report not found.");
      return;
    }

    setLoading(true);
    api
      .get(`/v1/user/results/${reportId}`)
      .then((res) => {
        setPayload(normalizeStudentReportPayload(res?.data?.data || {}));
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load this report.");
      })
      .finally(() => setLoading(false));
  }, [reportId]);

  const report = payload.report;
  const statusMeta = getResultMeta("result", payload.resultStatus);
  const sectionBreakdown = Array.isArray(report?.sectionBreakdown)
    ? report.sectionBreakdown
    : [];
  const strengths = useMemo(() => {
    if (Array.isArray(report?.strengths) && report.strengths.length) {
      return report.strengths;
    }
    return fallbackStrengths;
  }, [report?.strengths]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <p className="text-[#65758B]">{t("loading.report")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <div className="surface-card w-full max-w-2xl rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">{t("report.unavailableHeading")}</h1>
          <p className="mt-3 text-[#65758B]">{error}</p>
          <Link to="/result" className="primary-btn mt-6">
            {t("report.backToResults")}
          </Link>
        </div>
      </div>
    );
  }

  if (!payload.hasAccess) {
    return (
      <ResultPendingPanel
        heading={t("report.underReviewHeading")}
        description={t("report.underReviewBody")}
      />
    );
  }

  const handleDownload = () => {
    void printDocument();
  };

  return (
    <div className="report-print-page bg-[#F7F8FA]">
      <div className="report-print-root mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {report?.isDemo ? (
          <div className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#F5D9A6] bg-[#FFF9EE] px-5 py-4 text-[#8C5A00] sm:rounded-[22px] sm:px-6">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#F59F0A]" />
            <div>
              <p className="text-sm font-semibold text-[#0F1729]">
                {t("result.demoBannerTitle")}
              </p>
              <p className="mt-1 text-sm leading-6">
                {t("result.demoBannerBody")}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/result"
              className="report-print-hidden inline-flex items-center gap-2 text-sm font-semibold text-[#4E5D72] hover:text-[#188B8B]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("report.backToResults")}
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="text-[28px] font-bold leading-9 text-[#0F1729] sm:text-4xl">
                {report?.packageTitle || "Assessment Report"}
              </h1>
              <StatusPill label={statusMeta.label} className={statusMeta.className} />
            </div>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#65758B] sm:text-base sm:leading-8">
              Detailed score report for {report?.student?.name || "your assessment"}.
              Review your overall performance, strengths, and section-wise breakdown.
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-[#65758B] sm:gap-5 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#188B8B]" />
                {t("report.submittedOn", { date: formatStudentDate(report?.submittedAt) })}
              </span>
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#188B8B]" />
                {t("report.attempt", { number: report?.attemptNumber || 1 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="report-print-hidden inline-flex items-center justify-center gap-2 rounded-full border border-[#B6DFE4] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#188B8B] hover:bg-[#F6FDFC] sm:px-5 sm:py-3 sm:text-sm"
          >
            <Download className="h-4 w-4" />
            {t("result.downloadReport")}
          </button>
        </div>

        <section className="surface-card report-print-card mt-8 rounded-[22px] p-4 sm:rounded-[30px] sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] bg-[#F1FCF5] px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5">
              <p className="text-[13px] font-semibold text-[#65758B] sm:text-sm">Completed Sections</p>
              <p className="mt-2 text-3xl font-bold text-[#1D7D46] sm:mt-3 sm:text-4xl">
                {report?.summary?.completedSections ?? 0}/{report?.summary?.totalSections ?? 0}
              </p>
              <p className="mt-2 text-[11px] text-[#8A94A6] sm:text-xs">
                {report?.summary?.completionStatus || "Completed"}
              </p>
            </div>

            <div className="rounded-[18px] bg-[#FBFCFD] px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5">
              <p className="text-[13px] font-semibold text-[#65758B] sm:text-sm">Report Status</p>
              <p className="mt-2 text-[22px] font-bold text-[#0F1729] sm:mt-3 sm:text-2xl">
                {statusMeta.label}
              </p>
              <p className="mt-2 text-[11px] text-[#8A94A6] sm:text-xs">
                Published on {formatStudentDate(report?.approvedAt)}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <section className="surface-card report-print-card self-start rounded-[22px] p-5 sm:rounded-[30px] sm:p-7">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="rounded-[16px] bg-[#EAFBFB] p-2.5 text-[#188B8B] sm:rounded-2xl sm:p-3">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
                  {t("result.strengthsTitle")}
                </h2>
                <p className="mt-1 text-[13px] text-[#65758B] sm:text-sm">
                  {t("result.strengthsSubtitle")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
              {strengths.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[#0F1729] sm:text-sm">
                      {item.name}
                    </p>
                    <p className="text-[13px] font-semibold text-[#188B8B] sm:text-sm">
                      {item.value ?? 0}%
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#65758B] sm:text-xs sm:leading-6">
                    {item.desc || "A highlighted capability from your result profile."}
                  </p>
                  <div className="mt-2.5 h-2 rounded-full bg-[#DCE9EE] sm:mt-3 sm:h-2.5">
                    <div
                      className="h-2 rounded-full bg-[#188B8B] sm:h-2.5"
                      style={{ width: `${Math.min(100, item.value || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="surface-card report-print-card rounded-[22px] bg-[linear-gradient(180deg,#FFF8EA_0%,#FFFFFF_100%)] p-5 sm:rounded-[30px] sm:p-7">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="rounded-[16px] bg-[#FFF1D3] p-2.5 text-[#F59F0A] sm:rounded-2xl sm:p-3">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#B86D00] sm:text-sm sm:tracking-[0.16em]">
                    Profile Summary
                  </p>
                  <h2 className="mt-1.5 text-[20px] font-bold text-[#0F1729] sm:mt-2 sm:text-2xl">
                    {report?.personalityType?.code || "Assessment Summary"}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-[17px] font-semibold text-[#0F1729] sm:text-lg">
                {report?.personalityType?.title || "Result Highlights"}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-[#65758B] sm:text-sm sm:leading-7">
                {report?.personalityType?.description ||
                  report?.reviewSummary?.observations?.[0] ||
                  "Detailed personality and interpretation signals will appear here when available."}
              </p>

              <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                {(report?.personalityType?.traits || []).length ? (
                  report.personalityType.traits.map((trait) => (
                    <div
                      key={trait.name}
                      className="flex items-center justify-between rounded-[16px] bg-white/80 px-3.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3"
                    >
                      <span className="text-[13px] text-[#65758B] sm:text-sm">{trait.name}</span>
                      <span className="text-[13px] font-semibold text-[#0F1729] sm:text-sm">
                        {trait.value ?? 0}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] bg-white/80 px-4 py-4 text-[13px] text-[#65758B] sm:rounded-2xl sm:text-sm">
                    Additional personality traits will appear here when they are part of the report output.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="surface-card report-print-card report-print-page-break-before mt-6 rounded-[22px] p-5 sm:rounded-[30px] sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
                {t("result.topCareerMatches")}
              </h2>
              <p className="mt-1 text-[13px] leading-6 text-[#65758B] sm:text-sm">
                {t("result.topCareerMatchesSubtitle")}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {(report?.careerRecommendations || []).length ? (
              report.careerRecommendations.map((career, index) => {
                const matchValue =
                  career.score != null
                    ? career.score
                    : career.matchPercent != null
                      ? career.matchPercent
                      : 0;
                const reasons = career.matchReasons || {};
                const hasReasons =
                  reasons.holland ||
                  reasons.intelligence ||
                  reasons.aptitude ||
                  reasons.eq;
                return (
                  <div
                    key={`${career.title}-${index}`}
                    className="rounded-[14px] border border-[#E1E7EF] bg-white px-4 py-3.5 sm:rounded-[18px] sm:px-5 sm:py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-[15px] font-semibold leading-6 text-[#0F1729] sm:text-base">
                        {career.title}
                      </h3>
                      <span className="rounded-full bg-[#E2F8F7] px-2.5 py-0.5 text-[10px] font-semibold text-[#188B8B]">
                        {Math.round(matchValue)}% Match
                      </span>
                      {career.category ? (
                        <span className="rounded-full border border-[#D9E5EC] px-2.5 py-0.5 text-[10px] font-semibold text-[#4E5D72]">
                          {career.category}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E6EEF2]">
                      <div
                        className="h-1.5 rounded-full bg-[#188B8B]"
                        style={{
                          width: `${Math.min(100, Math.max(0, matchValue))}%`,
                        }}
                      />
                    </div>
                    {hasReasons ? (
                      <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-[#4E5D72] sm:text-[13px]">
                        {reasons.holland ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonInterests")}:
                            </span>{" "}
                            {reasons.holland}
                          </li>
                        ) : null}
                        {reasons.intelligence ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonIntelligence")}:
                            </span>{" "}
                            {reasons.intelligence}
                          </li>
                        ) : null}
                        {reasons.aptitude ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonAptitude")}:
                            </span>{" "}
                            {reasons.aptitude}
                          </li>
                        ) : null}
                        {reasons.eq ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonEq")}:
                            </span>{" "}
                            {reasons.eq}
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                    <div className="report-print-hidden mt-3 flex justify-end">
                      <Link
                        to={`/careerdetail?career=${encodeURIComponent(career.title || "")}`}
                        state={{ career }}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#188B8B] hover:underline"
                      >
                        {t("result.viewDetails")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] bg-[#F8FAFC] px-4 py-4 text-[13px] text-[#65758B] sm:text-sm">
                {t("result.noCareerRecommendations")}
              </div>
            )}
          </div>
        </section>

        {/* Print-only "Your Career Profiles" — one full detail page per
            recommended career. Hidden on screen via `report-print-only`;
            revealed by @media print and by the body class our Download
            button toggles. Each career block uses
            `report-print-career-page` so the printer breaks after it. */}
        {(report?.careerRecommendations || []).length ? (
          <section className="report-print-only report-print-page-break-before mt-6 hidden">
            <header className="mb-4">
              <h2 className="text-[22px] font-bold leading-8 text-[#0F1729]">
                {t("report.yourCareerProfiles")}
              </h2>
              <p className="mt-1 text-[13px] leading-6 text-[#65758B]">
                {t("report.yourCareerProfilesSubtitle")}
              </p>
            </header>

            {report.careerRecommendations.map((career, index) => {
              const detail = getCareerDetailContent(career);
              const matchValue =
                detail.score != null
                  ? detail.score
                  : detail.matchPercent != null
                    ? detail.matchPercent
                    : 0;
              const reasons = detail.matchReasons || {};
              const hasReasons =
                reasons.holland ||
                reasons.intelligence ||
                reasons.aptitude ||
                reasons.eq;
              const fallbackOverview = `This career involves work in ${
                detail.category || "this field"
              }. Recommended educational pathway: research degree programs aligned with ${
                detail.aptitudeStrengths?.length
                  ? detail.aptitudeStrengths.join(", ")
                  : "your measured aptitude strengths"
              }.`;
              const overviewText = detail.overview || fallbackOverview;
              const workEnvironment = detail.companies?.length
                ? `Common employers include ${detail.companies
                    .slice(0, 5)
                    .join(", ")}.`
                : "Typical work environments span organisations large and small that hire for this skill set.";
              const outlook = detail.outlook || {};
              return (
                <article
                  key={`profile-${detail.title}-${index}`}
                  className="report-print-career-page rounded-[18px] border border-[#E1E7EF] bg-white px-5 py-5"
                  style={{ marginBottom: "16px" }}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[18px] font-bold leading-7 text-[#0F1729]">
                      {detail.title}
                    </h3>
                    <span className="rounded-full bg-[#E2F8F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#188B8B]">
                      {Math.round(matchValue)}% Match
                    </span>
                    {detail.category ? (
                      <span className="rounded-full border border-[#D9E5EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#4E5D72]">
                        {detail.category}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E6EEF2]">
                    <div
                      className="h-2 rounded-full bg-[#188B8B]"
                      style={{
                        width: `${Math.min(100, Math.max(0, matchValue))}%`,
                      }}
                    />
                  </div>

                  {hasReasons ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                        {t("result.whyMatched")}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#4E5D72]">
                        {reasons.holland ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonInterests")}:
                            </span>{" "}
                            {reasons.holland}
                          </li>
                        ) : null}
                        {reasons.intelligence ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonIntelligence")}:
                            </span>{" "}
                            {reasons.intelligence}
                          </li>
                        ) : null}
                        {reasons.aptitude ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonAptitude")}:
                            </span>{" "}
                            {reasons.aptitude}
                          </li>
                        ) : null}
                        {reasons.eq ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("result.matchReasonEq")}:
                            </span>{" "}
                            {reasons.eq}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                      {t("report.careerOverview")}
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[#4E5D72]">
                      {overviewText}
                    </p>
                  </div>

                  {detail.skills?.length ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                        {t("report.keySkills")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {detail.skills.slice(0, 8).map((skill) => (
                          <span
                            key={`${detail.title}-skill-${skill}`}
                            className="rounded-full bg-[#157A7A] px-2.5 py-0.5 text-[10px] font-semibold text-white"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                      {t("report.workEnvironment")}
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[#4E5D72]">
                      {workEnvironment}
                    </p>
                  </div>

                  {detail.education?.length ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                        {t("report.educationPathway")}
                      </p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-6 text-[#4E5D72]">
                        {detail.education.map((line, eduIndex) => (
                          <li key={`${detail.title}-edu-${eduIndex}`}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Number.isFinite(Number(outlook.marketDemand)) ||
                  Number.isFinite(Number(outlook.jobSatisfaction)) ||
                  Number.isFinite(Number(outlook.workLifeBalance)) ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A94A6]">
                        {t("report.growthOutlook")}
                      </p>
                      <ul className="mt-2 grid gap-2 text-[12px] leading-6 text-[#4E5D72] sm:grid-cols-3">
                        {Number.isFinite(Number(outlook.marketDemand)) ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("report.marketDemand")}:
                            </span>{" "}
                            {Math.round(Number(outlook.marketDemand))}%
                          </li>
                        ) : null}
                        {Number.isFinite(Number(outlook.jobSatisfaction)) ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("report.jobSatisfaction")}:
                            </span>{" "}
                            {Math.round(Number(outlook.jobSatisfaction))}%
                          </li>
                        ) : null}
                        {Number.isFinite(Number(outlook.workLifeBalance)) ? (
                          <li>
                            <span className="font-semibold text-[#0F1729]">
                              {t("report.workLifeBalance")}:
                            </span>{" "}
                            {Math.round(Number(outlook.workLifeBalance))}%
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        <section className="surface-card report-print-card report-print-page-break-before mt-6 rounded-[22px] p-5 sm:rounded-[30px] sm:p-7">
          <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
            {t("result.keyObservations")}
          </h2>
          <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            {(report?.reviewSummary?.observations || []).length ? (
              report.reviewSummary.observations.map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] bg-[#F8FAFC] px-4 py-3.5 text-[13px] leading-6 text-[#4E5D72] sm:rounded-2xl sm:py-4 sm:text-sm sm:leading-7"
                >
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-4 text-[13px] text-[#65758B] sm:rounded-2xl sm:text-sm">
                {t("result.noObservations")}
              </div>
            )}
          </div>
        </section>

        <section className="surface-card report-print-card report-print-page-break-before mt-8 rounded-[24px] p-5 sm:rounded-[30px] sm:p-7">
          <div>
            <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
              {t("result.sectionBreakdownTitle")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#65758B]">
              {t("result.sectionBreakdownSubtitle")}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {sectionBreakdown.length ? (
              sectionBreakdown.map((section, index) => (
                <SectionBreakdownCard
                  key={section.sectionId || section.title}
                  section={section}
                  defaultOpen={index === 0}
                  forceOpen={isPreparingPrint}
                />
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#D8E6EC] bg-[#FBFCFD] px-5 py-8 text-center text-sm text-[#65758B]">
                {t("result.noBreakdown")}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
