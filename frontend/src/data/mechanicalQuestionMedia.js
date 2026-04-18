/**
 * Mechanical Reasoning Question Media (Section 4, Subsection 4.5)
 *
 * ── Implementation Notes (matching spatial question pattern) ──────────────
 * Field used          : Derived from questionId via helper functions
 * Image storage       : /public/question-media/mechanical/q<ID>/stimulus.png
 * Naming convention   : q391/, q392/ … q410/ — each contains stimulus.png
 * Source PDF          : "Mechanical & Spatial Questions.pdf"
 * Extraction script   : backend/scripts/extractMechanicalQuestionMedia.mjs
 *
 * Unlike spatial questions, mechanical questions have TEXT answer options,
 * so only stimulus/diagram images are needed (no option-A/B/C/D images).
 *
 * Questions that reference diagrams/figures:
 *   Q391 — Pulley system (force & load ratio)
 *   Q392 — Gear/wheel revolutions
 *   Q394 — Pulley rope length
 *   Q400 — Wheel A/B gear direction
 *   Q401 — Circuit with bulbs
 *   Q402 — Gear train A/B/C/D direction
 *
 * All other questions (393, 395-399, 403-410) are text-only.
 * ──────────────────────────────────────────────────────────────────────────
 */

const MECHANICAL_QUESTION_ID_START = 391;
const MECHANICAL_QUESTION_ID_END = 410;

// Question IDs that are purely text-based and have no diagram/figure.
const TEXT_ONLY_MECHANICAL_IDS = new Set([
  393, 395, 396, 397, 398, 399, 403, 404, 405, 407, 408, 409,
]);

export const isMechanicalQuestionId = (questionId) => {
  const numericId = Number(questionId);
  return (
    Number.isFinite(numericId) &&
    numericId >= MECHANICAL_QUESTION_ID_START &&
    numericId <= MECHANICAL_QUESTION_ID_END
  );
};

export const getMechanicalQuestionNumber = (questionId) => {
  const numericId = Number(questionId);
  if (!isMechanicalQuestionId(numericId)) return null;
  // Display question number: the offset within the section.
  // In Section 4, mechanical starts after 100 questions (verbal 25 + numerical 25 + abstract 25 + spatial 25),
  // so Q391 appears as UI question 101. However, the folder names use the raw question ID.
  return numericId;
};

export const getMechanicalStimulusSrc = (questionId) => {
  const numericId = Number(questionId);
  if (!isMechanicalQuestionId(numericId)) return null;

  // Text-only questions have no stimulus image
  if (TEXT_ONLY_MECHANICAL_IDS.has(numericId)) return null;

  return `/question-media/mechanical/q${String(numericId).padStart(3, "0")}/stimulus.png`;
};
