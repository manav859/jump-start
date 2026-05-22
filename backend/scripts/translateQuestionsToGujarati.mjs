// Translate all 500 assessment questions to Gujarati (gu-IN).
//
// What this script does
// ---------------------
// 1. Loads the comprehensive 500-question package from
//    backend/config/comprehensive500Package.generated.js
// 2. For each question:
//      - text       → text_gu      (always translated)
//      - options[]  → options_gu[] (translated for S1/S2/S3/S5 single-choice
//                                   items; preserved as English for S4)
// 3. Calls the Anthropic API in batches of 20 to do the actual translation.
// 4. Writes the file back in-place, preserving the original module shape
//    (export default { sections: [...] }).
// 5. Idempotent + resumable: any question that already has text_gu populated
//    is skipped, so re-running picks up where a previous run stopped.
//
// Section policy
// --------------
// S1 Personality      120 items   — Likert stem + (24 Work Style options)
// S2 MI               80  items   — Likert stem only
// S3 Interest         90  items   — Likert + (36 Career Day options)
// S4 Aptitude         160 items   — Translate STEM only. Options stay in
//                                   English because they're numeric, symbolic,
//                                   or verbal-analogy English vocabulary where
//                                   translation would break the answer key.
// S5 EQ               50  items   — Likert stem only
//
// Likert items already carry empty options[] in the bank; the live UI renders
// a section-level scale, so options_gu stays empty for those.
//
// Requirements
// ------------
// 1. `npm i @anthropic-ai/sdk` in jumpstart/backend
// 2. ANTHROPIC_API_KEY exported in env (or in jumpstart/backend/.env)
// 3. Network access to api.anthropic.com
//
// Usage
// -----
//   ANTHROPIC_API_KEY=sk-ant-... npm run translate:questions:gu
//   ANTHROPIC_API_KEY=sk-ant-... npm run translate:questions:gu -- --dry-run
//   ANTHROPIC_API_KEY=sk-ant-... npm run translate:questions:gu -- --section=4
//
// Flags
// -----
//   --dry-run             Skip the API call; emit placeholder Gujarati so the
//                         pipeline can be tested end-to-end without spend.
//   --section=N           Translate only one section (1-5).
//   --batch-size=N        Override the default 20-question batch size.
//   --force               Re-translate questions even if text_gu is populated.
//   --model=name          Override the default model.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "..");
const PACKAGE_PATH = path.join(
  BACKEND_ROOT,
  "config",
  "comprehensive500Package.generated.js"
);

dotenv.config({ path: path.join(BACKEND_ROOT, ".env") });

// -------------------------------- CLI args -------------------------------- //

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=").slice(1).join("=");
  if (args.includes(`--${name}`)) return true;
  return fallback;
};

const DRY_RUN = Boolean(flag("dry-run"));
const FORCE = Boolean(flag("force"));
const ONLY_SECTION = flag("section") ? Number(flag("section")) : null;
const BATCH_SIZE = Number(flag("batch-size") || 20);
const MODEL = String(flag("model") || "claude-sonnet-4-6");

// ------------------------ Standard Likert mappings ----------------------- //
// Reserved for future use if the bank ever stores per-question Likert option
// strings; the live UI today renders these from the section scale, not from
// question.options.
//
// const STANDARD_LIKERT_GU = {
//   "Strongly Agree":    "સંપૂર્ણ સહમત",
//   "Agree":             "સહમત",
//   "Neutral":           "તટસ્થ",
//   "Disagree":          "અસહમત",
//   "Strongly Disagree": "સંપૂર્ણ અસહમત",
// };

// ----------------------------- Package I/O ------------------------------- //

async function loadPackage() {
  // The package file is an ES module exporting an object. Import it once,
  // clone it (so we own the structure), and remember the original module
  // shape so the writer below can preserve `export default ...`.
  const mod = await import(pathToFileURL(PACKAGE_PATH).href);
  const pkg = mod.default || mod;
  return JSON.parse(JSON.stringify(pkg));
}

function writePackage(pkg) {
  // Write a deterministic, human-readable ES module. The scorer / seeder reads
  // this via `import`, so any valid JS module works; emitting JSON-as-default
  // keeps the file small and re-orderable.
  const body =
    `// AUTO-GENERATED — comprehensive 500-question package with Gujarati translations.\n` +
    `// Regenerate via:  npm run translate:questions:gu\n` +
    `// Last updated: ${new Date().toISOString()}\n\n` +
    `const PACKAGE = ${JSON.stringify(pkg, null, 2)};\n\n` +
    `export default PACKAGE;\n`;
  fs.writeFileSync(PACKAGE_PATH, body, "utf8");
}

// ----------------------------- Translation ------------------------------- //

let anthropicClient = null;
async function getClient() {
  if (DRY_RUN) return null;
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to jumpstart/backend/.env or export it before running."
    );
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

