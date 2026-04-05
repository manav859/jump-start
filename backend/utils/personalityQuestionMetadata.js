import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSONALITY_CSV_PATH = path.resolve(
  __dirname,
  "..",
  "reference",
  "section-1-personality.csv"
);

const AXIS_KEYS = [
  "extraversion",
  "openness",
  "agreeableness",
  "conscientiousness",
  "emotionalStability",
];

const QUESTION_AXIS_OVERRIDES = {
  1: "extraversion",
  2: "conscientiousness",
  3: "emotionalStability",
  4: "openness",
  5: "agreeableness",
  6: "extraversion",
  7: "conscientiousness",
  8: "emotionalStability",
  9: "openness",
  10: "agreeableness",
  11: "extraversion",
  12: "conscientiousness",
  13: "emotionalStability",
  14: "openness",
  15: "agreeableness",
  16: "extraversion",
  17: "conscientiousness",
  18: "emotionalStability",
  19: "openness",
  20: "agreeableness",
  21: "extraversion",
  22: "conscientiousness",
  23: "emotionalStability",
  24: "openness",
  25: "agreeableness",
  26: "extraversion",
  27: "conscientiousness",
  28: "emotionalStability",
  29: "openness",
  30: "agreeableness",
  31: "extraversion",
  32: "openness",
  33: "emotionalStability",
  34: "extraversion",
  35: "extraversion",
  36: "openness",
  37: "extraversion",
  38: "conscientiousness",
  39: "openness",
  40: "agreeableness",
  41: "conscientiousness",
  42: "extraversion",
  43: "openness",
  44: "emotionalStability",
  45: "conscientiousness",
  46: "extraversion",
  47: "openness",
  48: "openness",
  49: "extraversion",
  50: "emotionalStability",
  51: "openness",
  52: "extraversion",
  53: "openness",
  54: "emotionalStability",
  55: "conscientiousness",
  56: "extraversion",
  57: "openness",
  58: "emotionalStability",
  59: "agreeableness",
  60: "emotionalStability",
  61: "openness",
  62: "emotionalStability",
  63: "conscientiousness",
  64: "extraversion",
  65: "openness",
  66: "conscientiousness",
  67: "agreeableness",
  68: "extraversion",
  69: "openness",
  70: "emotionalStability",
  71: "conscientiousness",
  72: "extraversion",
};

const TEXT_AXIS_PATTERNS = {
  extraversion: [
    /talkative|outgoing|reserved and quiet|large gatherings|full of energy|shy and withdrawn|start conversations|lots of people|social situations|working alone rather than in groups|center of attention|meeting new people|social interactions|busy, active environments|speaking in front of large groups|networking|take charge|leader in group activities|positions of authority/i,
  ],
  openness: [
    /learning new things|exploring ideas|curious|imagination|creativ|artistic|aesthetic|reflect and play with ideas|abstract thinking|ideas than in practical matters|intellectual discussions|new adventures|experiment|question and challenge ideas|philosophical|innovative|new methods|creativity|breaks new ground/i,
  ],
  agreeableness: [
    /trusting and cooperative|helpful and unselfish|forgiving nature|trusting of other people's motives|sensitive to others' feelings|others' feelings and emotions|enjoy helping others|part of a team|helping others solve their problems|advice and guidance|teaching and mentoring|mediating conflicts|left out|encourage others|bring people together|potential in people|constructive criticism|different backgrounds|celebrating others/i,
  ],
  conscientiousness: [
    /organized|plans and follow through|persevere until a task is finished|rules and established procedures|plan ahead|clear deadlines and structure|stick to my decisions|in control of situations|steady and consistent|detailed and specific|step-by-step|detailed timelines|clear expectations|one task at a time|proper channels|steady progression|standards and procedures|private and personal/i,
  ],
  emotionalStability: [
    /easily stressed|worry|nervous and anxious|remain calm|relaxed and handle stress well|rarely feel blue|calm under pressure|concerned about what others think|easily upset by criticism|avoid situations where i might be criticized|sensitive to noise and distractions|worry about making mistakes|remain calm when others are upset or angry/i,
  ],
};

