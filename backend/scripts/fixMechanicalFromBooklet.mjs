// One-off repair: replace the Mechanical Reasoning block (Q391-410) in the
// generated package with the questions from the official test booklet
// (reference/complete-aptitude-test-500q.pdf) and the correct-answer letters
// from the official answer key (reference/complete-answer-key-500q.pdf).
//
// Why: the audit found the served Q391-410 were a DIFFERENT physics question
// set than the booklet's gear/lever/pulley items, so none of the stored
// answers lined up with the official key. This restores the booklet items so
// the block matches the key 20/20.
//
// Gujarati translations for the replaced items are cleared (set empty) — they
// described the old questions. Regenerate via the documented translation
// script when needed.
//
// Usage:  node scripts/fixMechanicalFromBooklet.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_PATH = path.resolve(__dirname, "..", "config", "comprehensive500Package.generated.js");

// [text, [optionA..optD], correctLetter] in question-number order 391..410.
const MECHANICAL = [
  ["If gear A turns clockwise, which direction will gear B turn?", ["Clockwise", "Counterclockwise", "Won't turn", "Both directions"], "B"],
  ["Which lever arrangement requires the least force to lift the weight?", ["Lever A", "Lever B", "Lever C", "All equal"], "C"],
  ["If you push down on this end, what happens to the other end?", ["Goes up", "Goes down", "Stays same", "Moves sideways"], "A"],
  ["Which pulley system gives the greatest mechanical advantage?", ["System A", "System B", "System C", "All equal"], "C"],
  ["What will happen if you turn the handle clockwise?", ["Weight goes up", "Weight goes down", "No movement", "Handle breaks"], "A"],
  ["Which inclined plane requires less force to move the box?", ["Steep ramp", "Gentle ramp", "Same force", "Can't determine"], "B"],
  ["If water flows into this container, which section fills first?", ["Section A", "Section B", "Section C", "All at once"], "B"],
  ["Which wheel will turn faster?", ["Large wheel", "Small wheel", "Same speed", "Neither turns"], "B"],
  ["What's the mechanical advantage of this lever?", ["1:1", "2:1", "3:1", "4:1"], "C"],
  ["If you turn this screw clockwise, what happens?", ["Goes in", "Comes out", "No change", "Breaks"], "A"],
  ["Which spring will compress the most under the same weight?", ["Spring A", "Spring B", "Spring C", "All equal"], "B"],
  ["What direction will the ball roll?", ["Left", "Right", "Won't move", "Up"], "B"],
  ["Which gear will turn the fastest?", ["Gear A", "Gear B", "Gear C", "Same speed"], "C"],
  ["If you heat this metal rod, what happens to its length?", ["Gets longer", "Gets shorter", "Stays same", "Depends on metal"], "A"],
  ["Which bottle will empty faster if both caps are removed?", ["Wide neck", "Narrow neck", "Same rate", "Neither empties"], "A"],
  ["What force is needed to balance this see-saw?", ["10 lbs", "15 lbs", "20 lbs", "25 lbs"], "C"],
  ["Which pendulum will swing faster?", ["Long pendulum", "Short pendulum", "Same speed", "Neither swings"], "B"],
  ["If you compress this spring, what happens to its potential energy?", ["Increases", "Decreases", "Stays same", "Becomes kinetic"], "A"],
  ["Which ramp will the ball reach the bottom fastest?", ["Straight ramp", "Curved ramp", "Same time", "Ball won't roll"], "B"],
  ["What happens when you mix hot and cold water?", ["Temperature equalizes", "Hot water rises", "Cold water rises", "No mixing"], "A"],
];

const pkgMod = await import("file://" + PKG_PATH.replace(/\\/g, "/"));
const PACKAGE = pkgMod.default || pkgMod;

const section4 = PACKAGE.sections.find((s) => Number(s.sectionId) === 4);
if (!section4) throw new Error("Section 4 not found");
const byNum = new Map(section4.questions.map((q) => [Number(q.questionId), q]));

let changed = 0;
for (let i = 0; i < MECHANICAL.length; i += 1) {
  const n = 391 + i;
  const q = byNum.get(n);
  if (!q) throw new Error(`Q${n} missing in package`);
  const [text, options, correct] = MECHANICAL[i];
  q.text = text;
  q.options = options.slice();
  q.correctOption = correct;
  if ("text_gu" in q) q.text_gu = "";
  if ("options_gu" in q) q.options_gu = [];
  changed += 1;
}

// Re-emit the file: keep the original header comment, refresh the timestamp.
const header = [
  "// AUTO-GENERATED — comprehensive 500-question package with Gujarati translations.",
  "// Regenerate via:  npm run translate:questions:gu  OR  node scripts/applyGujaratiTranslations.mjs",
  `// Last updated: ${new Date().toISOString()}`,
  "",
].join("\n");

const body = `const PACKAGE = ${JSON.stringify(PACKAGE, null, 2)};\n\nexport default PACKAGE;\n`;
fs.writeFileSync(PKG_PATH, header + body, "utf8");

// Verify the written file round-trips to identical data.
const verifyMod = await import("file://" + PKG_PATH.replace(/\\/g, "/") + "?t=" + Date.now());
const reloaded = verifyMod.default || verifyMod;
const reByNum = new Map(
  reloaded.sections.find((s) => Number(s.sectionId) === 4).questions.map((q) => [Number(q.questionId), q])
);
let ok = 0;
for (let i = 0; i < MECHANICAL.length; i += 1) {
  const n = 391 + i;
  const q = reByNum.get(n);
  if (q.correctOption === MECHANICAL[i][2] && q.text === MECHANICAL[i][0]) ok += 1;
}
console.log(`[fix-mechanical] updated ${changed} questions; verified ${ok}/20 round-tripped`);
