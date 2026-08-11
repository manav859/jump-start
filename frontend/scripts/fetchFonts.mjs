// Self-hosts the webfonts that used to come from fonts.googleapis.com.
//
// Why this exists
// ---------------
// index.css previously opened with:
//
//     @import url("https://fonts.googleapis.com/css2?family=Inter...")
//
// An @import at the top of a stylesheet is the worst possible place for a
// font: the browser must download index.css, parse it, discover the
// @import, open a *new* TLS connection to fonts.googleapis.com, download
// that CSS, and only then discover the .woff2 URLs on fonts.gstatic.com —
// a third connection. Three serial round trips before a single glyph can
// paint, and the whole chain is render-blocking. On the Home page the LCP
// element is the <h1>, so that chain literally sets the LCP.
//
// Self-hosting collapses it to one hop against our own origin, which is
// already warm from the HTML request and (behind Nginx/CDN) is HTTP/2
// multiplexed on the same connection.
//
// What it downloads
// -----------------
// Only the subsets we actually render:
//   - Inter / Poppins  -> latin + latin-ext
//   - Noto Sans Gujarati -> gujarati (+ latin for mixed strings)
// Google serves ~10 subsets per family (cyrillic, greek, vietnamese...).
// Dropping the ones we never render is most of the byte saving.
//
// Output
// ------
//   public/fonts/*.woff2      stable paths, safe to preload + cache forever
//   src/styles/fonts.css      @font-face block, imported by index.css
//
// Re-run with:  npm run fonts:fetch

import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// fontkit's ESM build does not register its woff2/brotli decoder, so
// openSync() returns an undecoded shim for .woff2. The CJS build does.
const fontkit = createRequire(import.meta.url)("fontkit");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(ROOT, "public", "fonts");
const CSS_OUT = path.join(ROOT, "src", "styles", "fonts.css");

// A modern desktop UA is required — Google serves .ttf to unrecognised
// clients and only hands out .woff2 to browsers it knows support it.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FAMILIES = [
  {
    // Body copy. 400-800 covers every weight used across the app.
    spec: "Inter:wght@400;500;600;700;800",
    subsets: ["latin", "latin-ext"],
  },
  {
    // Headings (h1-h6) — including the Home <h1>, our LCP element.
    spec: "Poppins:wght@400;500;600;700;800",
    subsets: ["latin", "latin-ext"],
  },
  {
    // Gujarati assessment content. The site chrome is English-locked, but
    // the 500-question Gujarati package renders Gujarati glyphs inside a
    // lang="en" document, so we still need the face — just never on the
    // critical path (it is not preloaded).
    spec: "Noto+Sans+Gujarati:wght@400;500;600;700",
    subsets: ["gujarati", "latin"],
  },
];

// ---------------------------------------------------------------------
// Metric-matched fallbacks
// ---------------------------------------------------------------------
// font-display:swap paints text immediately in a fallback face, then
// swaps to the real one. If the two faces have different metrics the
// text re-flows on swap — that reflow is pure CLS, and it hits every
// text block on the page at once.
//
// The fix is a @font-face that aliases the local fallback (Arial) but
// overrides its metrics to match the webfont, so the swap is
// dimensionally a no-op.
//
// size-adjust is derived by actually typesetting a frequency-weighted
// sample and comparing advance widths. We deliberately do NOT use OS/2
// xAvgCharWidth: foundries compute it inconsistently (Poppins reports
// 0.85em, which would yield a nonsense 167% adjustment) whereas real
// glyph advances are directly comparable.
const SAMPLE =
  "etaoinshrdlcumwfgypbvkjxqz ETAOINSHRDLCUMWFGYPBVKJXQZ .,";

// `weight` instances a variable font at that axis position before
// measuring — a variable file's default instance is 400, and measuring
// only that would give bold text the regular weight's metrics.
const readMetrics = (font) => {
  const run = font.layout(SAMPLE);
  return {
    adv: run.advanceWidth / font.unitsPerEm / SAMPLE.length,
    upm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    lineGap: font.lineGap,
  };
};

