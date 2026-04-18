import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, Pause, Save } from "lucide-react";
import api from "../api/api";
import { getApiV1Url } from "../config/env";
import {
  getClericalQuestionOptions,
  isClericalQuestionId,
  parseClericalQuestionText,
} from "../data/clericalQuestionData";
import {
  isAbstractQuestionId,
  getAbstractPromptSrc,
} from "../data/abstractQuestionMedia";
import {
  isMechanicalQuestionId,
  getMechanicalStimulusSrc,
} from "../data/mechanicalQuestionMedia";
import {
  getSpatialOptionSrc,
  getSpatialQuestionNumber,
  getSpatialStimulusSrc,
  isSpatialQuestionId,
} from "../data/spatialQuestionMedia";

const LIKERT_OPTIONS = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly Agree", value: 5 },
];

const INTEREST_ASSESSMENT_OPTIONS = [
  { label: "1 - No Interest", value: 1 },
  { label: "2 - Little Interest", value: 2 },
  { label: "3 - Moderate Interest", value: 3 },
  { label: "4 - Strong Interest", value: 4 },
  { label: "5 - Very Strong Interest", value: 5 },
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const isAnswered = (question, rawAnswer) => {
  if (question?.type === "single") {
    return rawAnswer !== undefined && String(rawAnswer).trim() !== "";
  }

  const numeric = Number(rawAnswer);
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 5;
};

const clampQuestionIndex = (index, totalQuestions) => {
  if (!Number.isFinite(Number(index))) return 0;
  return Math.max(0, Math.min(Number(index), Math.max(totalQuestions - 1, 0)));
};

const SPATIAL_OPTION_LETTERS = ["A", "B", "C", "D"];

const getQuestionText = (question, fallbackText = "") => {
  const candidates = [
    question?.questionText,
    question?.text,
    question?.prompt,
    question?.question,
  ];

  return (
    candidates
      .map((value) => String(value || "").trim())
      .find(Boolean) || fallbackText
  );
};

const getSpatialStimulusSource = (question, questionId) => {
  const candidates = [
    question?.stimulusImage,
    question?.stimulusSrc,
    question?.media?.stimulus,
    question?.image,
    getSpatialStimulusSrc(questionId),
  ];

  return (
    candidates
      .map((value) => String(value || "").trim())
      .find(Boolean) || null
  );
};

const getSpatialOptionSource = (question, questionId, optionLetter) => {
  const optionEntry = Array.isArray(question?.options)
    ? question.options.find((option, optionIndex) => {
        if (!option || typeof option === "string") return false;

        const optionKey = String(
          option.value ||
            option.label ||
            option.id ||
            String.fromCharCode(65 + optionIndex)
        )
          .trim()
          .toUpperCase()
          .replace(/\)$/, "");

        return optionKey === optionLetter;
      })
    : null;

  const candidates = [
    question?.optionImages?.[optionLetter],
    question?.optionImageMap?.[optionLetter],
    question?.media?.options?.[optionLetter],
    optionEntry?.image,
    optionEntry?.src,
    optionEntry?.imageUrl,
    getSpatialOptionSrc(questionId, optionLetter),
  ];

  return (
    candidates
      .map((value) => String(value || "").trim())
      .find(Boolean) || null
  );
};

