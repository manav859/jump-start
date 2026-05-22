// Bulk-convert every PNG under public/question-media/ to WebP.
//
// Why: PNGs in this folder were extracted from source PDFs and average
// 12 KB but have a long tail (a few mechanical stimuli over 80 KB).
// WebP at quality 80 is ~30–60% smaller for these line-art figures
// without visible quality loss. After conversion the data files in
// src/data/*QuestionMedia.js are updated to reference .webp; the PNGs
// are left in place as a fallback (and so an aborted conversion isn't
// catastrophic).
//
// Idempotent: re-running skips PNGs whose .webp sibling is already up
// to date (compared by mtime).
//
// Usage:
//   node scripts/convertQuestionMediaToWebp.mjs
//
// Quality budget: each output must stay under 100 KB. If a converted
// file exceeds the budget, the script logs a warning so the source
// asset can be audited manually.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "public", "question-media");
const QUALITY = 80;
const SIZE_BUDGET_BYTES = 100 * 1024;

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".png") {
      out.push(full);
    }
  }
  return out;
};

const main = async () => {
  if (!existsSync(ROOT)) {
    console.error(`No question-media folder at ${ROOT}`);
    process.exit(1);
  }

  const pngs = walk(ROOT);
  console.log(`Found ${pngs.length} PNG file(s) to convert.`);

  let converted = 0;
  let skipped = 0;
  let oversized = 0;
  let totalPngBytes = 0;
  let totalWebpBytes = 0;

  for (const pngPath of pngs) {
    const webpPath = pngPath.replace(/\.png$/i, ".webp");
    const pngStat = statSync(pngPath);
    totalPngBytes += pngStat.size;

    if (existsSync(webpPath)) {
      const webpStat = statSync(webpPath);
      if (webpStat.mtimeMs >= pngStat.mtimeMs) {
        totalWebpBytes += webpStat.size;
        skipped += 1;
        continue;
      }
    }

    await sharp(pngPath).webp({ quality: QUALITY }).toFile(webpPath);

    const webpStat = statSync(webpPath);
    totalWebpBytes += webpStat.size;
    converted += 1;

    if (webpStat.size > SIZE_BUDGET_BYTES) {
      oversized += 1;
      console.warn(
        `  ! oversized: ${basename(dirname(pngPath))}/${basename(webpPath)} = ${(
          webpStat.size / 1024
        ).toFixed(1)} KB`
      );
    }
  }

  const reduction =
    totalPngBytes > 0
      ? ((1 - totalWebpBytes / totalPngBytes) * 100).toFixed(1)
      : "0.0";

  console.log(`Converted: ${converted}, skipped (up-to-date): ${skipped}`);
  console.log(
    `PNG total:  ${(totalPngBytes / 1024).toFixed(1)} KB`
  );
  console.log(
    `WebP total: ${(totalWebpBytes / 1024).toFixed(1)} KB  (-${reduction}%)`
  );
  if (oversized) {
    console.warn(
      `${oversized} WebP file(s) exceeded the ${SIZE_BUDGET_BYTES / 1024} KB budget.`
    );
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