const measure = (file, weight) => {
  const base = fontkit.openSync(file);

  // A variation instance shares the parent's cmap by reference, which
  // fontkit does not always wire up for WOFF2-backed fonts — layout()
  // then throws on the first codepoint lookup. Try the instance, and
  // quietly use the default instance if it isn't usable.
  if (weight && base.variationAxes?.wght) {
    try {
      return readMetrics(base.getVariation({ wght: weight }));
    } catch {
      /* fall through to the default instance */
    }
  }

  return readMetrics(base);
};

// Arial is the de-facto fallback on Windows/macOS; Liberation Sans is
// its metric clone on Linux. Read whichever exists so the ratio is
// computed against a real font rather than hardcoded constants.
const FALLBACK_CANDIDATES = [
  "C:/Windows/Fonts/arial.ttf",
  "/Library/Fonts/Arial.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
];

const fallbackMetrics = () => {
  for (const p of FALLBACK_CANDIDATES) {
    if (existsSync(p)) return { ...measure(p), path: p };
  }
  // Published Arial metrics, used when no local copy is available
  // (e.g. a slim CI container). Same numbers the local file yields.
  return { adv: 0.5603201729910714, upm: 2048, path: "(built-in Arial metrics)" };
};

const pct = (n) => `${(n * 100).toFixed(2)}%`;

const overridesFor = (m, fb) => {
  const sizeAdjust = m.adv / fb.adv;
  // Overrides are expressed relative to the *adjusted* em, so divide
  // each metric by sizeAdjust after normalising to the font's own em.
  return {
    "size-adjust": pct(sizeAdjust),
    "ascent-override": pct(m.ascent / m.upm / sizeAdjust),
    "descent-override": pct(Math.abs(m.descent) / m.upm / sizeAdjust),
    "line-gap-override": pct(m.lineGap / m.upm / sizeAdjust),
  };
};

const renderFallbackFace = (family, weightDecl, overrides) =>
  [
    "@font-face {",
    `  font-family: '${family} Fallback';`,
    "  src: local('Arial'), local('Helvetica'), local('Liberation Sans');",
    `  font-weight: ${weightDecl};`,
    "  font-style: normal;",
    ...Object.entries(overrides).map(([k, v]) => `  ${k}: ${v};`),
    "}",
  ].join("\n");

// Variable fonts yield one measurement for every weight, so the naive
// per-weight output is five byte-identical rules. Collapse runs that
// share metrics into a single `font-weight: min max` face.
const collapseFallbacks = (entries) => {
  const byKey = new Map();
  for (const e of entries) {
    const key = `${e.family}|${JSON.stringify(e.overrides)}`;
    const hit = byKey.get(key);
    if (hit) {
      hit.min = Math.min(hit.min, e.weight);
      hit.max = Math.max(hit.max, e.weight);
    } else {
      byKey.set(key, { ...e, min: e.weight, max: e.weight });
    }
  }
  return [...byKey.values()].map((e) =>
    renderFallbackFace(
      e.family,
      e.min === e.max ? `${e.min}` : `${e.min} ${e.max}`,
      e.overrides,
    ),
  );
};

const fetchCss = async (spec) => {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
};

// Google's CSS is a flat list of `/* subset */ @font-face {...}` pairs.
// The comment immediately preceding each block is the only place the
// subset name appears, so we parse them as pairs.
const parseBlocks = (css) => {
  const blocks = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    blocks.push({ subset: m[1], body: m[2] });
  }
  return blocks;
};

