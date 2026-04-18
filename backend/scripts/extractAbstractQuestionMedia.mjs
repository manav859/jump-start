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
  "abstract-assets"
);
const frontendAssetRoot = path.resolve(
  backendRoot,
  "..",
  "frontend",
  "public",
  "question-media",
  "abstract"
);
const sourcePdfPath = path.resolve(
  backendRoot,
  "reference",
  "complete-aptitude-test-500q.pdf"
);

const buildSequentialPrompts = ({
  startQuestionId,
  endQuestionId,
  page,
  startY,
  step,
  x = 90,
  w = 1040,
  h = 56,
}) =>
  Object.fromEntries(
    Array.from(
      { length: endQuestionId - startQuestionId + 1 },
      (_, index) => startQuestionId + index
    ).map((questionId, index) => [
      questionId,
      {
        page,
        x,
        y: startY + index * step,
        w,
        h,
      },
    ])
  );

const QUESTION_PROMPT_CROPS = {
  ...buildSequentialPrompts({
    startQuestionId: 341,
    endQuestionId: 343,
    page: 18,
    startY: 1272,
    step: 86,
    h: 48,
  }),
  ...buildSequentialPrompts({
    startQuestionId: 344,
    endQuestionId: 363,
    page: 19,
    startY: 48,
    step: 74,
    h: 46,
  }),
  ...buildSequentialPrompts({
    startQuestionId: 364,
    endQuestionId: 364,
    page: 20,
    startY: 48,
    step: 82,
    h: 40,
  }),
  365: {
    page: 20,
    x: 90,
    y: 130,
    w: 1040,
    h: 32,
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
  ctx.drawImage(
    sourceCanvas,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    crop.w,
    crop.h
  );
  return target;
};

const ensureDir = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const copyFileWithReplace = (sourcePath, targetPath) => {
  try {
    fs.copyFileSync(sourcePath, targetPath);
    return;
  } catch (error) {
    if (error.code !== "EPERM") {
      throw error;
    }
  }

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { force: true });
  }

  fs.writeFileSync(targetPath, fs.readFileSync(sourcePath));
};

const syncDirectory = (sourceDir, targetDir) => {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      syncDirectory(sourcePath, targetPath);
      continue;
    }

    try {
      copyFileWithReplace(sourcePath, targetPath);
    } catch (error) {
      console.warn(
        `Skipping frontend sync for ${sourcePath} -> ${targetPath}: ${error.message}`
      );
    }
  }
};

const renderPageCanvas = async (pdf, pageNumber) => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  );
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport }).promise;

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

  const requestedPages = new Set(
    Object.values(QUESTION_PROMPT_CROPS).map((crop) => crop.page)
  );

  const loadingTask = getDocument({
    data: new Uint8Array(fs.readFileSync(sourcePdfPath)),
    disableFontFace: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;

  const pageCanvases = new Map();
  for (const pageNumber of [...requestedPages].sort((a, b) => a - b)) {
    pageCanvases.set(pageNumber, await renderPageCanvas(pdf, pageNumber));
  }

  for (const [questionId, crop] of Object.entries(QUESTION_PROMPT_CROPS)) {
    const questionDir = path.join(
      generatedAssetRoot,
      `q${String(questionId).padStart(3, "0")}`
    );
    ensureDir(questionDir);

    writeCrop(
      pageCanvases.get(crop.page),
      crop,
      path.join(questionDir, "prompt.png")
    );
  }

  console.log(`Generated abstract question media assets in ${generatedAssetRoot}`);
  syncDirectory(generatedAssetRoot, frontendAssetRoot);
  console.log(`Synced abstract question media assets to ${frontendAssetRoot}`);
};

buildAssets().catch((error) => {
  console.error(error);
  process.exit(1);
});
