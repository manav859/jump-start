import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const sourcePdfPath = "d:/work/Jumpstart/jumpstart/backend/reference/complete-aptitude-test-500q.pdf";

async function run() {
  const data = new Uint8Array(fs.readFileSync(sourcePdfPath));
  const loadingTask = getDocument({ data, disableFontFace: true, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(" ");
    if (text.includes("4.3") || text.includes("4.4")) {
      console.log(`--- Page ${i} ---`);
      console.log(text);
    }
  }
}

run().catch(console.error);
