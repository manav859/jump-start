import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePdfPath = path.resolve(__dirname, "..", "reference", "complete-aptitude-test-500q.pdf");

async function run() {
  const data = new Uint8Array(fs.readFileSync(sourcePdfPath));
  const loadingTask = getDocument({ data, disableFontFace: true, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  
  for (let i = 1; i <= 10; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const outputPath = path.resolve(__dirname, `main_page_${i}.png`);
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
    console.log(`Saved main_page_${i}`);
  }
}

run().catch(console.error);
