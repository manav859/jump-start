// Build-time image optimizer — the self-hosted replacement for Vercel's
// automatic image optimization.
//
// Runs as part of `npm run build` (see package.json), before vite build,
// so the generated variants are picked up as normal Vite assets and get
// content-hashed filenames + immutable caching for free.
//
// For every raster source in src/assets/ it emits, alongside the
// original:
//   name.avif / name.webp                  (full size, modern formats)
//   name-<w>.avif / name-<w>.webp          (responsive widths, large
//                                           images only)
// The original PNG/JPG is left untouched as the <picture> fallback.
//
// Why build-time rather than an on-the-fly resizing service: every image
// in this app is a static asset committed to the repo — there are no
// user uploads and no remote images. A runtime resizer would add a
// sharp process, a cache directory and an invalidation problem to solve
// a problem we do not have. If dynamic images are introduced later, the
// on-the-fly endpoint documented in docs/VPS_DEPLOYMENT.md is the drop-in
// counterpart and uses the same format/width ladder as this script.
//
// Re-run standalone with:  npm run images:optimize

import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.join(ROOT, "src", "assets");

// public/question-media is deliberately NOT handled here. It already has
// a dedicated converter — scripts/convertQuestionMediaToWebp.mjs — which
// owns those files and also rewrites the src/data/*QuestionMedia.js
// references to match. Two scripts writing the same .webp paths at
// different quality settings just means whichever ran last wins, and the
// committed assets churn on every build.

// Widths to emit for images wide enough to need them. Anything narrower
// than the smallest step is emitted at its natural size only — resizing
// a 187px logo to 320px would upscale it.
const WIDTHS = [320, 640, 960, 1280, 1920];

// Below this width an image is treated as a fixed-size icon: modern
// formats still help, extra widths do not.
const RESPONSIVE_MIN_WIDTH = 640;

// AVIF encodes slower but lands ~20-30% below WebP at equal quality.
// Both are emitted so <picture> can pick per browser support.
const AVIF = { quality: 55, effort: 4 };
const WEBP = { quality: 78, effort: 4 };

const isRaster = (f) => /\.(png|jpe?g)$/i.test(f);

const collect = async (dir) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collect(full)));
    else if (isRaster(entry.name)) out.push(full);
  }
  return out;
};

// Skip work when the variant is already newer than its source, so
// repeat builds stay fast (AVIF encoding is the slow part).
const isFresh = async (src, out) => {
  if (!existsSync(out)) return false;
  const [a, b] = await Promise.all([stat(src), stat(out)]);
  return b.mtimeMs >= a.mtimeMs;
};

const run = async () => {
  const files = await collect(ASSET_DIR);

  let written = 0;
  let skipped = 0;
  let srcBytes = 0;
  let outBytes = 0;

  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file).replace(/\.(png|jpe?g)$/i, "");
    const image = sharp(file);
    const meta = await image.metadata();
    srcBytes += (await stat(file)).size;

    const widths =
      meta.width >= RESPONSIVE_MIN_WIDTH
        ? [...WIDTHS.filter((w) => w < meta.width), meta.width]
        : [meta.width];

    for (const w of widths) {
      // The natural-width variant keeps the bare name so the <picture>
      // default src stays predictable; narrower ones carry a -<w> suffix.
      const suffix = w === meta.width ? "" : `-${w}`;

      for (const [ext, opts] of [
        ["avif", AVIF],
        ["webp", WEBP],
      ]) {
        const out = path.join(dir, `${base}${suffix}.${ext}`);
        if (await isFresh(file, out)) {
          skipped += 1;
          outBytes += (await stat(out)).size;
          continue;
        }

        await mkdir(dir, { recursive: true });
        const pipeline = sharp(file);
        if (w !== meta.width) pipeline.resize({ width: w });
        await pipeline[ext](opts).toFile(out);

        written += 1;
        outBytes += (await stat(out)).size;
      }
    }
  }

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  console.log(`images: ${files.length} sources`);
  console.log(`images: ${written} variants written, ${skipped} already fresh`);
  console.log(
    `images: originals ${mb(srcBytes)} -> variants ${mb(outBytes)} ` +
      `(${((1 - outBytes / srcBytes) * 100).toFixed(0)}% smaller in aggregate)`,
  );
};

run().catch((err) => {
  console.error("image optimization failed:", err.message);
  process.exit(1);
});
