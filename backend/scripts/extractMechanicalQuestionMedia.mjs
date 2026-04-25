/**
 * Extract Mechanical Reasoning question media from the source PDF.
 *
 * Follows the same pattern as extractSpatialQuestionMedia.mjs:
 *  1. Open "Mechanical & Spatial Questions.pdf"
 *  2. Render the relevant pages at 2× scale
 *  3. Crop each question's diagram region
 *  4. Save as stimulus.png in  /question-media/mechanical/q<ID>/
 *
 * Unlike spatial questions that have both stimulus + option images,
 * mechanical questions only need the stimulus diagram — options are text.
 *
 * Usage:  node backend/scripts/extractMechanicalQuestionMedia.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const generatedAssetRoot = path.resolve(
  backendRoot,
  "tmp-pdf",
  "mechanical-assets"
);
const frontendAssetRoot = path.resolve(
  backendRoot,
  "..",
  "frontend",
  "public",
  "question-media",
  "mechanical"
);
const sourcePdfPath = path.resolve(
  backendRoot,
  "..",
  "..",
  "Mechanical & Spatial Questions.pdf"
);

/**
 * Mechanical questions start on page 24 of the PDF.
 *
 * Mapping:  PDF Q-number  →  questionId  →  page + crop region (at scale 2).
 *
 * Page thumbnails were rendered at scale 1.5 (918×1188 px).
 * The extraction renders at scale 2, so coordinates are multiplied by 2/1.5 ≈ 1.333.
 * All coordinates below are specified at scale 2 (matching the spatial extraction script).
 */
const QUESTION_CROPS = {
  // PDF Q1 = questionId 391 — Pulley system (page 24)
  391: {
    stimulus: { page: 24, x: 170, y: 290, w: 380, h: 380 },
  },
  // PDF Q2 = questionId 392 — Gear wheels K, L, M (page 24)
  392: {
    stimulus: { page: 24, x: 76, y: 840, w: 440, h: 130 },
  },
  // PDF Q4 = questionId 394 — Pulley rope system (page 25)
  394: {
    stimulus: { page: 25, x: 105, y: 160, w: 550, h: 530 },
  },
  // PDF Q10 = questionId 400 — Big wheel A, small wheel B (page 26)
  400: {
    stimulus: { page: 26, x: 160, y: 760, w: 480, h: 310 },
  },
  // PDF Q26 = questionId 401 — Circuit diagram (page 31)
  401: {
    stimulus: { page: 31, x: 100, y: 920, w: 500, h: 480 },
  },
  // PDF Q12 = questionId 402 — Gear train A, B, C, D + answer arrows (page 27)
  402: {
    stimulus: { page: 27, x: 60, y: 440, w: 740, h: 480 },
  },
  // PDF Q15 = questionId 406 — Earth-Sun orbit (page 28)
  406: {
    stimulus: { page: 28, x: 140, y: 560, w: 360, h: 510 },
  },
  // PDF Q20 = questionId 410 — Atmosphere/Earth diagram (pages 29-30)
  410: {
    stimulus: { page: 30, x: 130, y: 50, w: 560, h: 620 },
  },
  // PDF Q31 = questionId 405 — Hydraulic crane (page 33)
  405: {
    stimulus: { page: 33, x: 50, y: 230, w: 900, h: 510 },
  },
};

const clampCrop = (crop, width, height) => {
  if (!crop) return null;
  const x = Math.max(0, Math.min(crop.x, width));
  const y = Math.max(0, Math.min(crop.y, height));
  const w = Math.max(1, Math.min(crop.w, width - x));
  const h = Math.max(1, Math.min(crop.h, height - y));
  return { ...crop, x, y, w, h };
};

const cropCanvas = (sourceCanvas, crop) => {
  const target = createCanvas(crop.w, crop.h);
  const ctx = target.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, crop.w, crop.h);
  ctx.drawImage(sourceCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  return target;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const syncDirectory = (sourceDir, targetDir) => {
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const src = path.join(sourceDir, entry.name);
    const dst = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      syncDirectory(src, dst);
    } else {
      try {
        fs.copyFileSync(src, dst);
      } catch (err) {
        console.warn(`Skipping sync ${src} → ${dst}: ${err.message}`);
      }
    }
  }
};

const renderPageCanvas = async (pdf, pageNumber) => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
};

const writeCrop = (pageCanvas, crop, outputPath) => {
  const safeCrop = clampCrop(crop, pageCanvas.width, pageCanvas.height);
  if (!safeCrop) return;
  const cropped = cropCanvas(pageCanvas, safeCrop);
  fs.writeFileSync(outputPath, cropped.toBuffer("image/png"));
};

const buildAssets = async () => {
  if (!fs.existsSync(sourcePdfPath)) {
    throw new Error(`Missing source PDF: ${sourcePdfPath}`);
  }

  ensureDir(generatedAssetRoot);

  // Collect the set of PDF pages we need to render
  const requestedPages = new Set();
  for (const config of Object.values(QUESTION_CROPS)) {
    if (config.stimulus) {
      requestedPages.add(config.stimulus.page);
    }
  }

  const loadingTask = getDocument({
    data: new Uint8Array(fs.readFileSync(sourcePdfPath)),
    disableFontFace: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;

  // Render only the pages we need
  const pageCanvases = new Map();
  for (const pageNumber of [...requestedPages].sort((a, b) => a - b)) {
    console.log(`  Rendering page ${pageNumber}...`);
    pageCanvases.set(pageNumber, await renderPageCanvas(pdf, pageNumber));
  }

  // Crop and save each question's stimulus
  for (const [questionId, config] of Object.entries(QUESTION_CROPS)) {
    const qDir = path.join(
      generatedAssetRoot,
      `q${String(questionId).padStart(3, "0")}`
    );
    fs.mkdirSync(qDir, { recursive: true });

    if (config.stimulus) {
      const pageCanvas = pageCanvases.get(config.stimulus.page);
      writeCrop(pageCanvas, config.stimulus, path.join(qDir, "stimulus.png"));
      console.log(`  ✓ Q${questionId} stimulus extracted`);
    }
  }

  console.log(`\nGenerated mechanical media in ${generatedAssetRoot}`);
  syncDirectory(generatedAssetRoot, frontendAssetRoot);
  console.log(`Synced mechanical media to ${frontendAssetRoot}`);
};

buildAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
