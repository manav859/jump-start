import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ImageOff,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  X,
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
  const [manualReview, setManualReview] = useState({
    loading: true,
    items: [],
    hasUnreviewedItems: false,
    completedAt: null,
    finalizing: false,
    decisionFor: "",
    notes: {},
    error: "",
    refreshedScores: null,
  });

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    Promise.all([
      api.get(`/v1/admin/submissions/${userId}`),
      api
        .get(`/v1/admin/results/${userId}/manual-review`)
        .catch(() => ({ data: { data: null } })),
    ])
      .then(([submission, review]) => {
        setDetail(normalizeAdminReviewData(submission?.data?.data || {}));
        const reviewData = review?.data?.data;
        if (reviewData) {
          setManualReview((prev) => ({
            ...prev,
            loading: false,
            items: Array.isArray(reviewData.manualReviewItems)
              ? reviewData.manualReviewItems
              : [],
            hasUnreviewedItems: Boolean(reviewData.hasUnreviewedItems),
            completedAt: reviewData.manualReviewCompletedAt || null,
            notes: Object.fromEntries(
              (reviewData.manualReviewItems || []).map((item) => [
                item.questionId,
                item.adminNote || "",
              ])
            ),
          }));
        } else {
          setManualReview((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load submission review.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const recordDecision = async (questionId, decision) => {
    if (!userId) return;
    setManualReview((prev) => ({
      ...prev,
      decisionFor: questionId,
      error: "",
    }));
    try {
      const note = manualReview.notes[questionId] || "";
      const res = await api.patch(
        `/v1/admin/results/${userId}/manual-review/${questionId}`,
        { decision, note }
      );
      const data = res?.data?.data || {};
      setManualReview((prev) => ({
        ...prev,
        decisionFor: "",
        hasUnreviewedItems: Boolean(data.hasUnreviewedItems),
        items: prev.items.map((item) =>
          item.questionId === questionId
            ? {
                ...item,
                adminDecision: data.adminDecision,
                adminNote: data.adminNote || null,
              }
            : item
        ),
      }));
      // Keep the detail-level flag in sync so the Approve button updates
      // without a full refetch.
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              manualReview: {
                ...(prev.manualReview || {}),
                hasUnreviewedItems: Boolean(data.hasUnreviewedItems),
              },
              actions: {
                ...prev.actions,
                canApprove:
                  prev.statusLabel === "Pending Approval" &&
                  !data.hasUnreviewedItems,
              },
            }
          : prev
      );
    } catch (err) {
      setManualReview((prev) => ({
        ...prev,
        decisionFor: "",
        error:
          err?.response?.data?.msg ||
          "Failed to save this decision. Please retry.",
      }));
    }
  };

  const undoDecision = async (questionId) => {
    // The backend treats null as "no decision". The simplest path is to
    // mark "incorrect" then ask the admin to redecide — but we don't have
    // a clear-decision endpoint per the spec, so we just set both buttons
    // back to active by clearing local state. The next finalize attempt
    // would re-block if it's still required, which keeps the data honest.
    setManualReview((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.questionId === questionId
          ? { ...item, adminDecision: null }
          : item
      ),
    }));
  };

  const handleFinalize = async () => {
    if (!userId) return;
    setManualReview((prev) => ({ ...prev, finalizing: true, error: "" }));
    try {
      const res = await api.post(
        `/v1/admin/results/${userId}/manual-review/complete`
      );
      const data = res?.data?.data || {};
      setManualReview((prev) => ({
        ...prev,
        finalizing: false,
        hasUnreviewedItems: false,
        completedAt: data.manualReviewCompletedAt || new Date().toISOString(),
        refreshedScores: {
          overallScore: data.overallScore,
          overallPercentile: data.overallPercentile,
          aptitudeScores: data.aptitudeScores || {},
          careerRecommendations: data.careerRecommendations || [],
        },
      }));
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              summary: {
                ...prev.summary,
                overallScore: data.overallScore ?? prev.summary?.overallScore,
                percentage:
                  data.overallScore != null
                    ? data.overallScore
                    : prev.summary?.percentage,
              },
              manualReview: {
                ...(prev.manualReview || {}),
                hasUnreviewedItems: false,
                completedAt: data.manualReviewCompletedAt,
              },
              actions: {
                ...prev.actions,
                canApprove: prev.statusLabel === "Pending Approval",
              },
            }
          : prev
      );
    } catch (err) {
      setManualReview((prev) => ({
        ...prev,
        finalizing: false,
        error:
          err?.response?.data?.msg ||
          "Failed to finalize manual review. Please retry.",
      }));
    }
  };

  const sectionCards = useMemo(
    () => (Array.isArray(detail?.sectionBreakdown) ? detail.sectionBreakdown : []),
    [detail]
  );

  const handleApprove = async () => {
    if (!userId) return;
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
      const data = err?.response?.data;
      if (data?.error === "MANUAL_REVIEW_PENDING") {
        setError(
          data.message ||
            "Complete manual review of flagged questions before approving this report."
        );
      } else {
        setError(data?.msg || "Failed to publish this result.");
      }
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

      {detail?.isDemo ? (
        <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[#F4DCA8] bg-[#FFF9EE] px-5 py-4 text-[#8C5A00] sm:rounded-[22px]">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#F59F0A]" />
          <div>
            <p className="text-sm font-semibold text-[#0F1729]">
              Demo Test — 50 questions.
            </p>
            <p className="mt-1 text-sm leading-6">
              Scores are proportional to the assigned question set, not the
              full 500-question bank.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.88fr)]">
        <StudentInfoCard
          student={detail?.student}
          statusLabel={detail?.statusLabel}
        />
        <OverallScoreSummaryCard
          summary={{
            ...(detail?.summary || {}),
            isDemo: Boolean(detail?.isDemo),
          }}
        />
      </div>

      <StudentProfileReviewBlock profile={detail?.student?.profile} />

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

      <ManualReviewSection
        manualReview={manualReview}
        setManualReview={setManualReview}
        onDecision={recordDecision}
        onUndo={undoDecision}
        onFinalize={handleFinalize}
      />

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
        {manualReview.hasUnreviewedItems ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F4DCA8] bg-[#FFF1D3] px-3 py-1.5 text-xs font-semibold text-[#B86D00]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Complete manual review first to enable Approve
          </div>
        ) : null}
        <ReviewActionBar
          statusLabel={detail?.statusLabel}
          canApprove={
            Boolean(detail?.actions?.canApprove) &&
            !manualReview.hasUnreviewedItems
          }
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

const formatProfileDate = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PROFILE_FIELD_DEFINITIONS = [
  { key: "dateOfBirth", label: "Date of Birth", format: formatProfileDate },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "schoolOrCollege", label: "School / College" },
  { key: "classOrGrade", label: "Class / Grade" },
  { key: "stream", label: "Stream" },
  { key: "board", label: "Board / University" },
  { key: "city", label: "City" },
  { key: "state", label: "State / UT" },
];

