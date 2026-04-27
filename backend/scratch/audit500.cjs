const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const backendRoot = path.resolve(__dirname, "..");
const pdfRoot = path.resolve(backendRoot, "..", "..");

async function parsePdf(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  const result = await parser.getText();
  const numpages = result.numpages || 0;
  await parser.destroy();
  return { text: result.text, numpages };
}

async function main() {
  const aptitude = await parsePdf(path.resolve(pdfRoot, "complete-aptitude-test-500q.pdf"));
  const answer = await parsePdf(path.resolve(pdfRoot, "complete-answer-key-500q.pdf"));
  const fixes = await parsePdf(path.resolve(pdfRoot, "Jumpstart Fixes Req.pdf"));
  const mech = await parsePdf(path.resolve(pdfRoot, "Mechanical & Spatial Questions.pdf"));

  console.log("=== PDF EXTRACTION COMPLETE ===");
  console.log("Aptitude PDF chars:", aptitude.text.length);
  console.log("Answer Key PDF chars:", answer.text.length);
  console.log("Fixes PDF chars:", fixes.text.length);
  console.log("Mech/Spatial PDF chars:", mech.text.length);

  // Write to separate files for analysis
  fs.writeFileSync(path.join(__dirname, "pdf_fixes.txt"), fixes.text, "utf8");
  fs.writeFileSync(path.join(__dirname, "pdf_answer_key.txt"), answer.text, "utf8");
  fs.writeFileSync(path.join(__dirname, "pdf_mech_spatial.txt"), mech.text, "utf8");
  fs.writeFileSync(path.join(__dirname, "pdf_aptitude.txt"), aptitude.text, "utf8");

  console.log("\nFiles written to scratch/ directory.");
}

main().catch(err => { console.error(err); process.exit(1); });