let cachedCsvRows = null;
let cachedMetadataById = null;

export const parseCsv = (raw = "") => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
};

export const toCsv = (rows = []) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (/[",\n\r]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");

export const normalizePersonalityAxis = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, "");

  if (!normalized) return "";

  const aliases = {
    extraversion: "extraversion",
    extroversion: "extraversion",
    openness: "openness",
    agreeableness: "agreeableness",
    conscientiousness: "conscientiousness",
    emotionalstability: "emotionalStability",
    stability: "emotionalStability",
    neuroticism: "emotionalStability",
  };

  return aliases[normalized] || "";
};

export const inferPersonalityAxis = (question = {}, fallbackIndex = 0) => {
  const explicitAxis = normalizePersonalityAxis(question.subscale);
  if (explicitAxis) return explicitAxis;

  const questionId = Number(
    question.questionId || question.question_id || fallbackIndex + 1
  );
  if (QUESTION_AXIS_OVERRIDES[questionId]) {
    return QUESTION_AXIS_OVERRIDES[questionId];
  }

  const text = String(question.text || question.question || "").trim();
  if (!text) return "";

  let bestAxis = "";
  let bestCount = 0;

  for (const axis of AXIS_KEYS) {
    const count = (TEXT_AXIS_PATTERNS[axis] || []).reduce(
      (sum, pattern) => sum + (pattern.test(text) ? 1 : 0),
      0
    );
    if (count > bestCount) {
      bestAxis = axis;
      bestCount = count;
    }
  }

  return bestAxis;
};

export const loadPersonalityCsvRows = () => {
  if (cachedCsvRows) return cachedCsvRows;
  if (!fs.existsSync(PERSONALITY_CSV_PATH)) {
    cachedCsvRows = [];
    return cachedCsvRows;
  }

  const raw = fs.readFileSync(PERSONALITY_CSV_PATH, "utf-8");
  cachedCsvRows = parseCsv(raw);
  return cachedCsvRows;
};

export const loadPersonalityMetadataByQuestionId = () => {
  if (cachedMetadataById) return cachedMetadataById;

  const rows = loadPersonalityCsvRows();
  if (!rows.length) {
    cachedMetadataById = new Map();
    return cachedMetadataById;
  }

  const headers = rows[0].map((header) => String(header || "").trim().toLowerCase());
  const questionIdIndex = headers.findIndex((value) =>
    ["question_id", "qid", "id"].includes(value)
  );
  const subscaleIndex = headers.findIndex((value) => value === "subscale");
  const notesIndex = headers.findIndex((value) => value === "notes");

  cachedMetadataById = new Map(
    rows
      .slice(1)
      .map((cells) => {
        const questionId = String(cells[questionIdIndex] || "").trim();
        if (!questionId) return null;
        return [
          questionId,
          {
            subscale: normalizePersonalityAxis(cells[subscaleIndex] || ""),
            notes: String(cells[notesIndex] || "").trim(),
          },
        ];
      })
      .filter(Boolean)
  );

  return cachedMetadataById;
};

export const getPersonalityAxisForQuestion = (question = {}, fallbackIndex = 0) => {
  const questionId = String(
    question.questionId || question.question_id || fallbackIndex + 1
  ).trim();
  const metadata = loadPersonalityMetadataByQuestionId().get(questionId);
  if (metadata?.subscale) {
    return metadata.subscale;
  }
  return inferPersonalityAxis(question, fallbackIndex);
};

export const applyPersonalityMetadataToQuestions = (questions = []) =>
  questions.map((question, index) => {
    const questionId = String(
      question.questionId || question.question_id || index + 1
    ).trim();
    const csvMetadata = loadPersonalityMetadataByQuestionId().get(questionId);
    const inferredAxis = inferPersonalityAxis(question, index);

    return {
      ...question,
      subscale:
        normalizePersonalityAxis(csvMetadata?.subscale) ||
        normalizePersonalityAxis(question.subscale) ||
        inferredAxis ||
        "",
      notes: csvMetadata?.notes || question.notes || "",
    };
  });

export const getPersonalityCsvPath = () => PERSONALITY_CSV_PATH;
