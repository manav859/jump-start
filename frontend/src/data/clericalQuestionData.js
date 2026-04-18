const CLERICAL_QUESTION_ID_START = 411;
const CLERICAL_QUESTION_ID_END = 430;

const CLERICAL_OPTION_OVERRIDES = {
  411: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "A",
  },
  412: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "B",
  },
  413: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "C",
  },
  414: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 2, and 3 are identical.",
    ],
    correctOption: "D",
  },
  415: {
    options: [
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "A",
  },
  416: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "B",
  },
  417: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, and 3 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "C",
  },
  418: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
      "Pairs 1, 3, and 4 are identical.",
    ],
    correctOption: "D",
  },
  419: {
    options: [
      "Pairs 1, 2, and 4 are identical.",
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "A",
  },
  420: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "B",
  },
  421: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "C",
  },
  422: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 2, and 4 are identical.",
    ],
    correctOption: "D",
  },
  423: {
    options: [
      "Pairs 1, 2, and 3 are identical.",
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "A",
  },
  424: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "B",
  },
  425: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 2 and 4 are identical.",
    ],
    correctOption: "C",
  },
  426: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 2, and 4 are identical.",
    ],
    correctOption: "D",
  },
  427: {
    options: [
      "Pairs 1, 2, and 4 are identical.",
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "A",
  },
  428: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 2, and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "B",
  },
  429: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
    ],
    correctOption: "C",
  },
  430: {
    options: [
      "Pairs 1 and 3 are identical.",
      "Pairs 1, 3, and 4 are identical.",
      "Pairs 1, 2, 3, and 4 are identical.",
      "Pairs 1, 2, and 4 are identical.",
    ],
    correctOption: "D",
  },
};

const normalizeQuestionText = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim();

export const isClericalQuestionId = (questionId) => {
  const numericId = Number(questionId);
  return (
    Number.isFinite(numericId) &&
    numericId >= CLERICAL_QUESTION_ID_START &&
    numericId <= CLERICAL_QUESTION_ID_END
  );
};

export const getClericalQuestionOverride = (questionId) =>
  CLERICAL_OPTION_OVERRIDES[Number(questionId)] || null;

export const getClericalQuestionOptions = (questionId, fallbackOptions = []) => {
  const override = getClericalQuestionOverride(questionId);
  if (override?.options?.length === 4) {
    return override.options;
  }

  return Array.isArray(fallbackOptions) ? fallbackOptions : [];
};

export const parseClericalQuestionText = (questionText = "") => {
  const normalizedText = normalizeQuestionText(questionText);
  if (!normalizedText) {
    return {
      instruction: "",
      pairs: [],
    };
  }

  const firstPairIndex = normalizedText.search(/\b1\.\s+/);
  if (firstPairIndex < 0) {
    return {
      instruction: normalizedText,
      pairs: [],
    };
  }

  const instruction = normalizedText.slice(0, firstPairIndex).trim();
  const pairs = [...normalizedText.matchAll(/(\d+)\.\s*(.*?)(?=\s+\d+\.\s|$)/g)]
    .map((match) => ({
      number: Number(match[1]),
      text: String(match[2] || "").replace(/\s*\/\s*/g, " / ").trim(),
    }))
    .filter((pair) => Number.isFinite(pair.number) && pair.text);

  return {
    instruction,
    pairs,
  };
};
