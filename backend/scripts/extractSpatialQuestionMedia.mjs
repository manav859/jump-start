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
  "spatial-assets"
);
const frontendAssetRoot = path.resolve(
  backendRoot,
  "..",
  "frontend",
  "public",
  "question-media",
  "spatial"
);
const sourcePdfPath = path.resolve(
  backendRoot,
  "..",
  "..",
  "Mechanical & Spatial Questions.pdf"
);

const QUESTION_CROPS = {
  76: {
    stimulus: { page: 1, x: 140, y: 320, w: 250, h: 270 },
    options: {
      A: { page: 1, x: 425, y: 355, w: 120, h: 160 },
      B: { page: 1, x: 600, y: 355, w: 120, h: 170 },
      C: { page: 1, x: 748, y: 355, w: 145, h: 170 },
      D: { page: 1, x: 915, y: 365, w: 140, h: 175 },
    },
  },
  77: {
    stimulus: { page: 1, x: 150, y: 760, w: 200, h: 300 },
    options: {
      A: { page: 1, x: 398, y: 830, w: 155, h: 170 },
      B: { page: 1, x: 558, y: 825, w: 155, h: 175 },
      C: { page: 1, x: 713, y: 830, w: 155, h: 170 },
      D: { page: 1, x: 878, y: 825, w: 155, h: 175 },
    },
  },
  78: {
    stimulus: { page: 1, x: 180, y: 1210, w: 440, h: 210 },
    options: {
      A: { page: 2, x: 185, y: 210, w: 220, h: 320 },
      B: { page: 2, x: 420, y: 210, w: 220, h: 320 },
      C: { page: 2, x: 605, y: 200, w: 210, h: 320 },
      D: { page: 2, x: 790, y: 195, w: 220, h: 320 },
    },
  },
  79: {
    stimulus: { page: 2, x: 225, y: 670, w: 300, h: 240 },
    options: {
      A: { page: 2, x: 615, y: 820, w: 120, h: 120 },
      B: { page: 2, x: 725, y: 820, w: 120, h: 120 },
      C: { page: 2, x: 835, y: 820, w: 120, h: 120 },
      D: { page: 2, x: 945, y: 820, w: 120, h: 120 },
    },
  },
  80: {
    stimulus: { page: 3, x: 180, y: 280, w: 370, h: 280 },
    options: {
      A: { page: 3, x: 135, y: 730, w: 185, h: 190 },
      B: { page: 3, x: 330, y: 730, w: 185, h: 190 },
      C: { page: 3, x: 515, y: 730, w: 185, h: 190 },
      D: { page: 3, x: 700, y: 730, w: 190, h: 190 },
    },
  },
  81: {
    stimulus: { page: 4, x: 120, y: 170, w: 560, h: 430 },
    options: {
      A: { page: 4, x: 130, y: 640, w: 200, h: 200 },
      B: { page: 4, x: 330, y: 640, w: 200, h: 200 },
      C: { page: 4, x: 520, y: 640, w: 200, h: 200 },
      D: { page: 4, x: 700, y: 640, w: 200, h: 200 },
    },
  },
  82: {
    stimulus: { page: 5, x: 120, y: 175, w: 560, h: 430 },
    options: {
      A: { page: 5, x: 130, y: 640, w: 200, h: 205 },
      B: { page: 5, x: 330, y: 640, w: 200, h: 205 },
      C: { page: 5, x: 515, y: 640, w: 200, h: 205 },
      D: { page: 5, x: 700, y: 640, w: 200, h: 205 },
    },
  },
  83: {
    stimulus: { page: 6, x: 170, y: 180, w: 410, h: 450 },
    options: {
      A: { page: 6, x: 150, y: 620, w: 150, h: 160 },
      B: { page: 6, x: 300, y: 620, w: 160, h: 160 },
      C: { page: 6, x: 450, y: 620, w: 160, h: 160 },
      D: { page: 6, x: 600, y: 620, w: 150, h: 160 },
    },
  },
  84: {
    stimulus: { page: 6, x: 120, y: 950, w: 500, h: 380 },
    options: {
      A: { page: 7, x: 120, y: 150, w: 280, h: 240 },
      B: { page: 7, x: 410, y: 110, w: 230, h: 220 },
      C: { page: 7, x: 630, y: 110, w: 210, h: 210 },
      D: { page: 7, x: 830, y: 140, w: 250, h: 240 },
    },
  },
  85: {
    stimulus: { page: 7, x: 130, y: 430, w: 480, h: 430 },
    options: {
      A: { page: 7, x: 120, y: 860, w: 240, h: 230 },
      B: { page: 7, x: 370, y: 875, w: 210, h: 190 },
      C: { page: 7, x: 625, y: 865, w: 210, h: 210 },
      D: { page: 7, x: 865, y: 855, w: 180, h: 215 },
    },
  },
  86: {
    stimulus: { page: 8, x: 110, y: 260, w: 420, h: 330 },
    options: {
      A: { page: 8, x: 120, y: 590, w: 230, h: 230 },
      B: { page: 8, x: 350, y: 570, w: 250, h: 250 },
      C: { page: 8, x: 600, y: 580, w: 240, h: 240 },
      D: { page: 8, x: 840, y: 600, w: 240, h: 230 },
    },
  },
  87: {
    stimulus: { page: 8, x: 110, y: 980, w: 500, h: 420 },
    options: {
      A: { page: 9, x: 140, y: 170, w: 205, h: 150 },
      B: { page: 9, x: 340, y: 160, w: 210, h: 165 },
      C: { page: 9, x: 560, y: 150, w: 220, h: 175 },
      D: { page: 9, x: 780, y: 165, w: 190, h: 165 },
    },
  },
  88: {
    stimulus: { page: 9, x: 160, y: 440, w: 420, h: 420 },
    options: {
      A: { page: 9, x: 130, y: 880, w: 210, h: 250 },
      B: { page: 9, x: 350, y: 870, w: 220, h: 260 },
      C: { page: 9, x: 560, y: 865, w: 220, h: 265 },
      D: { page: 9, x: 780, y: 860, w: 220, h: 270 },
    },
  },
  89: {
    stimulus: { page: 10, x: 120, y: 210, w: 560, h: 420 },
    options: {
      A: { page: 10, x: 120, y: 650, w: 210, h: 220 },
      B: { page: 10, x: 335, y: 640, w: 210, h: 230 },
      C: { page: 10, x: 540, y: 640, w: 210, h: 230 },
      D: { page: 10, x: 755, y: 640, w: 210, h: 230 },
    },
  },
  90: {
    stimulus: { page: 11, x: 120, y: 290, w: 500, h: 230 },
    options: {
      A: { page: 11, x: 120, y: 620, w: 280, h: 260 },
      B: { page: 11, x: 390, y: 620, w: 250, h: 260 },
      C: { page: 11, x: 630, y: 610, w: 270, h: 270 },
      D: { page: 11, x: 120, y: 850, w: 310, h: 250 },
    },
  },
  91: {
    stimulus: null,
    options: {
      A: { page: 12, x: 180, y: 260, w: 300, h: 90 },
      B: { page: 12, x: 650, y: 260, w: 210, h: 100 },
      C: { page: 12, x: 170, y: 490, w: 300, h: 90 },
      D: { page: 12, x: 650, y: 490, w: 240, h: 95 },
    },
  },
  92: {
    stimulus: { page: 13, x: 150, y: 220, w: 620, h: 420 },
    options: {
      A: { page: 13, x: 240, y: 760, w: 180, h: 75 },
      B: { page: 13, x: 670, y: 760, w: 160, h: 85 },
      C: { page: 13, x: 240, y: 980, w: 210, h: 80 },
      D: { page: 13, x: 670, y: 980, w: 170, h: 85 },
    },
  },
  93: {
    stimulus: { page: 14, x: 140, y: 220, w: 640, h: 430 },
    options: {
      A: { page: 14, x: 240, y: 760, w: 210, h: 85 },
      B: { page: 14, x: 660, y: 760, w: 210, h: 85 },
      C: { page: 14, x: 240, y: 980, w: 210, h: 85 },
      D: { page: 14, x: 660, y: 980, w: 210, h: 85 },
    },
  },
  94: {
    stimulus: { page: 15, x: 150, y: 280, w: 620, h: 430 },
    options: {
      A: { page: 15, x: 220, y: 760, w: 260, h: 110 },
      B: { page: 15, x: 650, y: 760, w: 260, h: 110 },
      C: { page: 15, x: 220, y: 980, w: 260, h: 110 },
      D: { page: 15, x: 650, y: 980, w: 260, h: 110 },
    },
  },
  95: {
    stimulus: { page: 16, x: 150, y: 220, w: 620, h: 430 },
    options: {
      A: { page: 16, x: 210, y: 710, w: 290, h: 105 },
      B: { page: 16, x: 640, y: 700, w: 290, h: 105 },
      C: { page: 16, x: 210, y: 930, w: 290, h: 105 },
      D: { page: 16, x: 640, y: 930, w: 290, h: 105 },
    },
  },
  96: {
    stimulus: { page: 17, x: 150, y: 180, w: 620, h: 450 },
    options: {
      A: { page: 17, x: 220, y: 700, w: 250, h: 110 },
      B: { page: 17, x: 650, y: 700, w: 250, h: 110 },
      C: { page: 17, x: 220, y: 920, w: 250, h: 110 },
      D: { page: 17, x: 650, y: 920, w: 250, h: 110 },
    },
  },
  97: {
    stimulus: { page: 18, x: 150, y: 180, w: 800, h: 560 },
    options: {
      A: { page: 18, x: 170, y: 790, w: 350, h: 90 },
      B: { page: 18, x: 570, y: 790, w: 350, h: 90 },
      C: { page: 18, x: 170, y: 1010, w: 350, h: 90 },
      D: { page: 18, x: 570, y: 1010, w: 350, h: 90 },
    },
  },
  98: {
    stimulus: { page: 19, x: 150, y: 210, w: 630, h: 430 },
    options: {
      A: { page: 19, x: 210, y: 800, w: 270, h: 140 },
      B: { page: 19, x: 560, y: 790, w: 350, h: 145 },
      C: { page: 19, x: 205, y: 1010, w: 280, h: 140 },
      D: { page: 19, x: 600, y: 1010, w: 300, h: 140 },
    },
  },
  99: {
    stimulus: { page: 20, x: 150, y: 280, w: 620, h: 430 },
    options: {
      A: { page: 20, x: 240, y: 820, w: 230, h: 100 },
      B: { page: 20, x: 640, y: 820, w: 230, h: 100 },
      C: { page: 20, x: 240, y: 1040, w: 230, h: 100 },
      D: { page: 20, x: 640, y: 1040, w: 230, h: 100 },
    },
  },
  100: {
    stimulus: { page: 21, x: 150, y: 250, w: 620, h: 430 },
    options: {
      A: { page: 21, x: 210, y: 770, w: 270, h: 100 },
      B: { page: 21, x: 630, y: 770, w: 270, h: 100 },
      C: { page: 21, x: 210, y: 990, w: 270, h: 100 },
      D: { page: 21, x: 630, y: 990, w: 270, h: 100 },
    },
  },
  101: {
    stimulus: { page: 22, x: 150, y: 230, w: 790, h: 560 },
    options: {
      A: { page: 22, x: 220, y: 850, w: 230, h: 155 },
      B: { page: 22, x: 620, y: 850, w: 230, h: 155 },
      C: { page: 22, x: 220, y: 1080, w: 230, h: 155 },
      D: { page: 22, x: 620, y: 1080, w: 230, h: 155 },
    },
  },
  102: {
    stimulus: { page: 23, x: 150, y: 220, w: 790, h: 430 },
    options: {
      A: { page: 23, x: 155, y: 820, w: 390, h: 220 },
      B: { page: 23, x: 580, y: 820, w: 360, h: 220 },
      C: { page: 23, x: 155, y: 1020, w: 390, h: 220 },
      D: { page: 23, x: 580, y: 1020, w: 360, h: 220 },
    },
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
      fs.copyFileSync(sourcePath, targetPath);
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

  const requestedPages = new Set();
  for (const config of Object.values(QUESTION_CROPS)) {
    if (config.stimulus) {
      requestedPages.add(config.stimulus.page);
    }
    Object.values(config.options).forEach((crop) => requestedPages.add(crop.page));
  }

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

  for (const [questionNumber, config] of Object.entries(QUESTION_CROPS)) {
    const questionDir = path.join(
      generatedAssetRoot,
      `q${String(questionNumber).padStart(3, "0")}`
    );
    fs.mkdirSync(questionDir, { recursive: true });

    if (config.stimulus) {
      writeCrop(
        pageCanvases.get(config.stimulus.page),
        config.stimulus,
        path.join(questionDir, "stimulus.png")
      );
    }

    for (const [optionLetter, crop] of Object.entries(config.options)) {
      writeCrop(
        pageCanvases.get(crop.page),
        crop,
        path.join(questionDir, `option-${optionLetter}.png`)
      );
    }
  }

  console.log(`Generated spatial media assets in ${generatedAssetRoot}`);
  syncDirectory(generatedAssetRoot, frontendAssetRoot);
  console.log(`Synced spatial media assets to ${frontendAssetRoot}`);
};

buildAssets().catch((error) => {
  console.error(error);
  process.exit(1);
});
