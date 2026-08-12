// Post-build guard: fail the build if any two emitted chunks import each
// other.
//
// Why this exists
// ---------------
// A production deploy white-screened with:
//
//   Uncaught TypeError: Cannot read properties of undefined
//   (reading 'createContext')   at i18n-[hash].js
//
// React ships as CommonJS, so Rollup needs its getDefaultExportFromCjs
// interop helper. That helper is emitted into exactly one chunk and
// imported by every other chunk that needs it. With i18next/react-i18next
// split into their own manual chunk, the helper landed *there* — so the
// vendor chunk imported it from i18n while i18n imported React from
// vendor. A cycle.
//
// ES modules resolve cycles by leaving one side's bindings uninitialised
// rather than erroring. The side that lost was React, which
// react-i18next dereferences at module-evaluation time. Hence `undefined`
// where a namespace object should be.
//
// The critical property: `vite build` succeeds either way. The graph is
// only wrong at runtime, so it has to be asserted against the emitted
// output. That is what this script does.
//
// Keeping vendor free of *outgoing* chunk imports is the invariant that
// actually matters — a chunk can only be in a cycle if it both imports
// and is imported.

import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve(process.cwd(), "dist/assets");

if (!fs.existsSync(DIR)) {
  console.error(`check-chunk-cycles: ${DIR} not found — run vite build first.`);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js"));

if (!files.length) {
  console.error("check-chunk-cycles: no .js chunks in dist/assets.");
  process.exit(1);
}

// Static imports only. `import()` is asynchronous and deliberately
// excluded: a dynamic edge cannot produce the uninitialised-binding
// failure this guards against, and lazy routes legitimately form them.
const STATIC_IMPORT = /(?:^|[;\s])import\s*(?:[^"';]*?from\s*)?["']\.\/([^"']+)["']/g;

const graph = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(DIR, f), "utf8");
  const deps = new Set();
  for (const m of src.matchAll(STATIC_IMPORT)) deps.add(m[1]);
  graph.set(f, deps);
}

// Iterative-safe DFS with a visiting/visited colouring.
const cycles = [];
const state = new Map(); // 0 = on stack, 1 = fully explored

const walk = (node, stack) => {
  if (state.get(node) === 1) return;
  if (state.get(node) === 0) {
    cycles.push([...stack.slice(stack.indexOf(node)), node]);
    return;
  }
  state.set(node, 0);
  stack.push(node);
  for (const dep of graph.get(node) || []) {
    if (graph.has(dep)) walk(dep, stack);
  }
  stack.pop();
  state.set(node, 1);
};

for (const f of files) walk(f, []);

if (cycles.length) {
  console.error(
    `\ncheck-chunk-cycles: FAIL — ${cycles.length} circular chunk import(s).\n`,
  );
  for (const c of cycles) console.error("  " + c.join("\n    -> "));
  console.error(
    "\nA cycle means one chunk's exports are uninitialised when the other " +
      "evaluates.\nIf React is on the losing side the app white-screens at " +
      "load.\n\nFix: in vite.config.js manualChunks, keep every " +
      "React-consuming package in the\nsame chunk as React itself, so no " +
      "sibling chunk both imports and is imported\nby vendor.\n",
  );
  process.exit(1);
}

const vendor = files.find((f) => /^vendor-/.test(f));
const vendorOut = vendor ? [...(graph.get(vendor) || [])] : [];

console.log(
  `check-chunk-cycles: OK — ${files.length} chunks, no import cycles.`,
);
if (vendor) {
  console.log(
    `check-chunk-cycles: ${vendor} imports ${
      vendorOut.length ? vendorOut.join(", ") : "nothing"
    }.`,
  );
}
