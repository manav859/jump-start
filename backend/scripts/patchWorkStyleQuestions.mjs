// One-shot patch for the Work Style block in
// backend/config/comprehensive500Package.generated.js.
//
// Why this exists: the generator dropped the per-question A/B/C option
// text for Q73-Q96 (Section 1.3 — Work Style Preferences). Each question
// was saved as `type: "likert"` with `options: []`, so the live UI
// rendered them as Strongly Disagree → Strongly Agree against a
// truncated stem ("I prefer to work:" with no A/B/C choices visible).
// The categorical scorer (scoreCategoricalProfile) couldn't classify
// the answers either, pinning Work Style consistency to 0% for every
// student.
//
// This script restores the correct shape — `type: "single"` with the
// 3 categorical options pulled directly from the source PDF text
// (extracted via backend/scratch/pdf_aptitude.txt). After running it
// once, re-seed the assessment config (`npm run seed:assessment`)
// so the updated questions land in MongoDB.
//
// The script is idempotent: re-running it after the file has already
// been patched is a no-op (it detects the populated `options` array
// and skips). Safe to commit.
//
// Run with:
//   node scripts/patchWorkStyleQuestions.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TARGET = join(__dirname, "..", "config", "comprehensive500Package.generated.js");

// Source data — full stem + 3 categorical options per question, lifted
// from the source PDF (complete-aptitude-test-500q.pdf), Section 1.3.
// Option index 0 → A → "Structured / Independent" profile
// Option index 1 → B → "Balanced / Collaborative" profile
// Option index 2 → C → "Dynamic / Autonomous" profile
const WORK_STYLE_DATA = {
  73: { text: "I prefer to work:",                          options: ["Alone on independent projects", "In small teams of 2-4 people", "In large groups or teams"] },
  74: { text: "My ideal work environment would be:",         options: ["Quiet and structured", "Collaborative and social", "Dynamic and changing"] },
  75: { text: "I prefer tasks that are:",                    options: ["Routine and predictable", "Varied with some structure", "Completely unpredictable and challenging"] },
  76: { text: "When facing a deadline, I:",                  options: ["Start early and work steadily", "Work in bursts of activity", "Work best under pressure at the last minute"] },
  77: { text: "I learn best through:",                       options: ["Reading and studying independently", "Discussion and group work", "Hands-on experience and practice"] },
  78: { text: "My ideal work schedule would be:",            options: ["Fixed hours, same time every day", "Flexible hours within set boundaries", "Complete flexibility to set my own schedule"] },
  79: { text: "When solving problems, I prefer to:",         options: ["Follow established procedures", "Use a mix of proven methods and creativity", "Find completely new and innovative solutions"] },
  80: { text: "I am most productive when:",                  options: ["Working on one task at a time", "Juggling a few different projects", "Managing multiple tasks simultaneously"] },
  81: { text: "I prefer feedback that is:",                  options: ["Detailed and specific", "Balanced with praise and suggestions", "Brief and to the point"] },
  82: { text: "My ideal workspace would be:",                options: ["A private office with minimal distractions", "An open area where I can interact with colleagues", "A flexible space I can arrange as needed"] },
  83: { text: "I prefer to receive instructions that are:",  options: ["Very detailed and step-by-step", "Clear with some room for interpretation", "General guidelines that I can adapt"] },
  84: { text: "When working on long-term projects, I:",      options: ["Create detailed timelines and stick to them", "Set major milestones and adjust as needed", "Work intuitively and adapt as I go"] },
  85: { text: "I am most motivated by:",                     options: ["Personal achievement and recognition", "Team success and collaboration", "Making a positive impact on others"] },
  86: { text: "I handle stress best when I can:",            options: ["Plan ahead and prepare thoroughly", "Talk through problems with others", "Take breaks and manage my energy"] },
  87: { text: "I prefer meetings that are:",                 options: ["Well-structured with clear agendas", "Interactive with group participation", "Brief and focused on decisions"] },
  88: { text: "When learning new skills, I prefer:",         options: ["Formal training and structured courses", "Mentoring and on-the-job guidance", "Self-directed exploration and practice"] },
  89: { text: "I work best with supervisors who:",           options: ["Provide clear expectations and regular check-ins", "Offer support while allowing independence", "Give me complete autonomy"] },
  90: { text: "My ideal work pace is:",                      options: ["Steady and consistent", "Varied depending on the project", "Intense with periods of rest"] },
  91: { text: "I prefer to communicate through:",            options: ["Written reports and documentation", "Face-to-face conversations", "Quick messages and brief updates"] },
  92: { text: "When making decisions at work, I:",           options: ["Gather extensive information first", "Consult with others before deciding", "Trust my instincts and decide quickly"] },
  93: { text: "I am most satisfied when my work:",           options: ["Follows clear standards and procedures", "Allows for creativity within guidelines", "Breaks new ground and challenges norms"] },
  94: { text: "I prefer recognition that is:",               options: ["Private and personal", "Shared with my immediate team", "Public and visible to everyone"] },
  95: { text: "When conflicts arise at work, I:",            options: ["Prefer to address them through proper channels", "Try to mediate and find compromise", "Deal with them directly and immediately"] },
  96: { text: "My ideal career path would involve:",         options: ["Steady progression within one organization", "Growth through diverse experiences", "Creating my own opportunities and ventures"] },
};

const escapeForJsRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildOptionsJsArray = (opts) =>
  "[\n" +
  opts.map((opt) => `            "${opt.replace(/"/g, '\\"')}"`).join(",\n") +
  "\n          ]";

const patchQuestion = (text, questionId, data) => {
  // Each question entry in the generated file has this stable shape:
  //
  //         {
  //           "questionId": "73",
  //           "text": "I prefer to work:",
  //           "type": "likert",
  //           "options": [],
  //           ...
  //         },
  //
  // Match the entry by its quoted questionId, then within the entry
  // body replace `"type": "likert"` and `"options": []` precisely.
  // Stops at the entry's closing `}` so we never touch a neighbour.
  const entryRe = new RegExp(
    `(\\{\\s*"questionId":\\s*"${questionId}",[\\s\\S]*?\\})(,?)`,
    "g"
  );

  let didReplace = false;
  const next = text.replace(entryRe, (match, body, comma) => {
    // Idempotency guard — if this entry already has populated options,
    // skip it (re-running the patch shouldn't double-edit anything).
    if (/"options":\s*\[\s*"/.test(body)) return match;

    let updated = body
      .replace(
        /"text":\s*"[^"]*"/,
        `"text": ${JSON.stringify(data.text)}`
      )
      .replace(/"type":\s*"[^"]*"/, '"type": "single"')
      .replace(
        /"options":\s*\[\s*\]/,
        `"options": ${buildOptionsJsArray(data.options)}`
      );
    didReplace = true;
    return `${updated}${comma}`;
  });

  return { text: next, changed: didReplace };
};

const main = () => {
  const original = readFileSync(TARGET, "utf8");
  let working = original;
  const log = [];

  for (const [idStr, data] of Object.entries(WORK_STYLE_DATA)) {
    const before = working;
    const { text, changed } = patchQuestion(working, idStr, data);
    working = text;
    log.push({ id: idStr, changed, sizeDelta: text.length - before.length });
  }

  if (working === original) {
    console.log("No changes — Work Style data is already patched.");
    return;
  }

  writeFileSync(TARGET, working, "utf8");

  const changedCount = log.filter((l) => l.changed).length;
  const skippedCount = log.length - changedCount;
  console.log(
    `Patched ${changedCount} Work Style question(s) in ` +
      `comprehensive500Package.generated.js (${skippedCount} already up to date).`
  );
  console.log(
    "Next: run `npm run seed:assessment` and `npm run seed:demo-package` " +
      "to refresh the database with the updated questions."
  );
};

main();