function SpatialAssetFigure({
  src,
  placeholderText,
  className = "",
  imgClassName = "",
}) {
  const normalizedSrc = String(src || "").trim();
  const [failedSrc, setFailedSrc] = useState("");
  const failed = !normalizedSrc || failedSrc === normalizedSrc;

  if (failed) {
    return (
      <div className={className}>
        <div
          className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[#B7DDE3] bg-[#F8FCFC] px-4 py-6 text-center text-sm leading-6 text-[#65758B]"
        >
          {placeholderText}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={normalizedSrc}
        alt=""
        aria-hidden="true"
        onError={() => setFailedSrc(normalizedSrc)}
        className={imgClassName}
      />
    </div>
  );
}

export default function Livetest() {
  const { sectionId: sectionIdParam } = useParams();
  const navigate = useNavigate();
  const sectionId = Number(sectionIdParam || 1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({
    sectionId,
    questionIndex: 0,
    answers: {},
    completedSectionIds: [],
    timeRemainingSeconds: null,
  });
  const [section, setSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionError, setQuestionError] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [pauseSaving, setPauseSaving] = useState(false);
  const latestProgressRef = useRef(progress);
  const latestTimeRef = useRef(timeLeft);
  const initialResumeScrollDoneRef = useRef(false);

  const answerKey = useCallback(
    (questionIndex) => `${sectionId}-${questionIndex}`,
    [sectionId]
  );

  const findFirstUnansweredIndex = useCallback(
    (questionList, answers = {}) =>
      questionList.findIndex((question, index) => {
        const rawAnswer = answers?.[answerKey(index)];
        return !isAnswered(question, rawAnswer);
      }),
    [answerKey]
  );

  const scrollToQuestionCard = useCallback(
    (questionIndex, behavior = "smooth", block = "center") => {
      if (!Number.isInteger(questionIndex) || questionIndex < 0) return;

      const scroll = () => {
        const target = document.getElementById(`question-card-${questionIndex}`);
        target?.scrollIntoView({ behavior, block });
      };

      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(scroll);
        return;
      }

      scroll();
    },
    []
  );

  const orderedSections = useMemo(
    () =>
      [...allSections].sort(
        (a, b) => Number(a.sectionId) - Number(b.sectionId)
      ),
    [allSections]
  );
  const currentSectionIndex = orderedSections.findIndex(
    (item) => Number(item.sectionId) === Number(sectionId)
  );
  const nextSection =
    currentSectionIndex >= 0
      ? orderedSections[currentSectionIndex + 1] || null
      : null;
  const totalQuestions = questions.length;
  const showInterestInstructionHeading = sectionId === 3 && totalQuestions > 0;

  const answeredCount = useMemo(
    () =>
      questions.reduce((count, question, index) => {
        const rawAnswer = progress.answers?.[answerKey(index)];
        return count + (isAnswered(question, rawAnswer) ? 1 : 0);
      }, 0),
    [answerKey, progress.answers, questions]
  );

  const progressPercent = Math.round(
    (answeredCount / Math.max(1, totalQuestions)) * 100
  );

  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    latestTimeRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    initialResumeScrollDoneRef.current = false;
  }, [sectionId]);

  useEffect(() => {
    Promise.all([api.get("/v1/user/package/current"), api.get("/v1/user/test-progress")])
      .then(([pkgRes, progressRes]) => {
        const packageId = pkgRes?.data?.data?.package?.id;
        if (!packageId) throw new Error("No selected package");

        return Promise.all([
          Promise.resolve(pkgRes),
          api.get(`/v1/public/packages/${packageId}/sections/${sectionId}/questions`),
          Promise.resolve(progressRes),
        ]);
      })
      .then(([pkgRes, sectionRes, progressRes]) => {
        const sections = pkgRes?.data?.data?.sections || [];
        setAllSections(sections);

        const loadedSection = sectionRes?.data?.data?.section;
        const loadedQuestions = sectionRes?.data?.data?.questions || [];
        setSection(loadedSection);
        setQuestions(loadedQuestions);

        const savedProgress = progressRes?.data?.data || {};
        const savedAnswers = savedProgress.answers || {};
        const isResumingCurrentSection =
          Number(savedProgress.sectionId) === sectionId;
        const firstUnansweredIndex = isResumingCurrentSection
          ? findFirstUnansweredIndex(loadedQuestions, savedAnswers)
          : -1;
        const initialQuestionIndex = isResumingCurrentSection
          ? firstUnansweredIndex >= 0
            ? firstUnansweredIndex
            : clampQuestionIndex(
                savedProgress.questionIndex || 0,
                loadedQuestions.length
              )
          : 0;
        const restoredTime =
          savedProgress.sectionId === sectionId &&
          Number.isFinite(Number(savedProgress.timeRemainingSeconds))
            ? Number(savedProgress.timeRemainingSeconds)
            : Number(loadedSection?.durationMinutes || 20) * 60;
        const initialTime =
          restoredTime > 0
            ? restoredTime
            : Number(loadedSection?.durationMinutes || 20) * 60;

        setProgress({
          sectionId,
          questionIndex: initialQuestionIndex,
          answers: savedAnswers,
          completedSectionIds: savedProgress.completedSectionIds || [],
          timeRemainingSeconds: initialTime,
        });
        setTimeLeft(Number(initialTime) || 0);
      })
      .catch((err) => {
        console.error("Failed to load section", err);
        navigate("/pretest/sections", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [findFirstUnansweredIndex, navigate, sectionId]);

  useEffect(() => {
    if (loading || !section || !questions.length) return;
    if (initialResumeScrollDoneRef.current) return;

    const hasAnsweredQuestions = questions.some((question, index) => {
      const rawAnswer = progress.answers?.[answerKey(index)];
      return isAnswered(question, rawAnswer);
    });

    initialResumeScrollDoneRef.current = true;
    if (!hasAnsweredQuestions) return;

    const firstUnansweredIndex = findFirstUnansweredIndex(
      questions,
      progress.answers || {}
    );
    const targetIndex =
      firstUnansweredIndex >= 0
        ? firstUnansweredIndex
        : clampQuestionIndex(progress.questionIndex || 0, questions.length);

    scrollToQuestionCard(targetIndex, "smooth", "start");
  }, [
    answerKey,
    findFirstUnansweredIndex,
    loading,
    progress.answers,
    progress.questionIndex,
    questions,
    scrollToQuestionCard,
    section,
  ]);

  const buildProgressPayload = useCallback(
    (nextProgress, override = {}) => ({
      sectionId: override.sectionId ?? sectionId,
      questionIndex:
        override.questionIndex ?? Number(nextProgress.questionIndex || 0),
      answers: override.answers ?? nextProgress.answers,
      completedSectionIds:
        override.completedSectionIds ?? nextProgress.completedSectionIds,
      timeRemainingSeconds:
        override.timeRemainingSeconds ??
        nextProgress.timeRemainingSeconds ??
        (Number(latestTimeRef.current) || 0),
    }),
    [sectionId]
  );

  const persistProgress = useCallback(
    async (nextProgress, override = {}) => {
      setSaveState("saving");
      await api.patch(
        "/v1/user/test-progress",
        buildProgressPayload(nextProgress, override)
      );
      setSaveState("saved");
    },
    [buildProgressPayload]
  );

  const completeSection = useCallback(
    (remainingSeconds = 0) => {
      if (saving) return;

      const completedSectionIds = [
        ...new Set([...(progress.completedSectionIds || []), sectionId]),
      ];
      const nextProgress = { ...progress, completedSectionIds };
      const nextSectionId = nextSection ? Number(nextSection.sectionId) : sectionId;
      const nextTimeRemaining = nextSection
        ? null
        : Math.max(0, Number(remainingSeconds) || 0);
      const totalQuestionsAcrossSections = orderedSections.reduce(
        (sum, item) => sum + Number(item.totalQuestions || 0),
        0
      );
      const answeredCompletedQuestions = orderedSections
        .filter((item) => completedSectionIds.includes(Number(item.sectionId)))
        .reduce((sum, item) => sum + Number(item.totalQuestions || 0), 0);
      const remainingTitles = orderedSections
        .filter((item) => !completedSectionIds.includes(Number(item.sectionId)))
        .map((item) => item.title);
      const sectionDurationSeconds = Math.max(
        0,
        Number(section?.durationMinutes || 20) * 60
      );
      const elapsedSeconds = Math.max(
        0,
        sectionDurationSeconds - Math.max(0, Number(remainingSeconds) || 0)
      );
      const timeElapsedMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));

      setProgress(nextProgress);
      setSaving(true);

      api
        .patch("/v1/user/test-progress", {
          sectionId: nextSectionId,
          questionIndex: 0,
          answers: nextProgress.answers,
          completedSectionIds,
          timeRemainingSeconds: nextTimeRemaining,
        })
        .then(() => {
          if (nextSection) {
            navigate("/sectionbreak", {
              replace: true,
              state: {
                completedSection: sectionId,
                completedSectionTitle: section?.title || `Section ${sectionId}`,
                completedSectionsCount: completedSectionIds.length,
                totalSections: orderedSections.length,
                questionsSoFar: answeredCompletedQuestions,
                totalQuestions: totalQuestionsAcrossSections,
                timeElapsedMinutes,
                remainingTitles,
                nextSectionId: Number(nextSection.sectionId),
                estimatedNextMinutes: Number(nextSection.durationMinutes || 20),
              },
            });
            return;
          }

          navigate("/pretest/sections", { replace: true });
        })
        .catch((err) => {
          console.error("Failed to complete section", err);
          setQuestionError(
            err?.response?.data?.msg ||
              "We could not complete this section right now."
          );
        })
        .finally(() => {
          setSaving(false);
        });
    },
    [navigate, nextSection, orderedSections, progress, saving, section, sectionId]
  );

  useEffect(() => {
    if (loading) return undefined;
    if (!Number.isFinite(Number(timeLeft))) return undefined;
    if (Number(timeLeft) <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Number(prev) - 1);
        if (next === 0) {
          clearInterval(timer);
          completeSection(0);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completeSection, loading, timeLeft]);

  useEffect(() => {
    setProgress((prev) => ({
      ...prev,
      timeRemainingSeconds: Number(timeLeft) || 0,
    }));
  }, [timeLeft]);

  useEffect(() => {
    if (loading || !section) return undefined;

    const autosave = window.setInterval(() => {
      persistProgress(latestProgressRef.current, {
        timeRemainingSeconds: Number(latestTimeRef.current) || 0,
      }).catch((err) => {
        console.error("Autosave failed", err);
        setSaveState("error");
      });
    }, 15000);

    return () => window.clearInterval(autosave);
  }, [loading, persistProgress, section]);

  useEffect(() => {
    if (loading || !section) return undefined;

    const saveOnExit = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = buildProgressPayload(latestProgressRef.current, {
        timeRemainingSeconds: Number(latestTimeRef.current) || 0,
      });

      fetch(getApiV1Url("/user/test-progress"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveOnExit();
      }
    };

    window.addEventListener("pagehide", saveOnExit);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", saveOnExit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [buildProgressPayload, loading, section]);

  const handleAnswer = (questionIndex, value) => {
    const answers = {
      ...(progress.answers || {}),
      [answerKey(questionIndex)]: value,
    };
    const nextProgress = {
      ...progress,
      answers,
      questionIndex: questionIndex,
    };

    setQuestionError("");
    setProgress(nextProgress);

    persistProgress(nextProgress).catch((err) => {
      console.error("Failed to save answer", err);
      setSaveState("error");
    });
  };

  const handleCompleteSection = () => {
    const firstUnansweredIndex = questions.findIndex((question, index) => {
      const rawAnswer = progress.answers?.[answerKey(index)];
      return !isAnswered(question, rawAnswer);
    });

    if (firstUnansweredIndex >= 0) {
      setQuestionError("Please answer all questions in this section before continuing.");
      scrollToQuestionCard(firstUnansweredIndex, "smooth", "center");
      return;
    }

    completeSection(timeLeft);
  };

  const handlePauseTest = async () => {
    if (saving || pauseSaving) return;

    setPauseSaving(true);
    setQuestionError("");

    try {
      await persistProgress(latestProgressRef.current, {
        timeRemainingSeconds: Number(latestTimeRef.current) || 0,
      });
      navigate("/test-paused", {
        replace: true,
        state: {
          sectionId,
          sectionTitle: section?.title || `Section ${sectionId}`,
          answeredCount,
          totalQuestions,
          timeRemainingSeconds: Number(latestTimeRef.current) || 0,
        },
      });
    } catch (err) {
      console.error("Failed to pause test", err);
      setSaveState("error");
      setQuestionError(
        err?.response?.data?.msg ||
          "We could not pause your test right now. Please try again."
      );
    } finally {
      setPauseSaving(false);
    }
  };

  if (loading || !section) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-[#65758B]">Loading section...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-[#E1E7EF] bg-white p-8 text-center">
          <h2 className="text-2xl font-bold text-[#0F1729]">
            This Section Has No Questions
          </h2>
          <p className="mt-3 text-[#65758B]">
            The selected package is missing question data for Section {sectionId}.
            Please go back and choose another section or package.
          </p>
          <button
            type="button"
            onClick={() => navigate("/pretest/sections", { replace: true })}
            className="mt-6 rounded-xl bg-[#188B8B] px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
          >
            Back to Sections
          </button>
        </div>
      </div>
    );
  }

  const timerLabel = Number.isFinite(Number(timeLeft))
    ? formatTime(Number(timeLeft))
    : "--:--";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="sticky top-0 z-30 border-b border-[#E1E7EF] bg-[#FAFAFA]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-2 py-2 sm:px-4 sm:py-2.5 md:px-8">
          <div className="overflow-hidden rounded-[16px] border border-[#E1E7EF] bg-white shadow-sm sm:rounded-[22px]">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E1E7EF] px-3 py-2.5 sm:items-center sm:px-5 sm:py-3">
              <div>
                <h1 className="text-[15px] font-bold leading-tight text-[#0F1729] sm:text-[20px] md:text-[24px]">
                  Section {section.sectionId}: {section.title}
                </h1>
                <p className="mt-0.5 text-[11px] text-[#65758B] sm:mt-1 sm:text-sm">
                  Section {Math.max(currentSectionIndex + 1, 1)} of{" "}
                  {Math.max(orderedSections.length, 1)}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-1.5 sm:w-auto sm:flex sm:items-center sm:gap-3">
                <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E1E7EF] px-2.5 py-1.5 text-[11px] font-semibold text-[#0F1729] sm:px-4 sm:py-2 sm:text-sm">
                  <Clock3 className="h-3.5 w-3.5 text-[#188B8B] sm:h-4 sm:w-4" />
                  {timerLabel}
                </div>
                <button
                  type="button"
                  onClick={handlePauseTest}
                  disabled={saving || pauseSaving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#188B8B] px-2.5 py-1.5 text-[11px] font-semibold text-[#188B8B] transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {pauseSaving ? "Pausing..." : "Pause Test"}
                </button>
              </div>
            </div>

            <div className="grid gap-2 px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5 sm:py-3">
              <div className="flex items-center justify-between gap-3 sm:contents">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0F1729] sm:gap-2 sm:text-sm">
                  <Save className="h-3.5 w-3.5 text-[#65758B] sm:h-4 sm:w-4" />
                  {saveState === "saving"
                    ? "Saving..."
                    : saveState === "error"
                      ? "Save pending"
                      : "Auto-saved"}
                </div>

                <div className="text-[11px] font-semibold text-[#0F1729] sm:hidden">
                  {answeredCount}/{totalQuestions}
                </div>
              </div>

              <div className="text-[11px] leading-4 text-[#65758B] sm:hidden">
                Progress auto-saves. Pause and continue later.
              </div>

              <div className="hidden rounded-2xl bg-[#E8F9F8] px-4 py-2.5 text-center text-sm text-[#65758B] sm:block">
                {saveState === "saving"
                  ? "Your latest answer is being saved."
                  : saveState === "error"
                    ? "Saving is delayed. Keep going and we will retry."
                    : "Your progress is automatically saved. You can pause the section and return later."}
              </div>

              <div className="hidden text-xs font-semibold text-[#0F1729] sm:block sm:text-right sm:text-sm">
                {answeredCount}/{totalQuestions} answered
              </div>
            </div>

            <div className="px-3 pb-2.5 sm:px-5 sm:pb-4">
              <div className="h-1 rounded-full bg-[#E1E7EF] sm:h-2">
                <div
                  className="h-1 rounded-full bg-[#188B8B] transition-all duration-300 sm:h-2"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] font-semibold text-[#65758B] sm:mt-2 sm:text-xs">
                {progressPercent}% complete
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
        <div className="space-y-4">
          {showInterestInstructionHeading ? (
            <section className="rounded-[26px] border border-[#B7DDE3] bg-[#F1FDFF] p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#188B8B]">
                Interest Assessment Instruction
              </p>
              <h2 className="mt-3 text-lg font-semibold leading-8 text-[#0F1729] sm:text-[22px]">
                Instruction: Rate your interest in each activity from 1 (No Interest) to 5 (Very Strong Interest)
              </h2>
            </section>
          ) : null}

          {questions.map((question, index) => {
            const currentAnswer = progress.answers?.[answerKey(index)];
            const numericQuestionId = Number(question.questionId);
            const isSpatialImageQuestion =
              sectionId === 4 &&
              (question.type === "image" || isSpatialQuestionId(numericQuestionId));
            const spatialQuestionNumber = isSpatialImageQuestion
              ? getSpatialQuestionNumber(numericQuestionId)
              : null;

            // Abstract Reasoning (Q341-Q365) — each has a prompt.png
            const isAbstractImageQuestion =
              sectionId === 4 && isAbstractQuestionId(numericQuestionId);
            const abstractPromptSrc = isAbstractImageQuestion
              ? getAbstractPromptSrc(numericQuestionId)
              : null;

            // Mechanical Reasoning (Q391-Q410) — some have stimulus diagrams
            const isMechanicalImageQuestion =
              sectionId === 4 && isMechanicalQuestionId(numericQuestionId);
            const mechanicalStimulusSrc = isMechanicalImageQuestion
              ? getMechanicalStimulusSrc(numericQuestionId)
              : null;

            const questionText = getQuestionText(
              question,
              isSpatialImageQuestion
                ? "Study the figure and choose the correct answer."
                : isAbstractImageQuestion
                  ? "Study the pattern and choose the correct answer."
                  : isMechanicalImageQuestion && mechanicalStimulusSrc
                    ? "Study the diagram and choose the correct answer."
                    : `Question ${index + 1}`
            );
            const spatialStimulusSrc = isSpatialImageQuestion
              ? getSpatialStimulusSource(question, numericQuestionId)
              : null;
            const useInterestAssessmentOptions =
              sectionId === 3 && index < 54 && question.type !== "single";
            const showInterestGroupInstructionHeading =
              sectionId === 3 && index === 54;
            const isClericalPairsQuestion =
              sectionId === 4 &&
              question.type === "single" &&
              isClericalQuestionId(numericQuestionId);
            const clericalPrompt = isClericalPairsQuestion
              ? parseClericalQuestionText(questionText)
              : null;
            const options =
              question.type === "single"
                ? isClericalPairsQuestion
                  ? getClericalQuestionOptions(
                      numericQuestionId,
                      question.options || []
                    )
                  : question.options || []
                : useInterestAssessmentOptions
                  ? INTEREST_ASSESSMENT_OPTIONS
                  : LIKERT_OPTIONS;
            const useTwoColumns =
              question.type === "single" &&
              options.length >= 4 &&
              !isClericalPairsQuestion;

            return (
              <React.Fragment key={question.questionId || index}>
                {showInterestGroupInstructionHeading ? (
                  <section className="rounded-[26px] border border-[#B7DDE3] bg-[#F1FDFF] p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#188B8B]">
                      Interest Assessment Instruction
                    </p>
                    <h2 className="mt-3 text-lg font-semibold leading-8 text-[#0F1729] sm:text-[22px]">
                      Instructions: Choose the activity you would most prefer in each group
                    </h2>
                  </section>
                ) : null}

                <section
                  id={`question-card-${index}`}
                  className="rounded-[26px] border border-[#E1E7EF] bg-white p-5 shadow-sm sm:p-6"
                >
                  <h2 className="whitespace-pre-line text-lg font-semibold leading-8 text-[#0F1729] sm:text-[22px]">
                    {index + 1}.{" "}
                    {isClericalPairsQuestion && clericalPrompt?.instruction
                      ? clericalPrompt.instruction
                      : questionText}
                  </h2>

                  {isClericalPairsQuestion && clericalPrompt?.pairs?.length ? (
                    <div className="mt-5 rounded-2xl border border-[#E1E7EF] bg-[#FAFCFE] px-4 py-4 sm:px-5">
                      <ol className="space-y-3">
                        {clericalPrompt.pairs.map((pair) => (
                          <li
                            key={`${numericQuestionId}-${pair.number}`}
                            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 font-mono text-sm leading-6 text-[#0F1729] sm:text-[15px]"
                          >
                            <span className="font-semibold tabular-nums text-[#188B8B]">
                              {pair.number}.
                            </span>
                            <span className="break-words">{pair.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {/* ── Mechanical Reasoning stimulus (diagram above text options) ── */}
                  {isMechanicalImageQuestion && mechanicalStimulusSrc ? (
                    <div className="mt-5 rounded-2xl border border-[#E1E7EF] bg-[#FAFCFE] p-4 sm:p-5">
                      <SpatialAssetFigure
                        src={mechanicalStimulusSrc}
                        placeholderText={`[Image pending for Mechanical Q${numericQuestionId}]`}
                        className="flex min-h-[180px] items-center justify-center"
                        imgClassName="mx-auto h-auto max-h-[300px] w-auto max-w-full object-contain"
                      />
                    </div>
                  ) : null}

                  {isSpatialImageQuestion ? (
                    <>
                      <div className="mt-5 rounded-2xl border border-[#E1E7EF] bg-[#FAFCFE] p-4 sm:p-5">
                        <SpatialAssetFigure
                          src={spatialStimulusSrc}
                          placeholderText={`[Image pending for Q${spatialQuestionNumber} - Stimulus]`}
                          className="flex min-h-[220px] items-center justify-center"
                          imgClassName="mx-auto h-auto max-h-[300px] w-auto max-w-full object-contain"
                        />
                      </div>

                      <div className="mt-5 grid gap-3 min-[500px]:grid-cols-2">
                        {SPATIAL_OPTION_LETTERS.map((optionLetter) => {
                          const selected =
                            String(currentAnswer) === String(optionLetter);
                          const spatialOptionSrc = getSpatialOptionSource(
                            question,
                            numericQuestionId,
                            optionLetter
                          );

                          return (
                            <label
                              key={`${index}-${optionLetter}`}
                              className={`cursor-pointer rounded-2xl border p-4 transition ${
                                selected
                                  ? "border-[#20B6C7] bg-[#F1FDFF]"
                                  : "border-[#E1E7EF] bg-white hover:border-[#B7DDE3]"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${index}`}
                                checked={selected}
                                onChange={() => handleAnswer(index, optionLetter)}
                                aria-label={`Option ${optionLetter}`}
                                className="sr-only"
                              />

                              <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-[#0F1729]">
                                <span>{optionLetter})</span>
                              </div>

                              <div className="mt-3 rounded-xl border border-[#E1E7EF] bg-[#FAFCFE] p-3">
                                <SpatialAssetFigure
                                  src={spatialOptionSrc}
                                  placeholderText={`[Image pending for Q${spatialQuestionNumber} - Option ${optionLetter}]`}
                                  className="flex min-h-[170px] w-full items-center justify-center"
                                  imgClassName="mx-auto h-auto max-h-[170px] w-auto max-w-full object-contain"
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`mt-5 grid gap-3 ${
                        isClericalPairsQuestion
                          ? "grid-cols-1"
                          : useTwoColumns
                            ? "md:grid-cols-2"
                            : ""
                      }`}
                    >
                      {options.map((option, optionIndex) => {
                        const value =
                          question.type === "single"
                            ? String.fromCharCode(65 + optionIndex)
                            : option.value;
                        const label =
                          question.type === "single" ? option : option.label;
                        const selected =
                          question.type === "single"
                            ? String(currentAnswer) === String(value)
                            : Number(currentAnswer) === Number(value);

                        return (
                          <label
                            key={`${index}-${value}`}
                            className={`flex w-full cursor-pointer gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                              selected
                                ? "border-[#20B6C7] bg-[#F1FDFF]"
                                : "border-[#E1E7EF] bg-white hover:border-[#B7DDE3]"
                            } ${isClericalPairsQuestion ? "items-start py-4" : "items-center"}`}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              checked={selected}
                              onChange={() => handleAnswer(index, value)}
                              className="h-4 w-4 shrink-0 border-gray-300 text-[#20B6C7] focus:ring-[#20B6C7]"
                            />
                            <span className="whitespace-pre-line text-sm leading-6 text-[#0F1729]">
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              </React.Fragment>
            );
          })}
        </div>

        {questionError ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {questionError}
          </div>
        ) : null}

        <div className="mt-8 rounded-[26px] border border-[#E1E7EF] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#188B8B]">
                <CheckCircle2 className="h-4 w-4" />
                Section Progress Saved
              </div>
              <h3 className="mt-3 text-2xl font-bold text-[#0F1729]">
                Ready to continue?
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#65758B]">
                Complete all questions in this section, then continue to the next section.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompleteSection}
              disabled={saving || pauseSaving}
              className="inline-flex items-center justify-center rounded-[14px] bg-[#F6C465] px-6 py-3 text-sm font-semibold text-[#0F1729] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-[#EDB84A] enabled:hover:shadow-[0_12px_24px_rgba(246,196,101,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {nextSection ? "Continue to Next Section" : "Complete Section"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
