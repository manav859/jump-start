import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const sourcePdfPath = "d:/work/Jumpstart/Mechanical & Spatial Questions.pdf";

async function run() {
  const data = new Uint8Array(fs.readFileSync(sourcePdfPath));
  const loadingTask = getDocument({ data, disableFontFace: true, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  console.log("Total pages:", pdf.numPages);
}

run().catch(console.error);