const run = async () => {
  await mkdir(FONT_DIR, { recursive: true });
  await mkdir(path.dirname(CSS_OUT), { recursive: true });

  // Clear stale files so a changed weight list doesn't leave orphans
  // behind that we'd keep shipping and caching forever.
  if (existsSync(FONT_DIR)) {
    for (const f of await readdir(FONT_DIR)) {
      if (f.endsWith(".woff2")) await rm(path.join(FONT_DIR, f));
    }
  }

  const out = [];
  let skipped = 0;
  let bytes = 0;

  out.push("/* AUTO-GENERATED by scripts/fetchFonts.mjs — do not edit.");
  out.push("   Re-run `npm run fonts:fetch` to refresh. */");
  out.push("");

  // Inter and Noto Sans Gujarati are variable fonts: Google emits one
  // @font-face per requested weight but every one of them points at the
  // SAME .woff2. Downloading per-weight would ship five identical 48 KB
  // files. Group by remote URL so each file lands once, then collapse the
  // group into a single @font-face with a `font-weight: min max` range —
  // which is what a variable font wants anyway.
  const groups = new Map();

  for (const { spec, subsets } of FAMILIES) {
    const css = await fetchCss(spec);

    for (const { subset, body } of parseBlocks(css)) {
      if (!subsets.includes(subset)) {
        skipped += 1;
        continue;
      }

      const remote = (body.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
      if (!remote) continue;

      const family = (body.match(/font-family:\s*'([^']+)'/) || [])[1] || "font";
      const weight = Number(
        (body.match(/font-weight:\s*(\d+)/) || [])[1] || 400,
      );

      const existing = groups.get(remote);
      if (existing) {
        existing.min = Math.min(existing.min, weight);
        existing.max = Math.max(existing.max, weight);
      } else {
        groups.set(remote, { remote, family, subset, body, min: weight, max: weight });
      }
    }
  }

  const fb = fallbackMetrics();
  const fallbackEntries = [];

  for (const g of groups.values()) {
    const slug = g.family.toLowerCase().replace(/\s+/g, "-");
    // Variable faces get a range suffix, static faces keep their weight.
    const tag = g.min === g.max ? `${g.min}` : `${g.min}-${g.max}var`;
    const file = `${slug}-${g.subset}-${tag}.woff2`;
    const abs = path.join(FONT_DIR, file);

    const res = await fetch(g.remote, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${g.remote} -> HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(abs, buf);
    bytes += buf.length;

    // Emit a metric-matched fallback for the Latin faces of the two UI
    // families. The Gujarati face is skipped: Arial has no Gujarati
    // coverage, so overriding its metrics would be meaningless.
    if (g.subset === "latin" && g.family !== "Noto Sans Gujarati") {
      // One fallback per weight, each measured at that weight. Poppins
      // 700 is 8.9% wider than Arial where 400 is only 2.4%, so a single
      // averaged fallback would leave the LCP <h1> shifting on swap.
      const weights =
        g.min === g.max
          ? [g.min]
          : [400, 500, 600, 700, 800].filter((w) => w >= g.min && w <= g.max);
      for (const w of weights) {
        fallbackEntries.push({
          family: g.family,
          weight: w,
          overrides: overridesFor(measure(abs, w), fb),
        });
      }
    }

    // Point the rule at our own origin. font-display:swap is already in
    // Google's output; we keep it so text paints immediately in the
    // fallback face rather than staying invisible for up to 3s.
    const weightDecl =
      g.min === g.max ? `font-weight: ${g.min};` : `font-weight: ${g.min} ${g.max};`;

    out.push(
      g.body
        .replace(g.remote, `/fonts/${file}`)
        .replace(/font-weight:\s*\d+;/, weightDecl)
        .trim(),
    );
    out.push("");
  }

  const kept = groups.size;

  const fallbackFaces = collapseFallbacks(fallbackEntries);

  out.push("/* Metric-matched fallbacks — see overridesFor() for how these");
  out.push(`   are derived. Measured against ${fb.path}. */`);
  out.push("");
  out.push(...fallbackFaces.map((f) => `${f}\n`));

  await writeFile(CSS_OUT, out.join("\n"), "utf8");

  console.log(`fonts: ${kept} faces kept, ${skipped} subsets skipped`);
  console.log(`fonts: ${(bytes / 1024).toFixed(0)} KB written to public/fonts/`);
  console.log(`fonts: ${fallbackFaces.length} metric-matched fallback faces`);
  console.log(`fonts: css written to src/styles/fonts.css`);
};

run().catch((err) => {
  console.error("font fetch failed:", err.stack);
  process.exit(1);
});
