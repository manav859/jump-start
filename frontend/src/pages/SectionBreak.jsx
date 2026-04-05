import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Coffee, TimerReset } from "lucide-react";

export default function SectionBreak() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const completedSection = Number(state.completedSection || 0);
  const completedSectionTitle = state.completedSectionTitle || `Section ${completedSection}`;
  const completedSectionsCount = Number(state.completedSectionsCount || 0);
  const totalSections = Number(state.totalSections || 0);
  const questionsSoFar = Number(state.questionsSoFar || 0);
  const totalQuestions = Number(state.totalQuestions || 0);
  const timeElapsedMinutes = Number(state.timeElapsedMinutes || 0);
  const remainingTitles = Array.isArray(state.remainingTitles)
    ? state.remainingTitles
    : [];
  const nextSectionId = Number(state.nextSectionId || 0);
  const estimatedNextMinutes = Number(state.estimatedNextMinutes || 20);

  const isValidState =
    completedSection > 0 &&
    completedSectionsCount > 0 &&
    totalSections > 0 &&
    nextSectionId > 0;

  useEffect(() => {
    if (state.testComplete) {
      navigate("/test-completed", { replace: true });
      return;
    }

    if (!isValidState) {
      navigate("/pretest/sections", { replace: true });
    }
  }, [isValidState, navigate, state.testComplete]);

  if (!isValidState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
        <p className="text-[#65758B]">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="border-b border-[#E1E7EF] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-[#0F1729]">Section Break</h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F9F8] text-[#188B8B] shadow-sm">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="mt-6 text-4xl font-bold text-[#0F1729]">
            Section {completedSection} Complete!
          </h2>
          <p className="mt-2 text-base text-[#65758B]">
            Great progress! Take a short break before continuing.
          </p>

          <div className="mt-8 rounded-[24px] border border-[#D9E5EC] bg-white p-6 text-left shadow-sm sm:p-8">
            <h3 className="text-2xl font-bold text-[#0F1729]">Your Progress</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-4">
                <span className="text-sm text-[#65758B]">Completed Sections</span>
                <span className="text-sm font-semibold text-[#0F1729]">
                  {completedSectionsCount} of {totalSections}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-4">
                <span className="text-sm text-[#65758B]">Questions Answered</span>
                <span className="text-sm font-semibold text-[#0F1729]">
                  {questionsSoFar} of {totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-4">
                <span className="text-sm text-[#65758B]">Time Elapsed</span>
                <span className="text-sm font-semibold text-[#0F1729]">
                  {timeElapsedMinutes} minutes
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-[#65758B]">Remaining Sections</span>
                <span className="max-w-[60%] text-right text-sm font-semibold text-[#0F1729]">
                  {remainingTitles.length ? remainingTitles.join(", ") : "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#C8ECEA] bg-[#EAFBFB] p-5 text-left sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white p-2 text-[#188B8B]">
                <Coffee className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#0F1729]">
                  Take a Break
                </h4>
                <p className="mt-2 text-sm leading-7 text-[#65758B]">
                  You can take a short 5-minute break. Your progress is saved.
                  When you are ready, click continue to start the next section.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/livetest/${nextSectionId}`, { replace: true })}
            className="mt-6 inline-flex w-full items-center justify-center rounded-[14px] bg-[#F59F0A] px-6 py-3.5 text-sm font-semibold text-[#0F1729] shadow-[0_14px_28px_rgba(245,159,10,0.18)] hover:bg-[#E89206]"
          >
            Continue to Next Section
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#65758B]">
            <TimerReset className="h-4 w-4 text-[#188B8B]" />
            <span>Estimated time for next section: {estimatedNextMinutes} minutes</span>
          </div>

          <p className="mt-4 text-sm text-[#98A2B3]">
            Next up: {remainingTitles[0] || completedSectionTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