function StudentProfileReviewBlock({ profile }) {
  const safeProfile = profile || {};
  const hasAnyData = PROFILE_FIELD_DEFINITIONS.some((field) =>
    String(safeProfile[field.key] || "").trim()
  );

  return (
    <section className="surface-card mt-8 rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAFBFB] text-[#188B8B]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
              Student Profile
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#0F1729]">
              Background submitted by the student
            </h2>
            <p className="mt-1 text-sm leading-7 text-[#65758B]">
              Captured before the assessment began. Use this context when
              interpreting their results.
            </p>
          </div>
        </div>
        {safeProfile.isComplete ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#E2F8F7] px-3 py-1 text-xs font-semibold text-[#188B8B]">
            Complete
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFF1D3] px-3 py-1 text-xs font-semibold text-[#B86D00]">
            Incomplete
          </span>
        )}
      </div>

      {hasAnyData ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROFILE_FIELD_DEFINITIONS.map((field) => {
            const raw = safeProfile[field.key];
            const value = field.format
              ? field.format(raw)
              : raw && String(raw).trim()
                ? raw
                : "-";
            return (
              <div key={field.key}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7D8CA2]">
                  {field.label}
                </dt>
                <dd className="mt-1.5 rounded-2xl border border-[#E1E7EF] bg-white px-4 py-3 text-sm font-medium text-[#0F1729]">
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-6 rounded-2xl bg-[#F8FAFC] px-4 py-4 text-sm text-[#65758B]">
          The student submitted this test before the profile form was rolled
          out, so no structured profile data is attached.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Manual Review section — Section 4 image/diagram items with per-item
// correct/incorrect override + a finalize button that recalculates scoring.
// ---------------------------------------------------------------------------

const SUBSECTION_LABELS = {
  abstract_reasoning: "Abstract Reasoning",
  spatial_relations: "Spatial Relations",
  mechanical_reasoning: "Mechanical Reasoning",
};

const decisionBadgeClass = (decision) => {
  if (decision === "correct") {
    return "border-[#BEE7D1] bg-[#F1FCF5] text-[#1D7D46]";
  }
  if (decision === "incorrect") {
    return "border-[#F5D0D0] bg-[#FFF5F5] text-[#B42318]";
  }
  return "border-[#F4DCA8] bg-[#FFF1D3] text-[#B86D00]";
};

// Prompt-9 Fix 2: render every answer option side-by-side with the
// correct one highlighted green and the student's answer highlighted
// blue (or red if it differs from correct). Letter labels (A/B/C/D)
// come from the scorer; text is the option's full content.
const normaliseLetter = (value = "") => String(value || "").trim().toUpperCase();

function ManualReviewOptionList({ options = [], studentAnswer, correctAnswer }) {
  const student = normaliseLetter(studentAnswer);
  const correct = normaliseLetter(correctAnswer);
  const studentMissed = Boolean(student && correct && student !== correct);
  const list = Array.isArray(options) ? options : [];

  if (!list.length) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#D9E5EC] bg-[#FBFCFD] px-3 py-3 text-xs text-[#7D8CA2]">
        Option text isn't stored for this question. Student answered{" "}
        <span className="font-semibold text-[#0F1729]">
          {studentAnswer || "—"}
        </span>{" "}
        · Correct answer{" "}
        <span className="font-semibold text-[#1D7D46]">
          {correctAnswer || "—"}
        </span>
        .
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {list.map((option, index) => {
        const label = normaliseLetter(
          option?.label || String.fromCharCode(65 + index)
        );
        const isCorrect = label === correct;
        const isStudent = label === student;
        // Style precedence: correct (green) > student's wrong (red) >
        // student's confirmed-correct (already green) > student-only
        // (blue when no answer key) > neutral.
        let containerClass =
          "border-[#E1E7EF] bg-white text-[#4E5D72]";
        if (isCorrect) {
          containerClass = "border-[#BEE7D1] bg-[#F1FCF5] text-[#0F1729]";
        } else if (isStudent && studentMissed) {
          containerClass = "border-[#F5D0D0] bg-[#FFF5F5] text-[#0F1729]";
        } else if (isStudent) {
          containerClass = "border-[#BFDBFE] bg-[#EFF6FF] text-[#0F1729]";
        }
        return (
          <li
            key={`${label}-${index}`}
            className={`flex items-start gap-3 rounded-[12px] border px-3 py-2 ${containerClass}`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                isCorrect
                  ? "border-[#1D7D46] bg-[#1D7D46] text-white"
                  : isStudent
                    ? studentMissed
                      ? "border-[#B42318] bg-[#B42318] text-white"
                      : "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-[#D9E5EC] bg-white text-[#4E5D72]"
              }`}
            >
              {label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-5">
                {option?.text || "(no option text)"}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1D7D46] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Correct answer
                  </span>
                ) : null}
                {isStudent ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
                      studentMissed ? "bg-[#B42318]" : "bg-[#2563EB]"
                    }`}
                  >
                    Student answered
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ManualReviewItemCard({
  item,
  note,
  onNoteChange,
  onDecision,
  onUndo,
  isSaving,
}) {
  const decision = item.adminDecision;
  const decisionLabel =
    decision === "correct"
      ? "Marked Correct"
      : decision === "incorrect"
        ? "Marked Incorrect"
        : item.requiresManualReview
          ? "Pending"
          : "Auto-Graded";

  return (
    <div className="rounded-[20px] border border-[#E1E7EF] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F4F6F9] px-2.5 py-0.5 text-xs font-semibold text-[#4E5D72]">
              Q{item.questionId}
            </span>
            <span className="rounded-full border border-[#D7E7EC] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#4E5D72]">
              {SUBSECTION_LABELS[item.subsectionKey] || item.subsectionKey}
            </span>
            {item.requiresManualReview ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F4DCA8] bg-[#FFF1D3] px-2.5 py-0.5 text-[11px] font-semibold text-[#B86D00]">
                <AlertTriangle className="h-3 w-3" />
                Review required
              </span>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${decisionBadgeClass(decision)}`}
            >
              {decisionLabel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#0F1729]">
            {item.questionText || "(Question text not available)"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[14px] border border-[#E1E7EF] bg-[#FBFCFD]">
          {item.mediaUrl ? (
            <img
              src={item.mediaUrl}
              alt={`Question ${item.questionId} reference`}
              className="block h-auto w-full"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-[#7D8CA2]">
              <ImageOff className="h-5 w-5" />
              <p className="text-[11px] font-medium uppercase tracking-[0.1em]">
                No image
              </p>
              <p className="text-[11px] leading-4 text-center">
                Text-only or media unavailable
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Prompt-9 Fix 2: render the full options list with the correct
              answer highlighted green and the student's answer highlighted
              blue (or red if it differs from correct). Replaces the
              previous two-column "student / stored key" tile pair, which
              forced the admin to mentally map A/B/C back to text. */}
          <ManualReviewOptionList
            options={item.options}
            studentAnswer={item.studentAnswer}
            correctAnswer={item.correctAnswer}
          />

          <p className="text-xs text-[#7D8CA2]">
            {item.correctAnswer ? (
              <>
                Stored answer key:{" "}
                <span className="font-semibold text-[#1D7D46]">
                  {item.correctAnswer}
                </span>
                . Algorithm marked this{" "}
                <span
                  className={`font-semibold ${item.autoMarkedCorrect ? "text-[#1D7D46]" : "text-[#B42318]"}`}
                >
                  {item.autoMarkedCorrect ? "correct" : "incorrect"}
                </span>
                .
              </>
            ) : (
              <>
                <span className="font-semibold text-[#B42318]">
                  Answer key missing
                </span>{" "}
                — algorithm cannot grade. Admin decision is the source of
                truth for this question.
              </>
            )}
          </p>

          <div className="space-y-2">
            <label
              htmlFor={`note-${item.questionId}`}
              className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7D8CA2]"
            >
              Admin note (optional)
            </label>
            <input
              id={`note-${item.questionId}`}
              type="text"
              value={note}
              onChange={(e) => onNoteChange(item.questionId, e.target.value)}
              placeholder="e.g. Image rotated 90° — answer key matches anyway"
              className="w-full rounded-[10px] border border-[#D9E5EC] bg-white px-3 py-1.5 text-xs text-[#0F1729] focus:border-[#188B8B] focus:outline-none focus:ring-2 focus:ring-[#188B8B]/15"
              maxLength={500}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onDecision(item.questionId, "correct")}
              disabled={isSaving || decision === "correct"}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                decision === "correct"
                  ? "bg-[#1D7D46] text-white"
                  : "border border-[#BEE7D1] bg-white text-[#1D7D46] hover:bg-[#F1FCF5]"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              Mark Correct
            </button>
            <button
              type="button"
              onClick={() => onDecision(item.questionId, "incorrect")}
              disabled={isSaving || decision === "incorrect"}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                decision === "incorrect"
                  ? "bg-[#B42318] text-white"
                  : "border border-[#F5D0D0] bg-white text-[#B42318] hover:bg-[#FFF5F5]"
              }`}
            >
              <X className="h-3.5 w-3.5" />
              Mark Incorrect
            </button>
            {decision ? (
              <button
                type="button"
                onClick={() => onUndo(item.questionId)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D9E5EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#4E5D72] hover:bg-[#F8FAFC]"
              >
                Undo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualReviewSection({
  manualReview,
  setManualReview,
  onDecision,
  onUndo,
  onFinalize,
}) {
  const items = manualReview.items || [];
  const pending = items.filter(
    (item) => item.requiresManualReview && item.adminDecision == null
  );
  const completed = items.filter(
    (item) => item.requiresManualReview && item.adminDecision != null
  );

  const handleNoteChange = (questionId, value) => {
    setManualReview((prev) => ({
      ...prev,
      notes: { ...(prev.notes || {}), [questionId]: value },
    }));
  };

  return (
    <section className="surface-card mt-8 rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
            Manual Review
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#0F1729]">
            Verify flagged Section 4 questions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#65758B]">
            Image- and diagram-based aptitude items appear here. Override the
            algorithm's marking when the rendered image diverges from the
            stored answer key.
          </p>
        </div>
        <div className="text-right text-xs text-[#65758B]">
          {items.length ? (
            <>
              <p>
                <span className="font-semibold text-[#0F1729]">
                  {items.length}
                </span>{" "}
                flagged items
              </p>
              <p>
                <span className="font-semibold text-[#B86D00]">
                  {pending.length}
                </span>{" "}
                pending ·{" "}
                <span className="font-semibold text-[#1D7D46]">
                  {completed.length}
                </span>{" "}
                resolved
              </p>
            </>
          ) : null}
        </div>
      </div>

      {manualReview.error ? (
        <div className="mt-4 rounded-[14px] border border-[#F5D0D0] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
          {manualReview.error}
        </div>
      ) : null}

      {manualReview.loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#65758B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading manual-review queue...
        </div>
      ) : items.length === 0 ||
        items.every((item) => !item.requiresManualReview) ? (
        <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[#BEE7D1] bg-[#F1FCF5] px-5 py-4 text-sm text-[#1D7D46]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              All aptitude questions were graded automatically — no manual
              review required.
            </p>
            <p className="mt-1 text-[#4E5D72]">
              Manual review is only needed when a question's answer key is
              missing or ambiguous. Every Section&nbsp;4 question on this
              submission had a definitive answer key, so the algorithm
              scored them without admin input.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[#F4DCA8] bg-[#FFF9EE] px-5 py-4 text-sm text-[#8C5A00]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59F0A]" />
            <div>
              <p className="font-semibold text-[#0F1729]">
                {items.length} question{items.length === 1 ? "" : "s"} could not
                be auto-graded (answer key missing).
              </p>
              <p className="mt-1 text-[#65758B]">
                Please review each one below and mark it correct or incorrect.
                The aptitude subsection score will recalculate after you
                finalise the review.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <ManualReviewItemCard
                key={item.questionId}
                item={item}
                note={manualReview.notes?.[item.questionId] || ""}
                onNoteChange={handleNoteChange}
                onDecision={onDecision}
                onUndo={onUndo}
                isSaving={manualReview.decisionFor === item.questionId}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[20px] border border-[#E5EEF2] bg-[#FBFCFD] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F1729]">
                {pending.length === 0
                  ? "All flagged items decided — ready to recompute scores."
                  : `${pending.length} flagged item${pending.length === 1 ? "" : "s"} still need a decision.`}
              </p>
              <p className="mt-1 text-xs text-[#65758B]">
                Finalizing re-runs Section 4 scoring with your decisions and
                refreshes the career recommendations on this report.
              </p>
            </div>
            <button
              type="button"
              onClick={onFinalize}
              disabled={pending.length > 0 || manualReview.finalizing}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#188B8B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(24,139,139,0.18)] hover:bg-[#147070] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualReview.finalizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  Finalize Review & Recalculate Scores
                </>
              )}
            </button>
          </div>
        </>
      )}

      {manualReview.refreshedScores ? (
        <div className="mt-5 rounded-[20px] border border-[#D4EBEE] bg-[linear-gradient(180deg,#F7FDFD_0%,#FFFFFF_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
            Recomputed
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0F1729]">
            Updated scores after manual review
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[14px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,41,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7D8CA2]">
                Overall score
              </p>
              <p className="mt-1 text-2xl font-bold text-[#188B8B]">
                {manualReview.refreshedScores.overallScore ?? "—"}
              </p>
            </div>
            {Object.entries(manualReview.refreshedScores.aptitudeScores || {})
              .filter(([key]) =>
                ["Abstract", "Spatial Relations", "Mechanical"].includes(key)
              )
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-[14px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,41,0.04)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7D8CA2]">
                    {key}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#0F1729]">
                    {value != null ? `${Math.round(Number(value))}%` : "—"}
                  </p>
                </div>
              ))}
          </div>
          {(manualReview.refreshedScores.careerRecommendations || []).length ? (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7D8CA2]">
                Refreshed top careers
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {manualReview.refreshedScores.careerRecommendations
                  .slice(0, 5)
                  .map((career) => (
                    <span
                      key={career.title}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0F1729] shadow-[0_2px_8px_rgba(15,23,41,0.04)]"
                    >
                      {career.title}
                      <span className="rounded-full bg-[#E2F8F7] px-2 py-0.5 text-[10px] text-[#188B8B]">
                        {Math.round(Number(career.score || 0))}%
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {manualReview.completedAt && !manualReview.refreshedScores ? (
        <p className="mt-4 text-xs text-[#7D8CA2]">
          Manual review completed{" "}
          {new Date(manualReview.completedAt).toLocaleString("en-IN")}.
        </p>
      ) : null}
    </section>
  );
}
