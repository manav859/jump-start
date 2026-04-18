const SPATIAL_QUESTION_ID_START = 366;
const SPATIAL_QUESTION_ID_END = 390;

// The source PDF for local Q91 only contains the answer panel, not a separate
// stimulus figure, so the UI intentionally falls back to a visible placeholder.
const MISSING_SPATIAL_STIMULUS_IDS = new Set([381]);

export const isSpatialQuestionId = (questionId) => {
  const numericId = Number(questionId);
  return (
    Number.isFinite(numericId) &&
    numericId >= SPATIAL_QUESTION_ID_START &&
    numericId <= SPATIAL_QUESTION_ID_END
  );
};

export const getSpatialQuestionNumber = (questionId) => {
  const numericId = Number(questionId);
  if (!Number.isFinite(numericId)) return null;
  if (
    numericId < SPATIAL_QUESTION_ID_START ||
    numericId > SPATIAL_QUESTION_ID_END
  ) {
    return null;
  }
  return numericId - 290;
};

const getSpatialQuestionFolder = (questionId) => {
  const questionNumber = getSpatialQuestionNumber(questionId);
  if (!questionNumber) return null;

  return `/question-media/spatial/q${String(questionNumber).padStart(3, "0")}`;
};

export const getSpatialStimulusSrc = (questionId) => {
  if (MISSING_SPATIAL_STIMULUS_IDS.has(Number(questionId))) {
    return null;
  }

  const folder = getSpatialQuestionFolder(questionId);
  return folder ? `${folder}/stimulus.png` : null;
};

export const getSpatialOptionSrc = (questionId, optionLetter) => {
  const folder = getSpatialQuestionFolder(questionId);
  const normalizedLetter = String(optionLetter || "").toUpperCase();
  if (!folder || !normalizedLetter) return null;

  return `${folder}/option-${normalizedLetter}.png`;
};
