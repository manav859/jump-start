import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
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

const fallbackStrengths = [
  {
    name: "Structured Thinking",
    value: 0,
    desc: "Strength highlights will appear here as more report data is available.",
  },
];

export default function StudentReport() {
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
        <p className="text-[#65758B]">Loading your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <div className="surface-card w-full max-w-2xl rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">Report Unavailable</h1>
          <p className="mt-3 text-[#65758B]">{error}</p>
          <Link to="/result" className="primary-btn mt-6">
            Back to My Results
          </Link>
        </div>
      </div>
    );
  }

  if (!payload.hasAccess) {
    return (
      <ResultPendingPanel
        heading="Report Is Under Review"
        description="This test has been submitted successfully, but the published report will appear only after admin approval."
      />
    );
  }

  const handleDownload = () => {
    void printDocument();
  };

  return (
    <div className="report-print-page bg-[#F7F8FA]">
      <div className="report-print-root mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/result"
              className="report-print-hidden inline-flex items-center gap-2 text-sm font-semibold text-[#4E5D72] hover:text-[#188B8B]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Results
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
                Submitted: {formatStudentDate(report?.submittedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#188B8B]" />
                Attempt {report?.attemptNumber || 1}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="report-print-hidden inline-flex items-center justify-center gap-2 rounded-full border border-[#B6DFE4] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#188B8B] hover:bg-[#F6FDFC] sm:px-5 sm:py-3 sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>

        <section className="surface-card report-print-card mt-8 rounded-[22px] p-4 sm:rounded-[30px] sm:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[18px] bg-[#F7FBFB] px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5">
              <p className="text-[13px] font-semibold text-[#65758B] sm:text-sm">Overall Score</p>
              <p className="mt-2 text-3xl font-bold text-[#188B8B] sm:mt-3 sm:text-4xl">
                {report?.summary?.overallScore ?? "-"} / {report?.summary?.maxScore ?? 100}
              </p>
              <p className="mt-2 text-[11px] text-[#8A94A6] sm:text-xs">
                structured report score
              </p>
            </div>

            <div className="rounded-[18px] bg-[#FFF9EE] px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5">
              <p className="text-[13px] font-semibold text-[#65758B] sm:text-sm">Percentage</p>
              <p className="mt-2 text-3xl font-bold text-[#F59F0A] sm:mt-3 sm:text-4xl">
                {report?.summary?.percentage ?? "-"}%
              </p>
              <p className="mt-2 text-[11px] text-[#8A94A6] sm:text-xs">
                {report?.summary?.overallPercentile || "Score-based summary"}
              </p>
            </div>

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
                  Strengths and Skills
                </h2>
                <p className="mt-1 text-[13px] text-[#65758B] sm:text-sm">
                  Highlighted capabilities based on your submitted answers.
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

        <section className="surface-card report-print-card mt-6 rounded-[22px] p-5 sm:rounded-[30px] sm:p-7">
          <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
            Key Observations
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
                No additional observations were attached to this report.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card report-print-card mt-8 rounded-[24px] p-5 sm:rounded-[30px] sm:p-7">
          <div>
            <h2 className="text-[20px] font-bold leading-8 text-[#0F1729] sm:text-2xl">
              Section-wise Breakdown
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#65758B]">
              Review each major section separately, including subsection-level scoring wherever available.
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
                No section breakdown is available for this report yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
