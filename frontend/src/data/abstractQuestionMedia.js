const ABSTRACT_QUESTION_ID_START = 341;
const ABSTRACT_QUESTION_ID_END = 365;

export const isAbstractQuestionId = (questionId) => {
  // Disabled as per request: questions 341-365 (51-75 in Section 4) are text-only in the PDF.
  return false;
};

export const getAbstractPromptSrc = (questionId) => {
  const numericId = Number(questionId);
  if (!isAbstractQuestionId(numericId)) return null;

  return `/question-media/abstract/q${String(numericId).padStart(3, "0")}/prompt.png`;
};
