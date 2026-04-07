import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Brain,
  ClipboardCheck,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import api from "../../api/api";
import { normalizeAdminReviewData } from "../../data/adminReview";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import StudentInfoCard from "../../components/admin/StudentInfoCard";
import OverallScoreSummaryCard from "../../components/admin/OverallScoreSummaryCard";
import SectionBreakdownCard from "../../components/admin/SectionBreakdownCard";
import ReviewActionBar from "../../components/admin/ReviewActionBar";
import ResultStatusBadge from "../../components/admin/ResultStatusBadge";
import { emitAdminNotificationsRefresh } from "../../utils/adminNotifications";
import { ReviewSkeleton } from "../../components/admin/Skeletons";

const chipClass =
  "rounded-full border border-[#D7E7EC] bg-white px-3 py-1 text-xs font-semibold text-[#4E5D72]";

export default function ReviewSubmission() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    api
      .get(`/v1/admin/submissions/${userId}`)
      .then((res) => {
        setDetail(normalizeAdminReviewData(res?.data?.data || {}));
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load submission review.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const sectionCards = useMemo(
    () => (Array.isArray(detail?.sectionBreakdown) ? detail.sectionBreakdown : []),
    [detail]
  );

  const handleApprove = async () => {
    if (!detail?.actions?.canApprove || !userId) return;
    setError("");
    setApproving(true);
    try {
      await api.patch(`/v1/admin/results/${userId}/approve`);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "approved",
              statusLabel: "Published",
              summary: {
                ...prev.summary,
                statusLabel: "Published",
                reportsReady: Math.max(1, Number(prev.summary?.reportsReady || 0)),
              },
              actions: {
                ...prev.actions,
                canApprove: false,
                canPublish: false,
              },
            }
          : prev
      );
      emitAdminNotificationsRefresh();
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to publish this result.");
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!detail?.actions?.canDelete || !userId) return;
    const confirmed = window.confirm(
      "Delete this reviewed submission and remove its result from the workflow?"
    );
    if (!confirmed) return;

    setError("");
    setDeleting(true);
    try {
      await api.delete(`/v1/admin/results/${userId}`);
      emitAdminNotificationsRefresh();
      navigate("/admin/testsubmissions");
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to delete this result.");
      setDeleting(false);
    }
  };

  if (loading) {
    return <ReviewSkeleton />;
  }

  if (error && !detail) {
    return (
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="surface-card rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">Review Unavailable</h1>
          <p className="mt-3 text-[#65758B]">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/testsubmissions")}
            className="primary-btn mt-6"
          >
            Back to Test Submission
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <AdminPageHeader
        title="Review Submitted Test"
        subtitle="Inspect the student's details, section performance, subsection scores, and result analysis before publishing the report."
        backTo="/admin/testsubmissions"
        backLabel="Back to Test Submission"
        actions={
          detail ? <ResultStatusBadge status={detail.statusLabel} /> : null
        }
      />

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.88fr)]">
        <StudentInfoCard
          student={detail?.student}
          statusLabel={detail?.statusLabel}
        />
        <OverallScoreSummaryCard summary={detail?.summary} />
      </div>

      <section className="surface-card mt-8 rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
              Section-Wise Breakdown
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#0F1729]">
              Review all completed sections
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#65758B]">
              Each section includes a score summary and nested subsection performance
              where data is available.
            </p>
          </div>
          <div className="rounded-full bg-[#F6FDFC] px-4 py-2 text-sm font-semibold text-[#188B8B]">
            {sectionCards.length} sections
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sectionCards.length ? (
            sectionCards.map((section, index) => (
              <SectionBreakdownCard
                key={section.sectionId || section.title}
                section={section}
                defaultOpen={index === 0}
              />
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#D8E6EC] bg-[#FBFCFD] px-5 py-8 text-center text-sm text-[#65758B]">
              No section breakdown is available for this submission yet.
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="surface-card rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
                Review Notes
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#0F1729]">
                Result / Analysis / Review Area
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#E5EEF2] bg-[#FBFCFD] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FFF6DF] p-2.5 text-[#F59F0A]">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1729]">Observations</h3>
              </div>
              <div className="mt-4 space-y-3">
                {(detail?.analysis?.reviewSummary?.observations || []).length ? (
                  detail.analysis.reviewSummary.observations.map((item) => (
                    <div key={item} className="rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-[#4E5D72] shadow-sm">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#65758B]">
                    No written observations are available for this submission.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E5EEF2] bg-[#FBFCFD] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EAFBFB] p-2.5 text-[#188B8B]">
                  <Target className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1729]">Readiness State</h3>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-[18px] bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                    Review Status
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#0F1729]">
                    {detail?.analysis?.reviewSummary?.statusLabel || "Ready for Review"}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                    Strongest Signals
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(detail?.analysis?.reviewSummary?.strongestSignals || []).length ? (
                      detail.analysis.reviewSummary.strongestSignals.map((item) => (
                        <span key={item} className={chipClass}>
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#65758B]">
                        No signal highlights available.
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                    Recommended Careers
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(detail?.analysis?.reviewSummary?.topCareerTitles || []).length ? (
                      detail.analysis.reviewSummary.topCareerTitles.map((item) => (
                        <span key={item} className={chipClass}>
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#65758B]">
                        No recommendation highlights available.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface-card rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
                  Personality Type
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0F1729]">
                  {detail?.analysis?.personalityType?.code || "Not available"}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold text-[#0F1729]">
              {detail?.analysis?.personalityType?.title || "Assessment profile pending"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[#65758B]">
              {detail?.analysis?.personalityType?.description ||
                "This submission does not yet include a published personality analysis."}
            </p>
          </section>

          <section className="surface-card rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#FFF6DF] p-3 text-[#F59F0A]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
                  Strengths & Matches
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0F1729]">
                  Evaluation Highlights
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                  Strengths
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(detail?.analysis?.strengths || []).length ? (
                    detail.analysis.strengths.slice(0, 5).map((item) => (
                      <span key={item.name} className={chipClass}>
                        {item.name} {item.value != null ? `(${item.value}%)` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#65758B]">
                      No strength breakdown available.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                  Top Career Recommendations
                </p>
                <div className="mt-3 space-y-3">
                  {(detail?.analysis?.careers || []).length ? (
                    detail.analysis.careers.slice(0, 3).map((career) => (
                      <div
                        key={career.title}
                        className="rounded-[20px] border border-[#E5EEF2] bg-[#FBFCFD] px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#0F1729]">
                            {career.title}
                          </p>
                          <span className="rounded-full bg-[#EAFBFB] px-3 py-1 text-xs font-semibold text-[#188B8B]">
                            {career.matchPercent ?? 0}% Match
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#65758B]">
                          {career.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-[#65758B]">
                      No career recommendations available.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8">
        <ReviewActionBar
          statusLabel={detail?.statusLabel}
          canApprove={detail?.actions?.canApprove}
          canDelete={detail?.actions?.canDelete}
          approving={approving}
          deleting={deleting}
          onApprove={handleApprove}
          onDelete={handleDelete}
          onBack={() => navigate("/admin/testsubmissions")}
        />
      </div>
    </main>
  );
}
