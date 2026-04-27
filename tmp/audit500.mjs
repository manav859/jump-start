import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

// Load pdf-parse
const pdfParse = (await import("pdf-parse")).default;

// ─── Load PDFs ──────────────────────────────────────────────────────────────
const aptitudePdf = await pdfParse(fs.readFileSync(path.resolve(root, "..", "complete-aptitude-test-500q.pdf")));
const answerKeyPdf = await pdfParse(fs.readFileSync(path.resolve(root, "..", "complete-answer-key-500q.pdf")));
const fixesPdf = await pdfParse(fs.readFileSync(path.resolve(root, "..", "Jumpstart Fixes Req.pdf")));
const mechSpatialPdf = await pdfParse(fs.readFileSync(path.resolve(root, "..", "Mechanical & Spatial Questions.pdf")));

console.log("=== PDF EXTRACTION COMPLETE ===");
console.log("Aptitude PDF pages:", aptitudePdf.numpages, "chars:", aptitudePdf.text.length);
console.log("Answer Key PDF pages:", answerKeyPdf.numpages, "chars:", answerKeyPdf.text.length);
console.log("Fixes PDF pages:", fixesPdf.numpages, "chars:", fixesPdf.text.length);
console.log("Mech/Spatial PDF pages:", mechSpatialPdf.numpages, "chars:", mechSpatialPdf.text.length);

// ─── Dump Fixes PDF ─────────────────────────────────────────────────────────
console.log("\n\n========== FIXES PDF FULL TEXT ==========\n");
console.log(fixesPdf.text);

// ─── Dump Mechanical/Spatial PDF ────────────────────────────────────────────
console.log("\n\n========== MECHANICAL & SPATIAL PDF FULL TEXT ==========\n");
console.log(mechSpatialPdf.text);

// ─── Answer Key Excerpt ─────────────────────────────────────────────────────
console.log("\n\n========== ANSWER KEY PDF FULL TEXT ==========\n");
console.log(answerKeyPdf.text);
