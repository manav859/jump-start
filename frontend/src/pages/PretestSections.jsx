import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, FileText, PlayCircle } from "lucide-react";
import api from "../api/api";

const getAnsweredForSection = (sectionId, answers = {}) =>
  Object.keys(answers).filter((key) => key.startsWith(`${sectionId}-`)).length;

const getSectionState = (section, completedSet, progress) => {
  if (completedSet.has(Number(section.sectionId))) {
    return {
      label: "Completed",
      badgeClass: "bg-emerald-50 text-emerald-700",
      actionLabel: "Review Section",
      actionClass: "bg-[#0F1729] text-white hover:bg-[#1E293B]",
    };
  }

  const answered = getAnsweredForSection(section.sectionId, progress.answers || {});
  const isActiveSection =
    Number(progress.sectionId) === Number(section.sectionId) && answered > 0;

  if (isActiveSection) {
    return {
      label: "In Progress",
      badgeClass: "bg-amber-50 text-amber-700",
      actionLabel: "Resume Section",
      actionClass: "bg-[#F59F0A] text-[#0F1729] hover:bg-[#E89206]",
    };
  }

  return {
    label: "Not Started",
    badgeClass: "bg-slate-100 text-slate-700",
    actionLabel: "Start Section",
    actionClass: "bg-[#188B8B] text-white hover:bg-[#147979]",
  };
};

export default function PretestSections() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({
    sectionId: 1,
    completedSectionIds: [],
    answers: {},
  });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/v1/user/package/current"), api.get("/v1/user/test-progress")])
      .then(([pkgRes, progressRes]) => {
        setSections(pkgRes?.data?.data?.sections || []);
        setProgress(
          progressRes?.data?.data || {
            sectionId: 1,
            completedSectionIds: [],
            answers: {},
          }
        );
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load test setup");
      })
      .finally(() => setLoading(false));
  }, []);

  const completedSet = useMemo(
    () => new Set((progress.completedSectionIds || []).map((n) => Number(n))),
    [progress.completedSectionIds]
  );

  const totalQuestions = sections.reduce(
    (sum, section) => sum + Number(section.totalQuestions || 0),
    0
  );
  const totalDuration = sections.reduce(
    (sum, section) => sum + Number(section.durationMinutes || 0),
    0
  );
  const hasQuestions = totalQuestions > 0 && sections.length > 0;
  const allSectionsCompleted =
    hasQuestions &&
    sections.every((section) => completedSet.has(Number(section.sectionId)));

  const handleStartSection = (sectionId) => {
    navigate(`/livetest/${sectionId}`);
  };

  const handleSubmitAssessment = () => {
    setSubmitting(true);
    setError("");
    api
      .post("/v1/user/test-submit", {})
      .then(() =>
        navigate("/test-completed", {
          replace: true,
          state: { showCelebration: true },
        })
      )
      .catch((err) =>
        setError(err?.response?.data?.msg || "Failed to submit assessment")
      )
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAFA] px-4">
        <p className="text-[#65758B]">Loading assessment setup...</p>
      </div>
    );
  }

  if (!hasQuestions) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAFA] px-4">
        <div className="surface-card w-full max-w-2xl rounded-[30px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">
            No Questions Available Yet
          </h1>
          <p className="mt-3 text-[#65758B]">
            This package does not have assessment questions configured right now.
          </p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={() => navigate("/test", { replace: true })}
            className="inline-flex items-center justify-center rounded-[14px] bg-[#188B8B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#147979]"
          >
            Back to Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F1729]">
            Assessment Sections
          </h1>
          <p className="mt-2 text-base text-[#65758B]">
            Complete sections in your preferred order. Your progress is saved automatically.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-[30px] border border-[#E1E7EF] bg-white p-6 shadow-sm sm:grid-cols-3">
          <div>
            <p className="text-sm text-[#65758B]">Total Sections</p>
            <p className="mt-3 text-4xl font-bold text-[#0F1729]">{sections.length}</p>
          </div>
          <div>
            <p className="text-sm text-[#65758B]">Questions Loaded</p>
            <p className="mt-3 text-4xl font-bold text-[#0F1729]">{totalQuestions}</p>
          </div>
          <div>
            <p className="text-sm text-[#65758B]">Completed Sections</p>
            <p className="mt-3 text-4xl font-bold text-[#0F1729]">{completedSet.size}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {sections.map((section) => {
            const state = getSectionState(section, completedSet, progress);
            const answeredCount = getAnsweredForSection(
              section.sectionId,
              progress.answers || {}
            );

            return (
              <div
                key={section.sectionId}
                className="surface-card rounded-[28px] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#0F1729]">
                      Section {section.sectionId}: {section.title}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#65758B]">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#188B8B]" />
                        {section.durationMinutes || 20} minutes
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#188B8B]" />
                        {section.totalQuestions || 0} questions
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${state.badgeClass}`}
                  >
                    {state.label}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#65758B]">
                  Answered: {answeredCount} of {section.totalQuestions || 0}
                </div>

                <button
                  type="button"
                  onClick={() => handleStartSection(section.sectionId)}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold ${state.actionClass}`}
                >
                  {state.label === "In Progress" ? (
                    <PlayCircle className="h-4 w-4" />
                  ) : state.label === "Completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {state.actionLabel}
                </button>
              </div>
            );
          })}
        </div>

        {error ? <p className="mt-5 text-sm text-red-600">{error}</p> : null}

        <div className="surface-card mt-8 rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#0F1729]">
                Final Submission
              </h2>
              <p className="mt-2 text-sm text-[#65758B]">
                Total duration: {totalDuration} minutes. Complete all sections before submitting.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmitAssessment}
              disabled={submitting || !allSectionsCompleted}
              className="inline-flex items-center justify-center rounded-[14px] bg-[#F59F0A] px-6 py-3 text-sm font-semibold text-[#0F1729] hover:bg-[#E89206] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Final Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
