/**
 * Mechanical Reasoning Question Media (Section 4, Subsection 4.5)
 *
 * ── Stimulus images are DISABLED (text/image mismatch fix) ────────────────
 * The diagram files under /public/question-media/mechanical/q<ID>/ were
 * extracted from the OLD "Mechanical & Spatial Questions.pdf" question set
 * (Earth–Sun orbit, Earth atmosphere, belt-driven wheels, gear-trains,
 * circuits, compound pulleys, a syringe-lever, …). The live Q391–410 TEXT was
 * later replaced with the official answer-key booklet's generic gear / lever /
 * pulley / see-saw items, but those images were never re-extracted — so the
 * ID-derived mapping was serving a diagram that belonged to a *different*
 * question (e.g. Q406 "balance this see-saw?" showed an Earth–Sun orbit).
 *
 * There is no valid current-text → image pairing (the booklet questions have
 * no matching diagrams on disk), and we must not change correct answers, so
 * the only non-misleading fix is to serve NO stimulus. The block renders
 * text-only, exactly like the 11 questions that were already text-only.
 *
 * FOLLOW-UP (content, out of scope here): the booklet items that inherently
 * need a figure ("Which lever arrangement…", "Which pulley system…", the
 * see-saw, etc.) should get purpose-drawn diagrams, OR the original PDF
 * question set + its answer key should be restored to match these images.
 * Until then the diagrams stay disabled rather than mismatched.
 * ──────────────────────────────────────────────────────────────────────────
 */

const MECHANICAL_QUESTION_ID_START = 391;
const MECHANICAL_QUESTION_ID_END = 410;

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
  return numericId;
};

// Stimulus disabled: no on-disk diagram matches the current Q391–410 text, so
// returning null keeps the block text-only instead of showing a wrong figure.
// (Re-enable per-ID here once purpose-drawn diagrams exist for the live items.)
export const getMechanicalStimulusSrc = (questionId) => {
  if (!isMechanicalQuestionId(questionId)) return null;
  return null;
};
