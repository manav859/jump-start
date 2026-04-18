const ABSTRACT_QUESTION_ID_START = 341;
const ABSTRACT_QUESTION_ID_END = 365;

export const isAbstractQuestionId = (questionId) => {
  const numericId = Number(questionId);
  return (
    Number.isFinite(numericId) &&
    numericId >= ABSTRACT_QUESTION_ID_START &&
    numericId <= ABSTRACT_QUESTION_ID_END
  );
};

export const getAbstractPromptSrc = (questionId) => {
  const numericId = Number(questionId);
  if (!isAbstractQuestionId(numericId)) return null;

  return `/question-media/abstract/q${String(numericId).padStart(3, "0")}/prompt.png`;
};