function buildBatchPrompt(items) {
  // items: [{ id, text, options?: string[], translateOptions: boolean, kind: 'likert'|'single'|'s4' }]
  return [
    "You are a professional translator producing Gujarati (gu-IN) translations of a career-aptitude assessment for Indian high-school students.",
    "",
    "Translation rules:",
    "- Translate every `text` field into natural, conversational Gujarati using gu-IN script.",
    "- Keep meaning and tone faithful: psychological items must remain self-report statements; aptitude items must keep their cognitive intent.",
    "- Keep proper nouns, brand names, numbers, mathematical symbols, formulas, and figures unchanged.",
    "- For Likert scale items, do NOT include the rating labels in your translation — the UI renders those separately.",
    "- For an item that has `translateOptions: true`, translate every option string in the same order. For `translateOptions: false`, return the options array exactly as given (do not modify or omit it).",
    "- Standard Likert labels (used only by the UI, FYI): Strongly Agree = સંપૂર્ણ સહમત, Agree = સહમત, Neutral = તટસ્થ, Disagree = અસહમત, Strongly Disagree = સંપૂર્ણ અસહમત.",
    "- Output ONLY a JSON array. No commentary, no markdown fences, no preamble.",
    "- Each output element must have exactly: { id, text_gu, options_gu }.",
    "- options_gu must be an array of strings of the same length as the input options (use [] when no options were provided).",
    "",
    "Items to translate:",
    JSON.stringify(items, null, 2),
  ].join("\n");
}

async function translateBatch(items) {
  if (DRY_RUN) {
    // Emit obviously-placeholder Gujarati so the writer / seeder can be
    // dry-run end-to-end without spending any API budget.
    return items.map((item) => ({
      id: item.id,
      text_gu: `[GU] ${item.text}`,
      options_gu: item.translateOptions
        ? (item.options || []).map((opt) => `[GU] ${opt}`)
        : item.options || [],
    }));
  }

  const client = await getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: buildBatchPrompt(items) }],
  });

  const raw = (response.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  // Strip any accidental markdown fences just in case.
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    console.error("Failed to parse model response. First 500 chars:\n", stripped.slice(0, 500));
    throw err;
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array, got ${typeof parsed}`);
  }
  return parsed;
}

// ----------------------------- Orchestration ----------------------------- //

function selectSectionsToTranslate(pkg) {
  if (!ONLY_SECTION) return pkg.sections;
  const idx = ONLY_SECTION - 1;
  if (idx < 0 || idx >= pkg.sections.length) {
    throw new Error(`--section=${ONLY_SECTION} is out of range (1..${pkg.sections.length})`);
  }
  return [pkg.sections[idx]];
}

function buildItem(question, sectionIndex) {
  const isS4 = sectionIndex === 3;
  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  return {
    id: question.questionId,
    text: question.text,
    options: question.options || [],
    // S4 keeps options in English — they're numeric, symbolic, or verbal-
    // analogy English vocabulary where translation would break the answer key.
    translateOptions: hasOptions && !isS4,
    kind: isS4 ? "s4" : question.type,
  };
}

function applyTranslation(question, translation, sectionIndex) {
  question.text_gu = translation.text_gu || "";
  const isS4 = sectionIndex === 3;
  if (isS4) {
    // For S4, options_gu mirrors the original English options so the UI
    // doesn't fall back to empty text. (Frontend reads options_gu first.)
    question.options_gu = Array.isArray(question.options) ? [...question.options] : [];
  } else if (Array.isArray(translation.options_gu)) {
    question.options_gu = translation.options_gu;
  } else {
    question.options_gu = [];
  }
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log("[translate:gu] loading package…");
  const pkg = await loadPackage();
  const sectionsToWork = selectSectionsToTranslate(pkg);

  // Build the work queue: { question, sectionIndex } for each item that needs
  // translation (text_gu empty, or --force).
  const queue = [];
  pkg.sections.forEach((section, sectionIndex) => {
    if (!sectionsToWork.includes(section)) return;
    (section.questions || []).forEach((question) => {
      const needs =
        FORCE || !question.text_gu || String(question.text_gu).trim() === "";
      if (needs) queue.push({ question, sectionIndex });
    });
  });

  const total = queue.length;
  console.log(
    `[translate:gu] ${total} questions to translate${
      FORCE ? " (force re-translation)" : ""
    }${DRY_RUN ? " — DRY RUN" : ""}.`
  );
  if (total === 0) {
    console.log("[translate:gu] nothing to do.");
    return;
  }

  const batches = chunk(queue, BATCH_SIZE);
  let done = 0;
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const items = batch.map(({ question, sectionIndex }) =>
      buildItem(question, sectionIndex)
    );

    const firstId = items[0].id;
    const lastId = items[items.length - 1].id;
    console.log(
      `[translate:gu] batch ${b + 1}/${batches.length} (Q${firstId}–Q${lastId}, ${items.length} items)…`
    );

    const start = Date.now();
    let translations;
    try {
      translations = await translateBatch(items);
    } catch (err) {
      console.error(`[translate:gu] batch ${b + 1} failed:`, err.message);
      // Persist partial progress before bailing so a re-run skips the work
      // that already succeeded.
      writePackage(pkg);
      throw err;
    }

    // Re-map by id so a model that returns items out of order still applies
    // cleanly.
    const byId = new Map();
    translations.forEach((t) => byId.set(String(t.id), t));

    batch.forEach(({ question, sectionIndex }) => {
      const t = byId.get(String(question.questionId));
      if (!t) {
        console.warn(
          `  [warn] missing translation for Q${question.questionId} — leaving English fallback`
        );
        return;
      }
      applyTranslation(question, t, sectionIndex);
    });

    done += batch.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `  done ${done}/${total} (${elapsed}s for this batch)`
    );

    // Flush after every batch so a crash mid-run still preserves progress.
    writePackage(pkg);
  }

  console.log(`[translate:gu] complete. Package written: ${PACKAGE_PATH}`);
  console.log(
    "[translate:gu] next steps: npm run seed:assessment && npm run seed:demo-package"
  );
}

main().catch((err) => {
  console.error("[translate:gu] fatal:", err);
  process.exit(1);
});
