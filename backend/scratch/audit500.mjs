import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");
const pdfRoot = path.resolve(projectRoot, "..");

// ─── Load PDFs ──────────────────────────────────────────────────────────────
const aptitudePdf = await pdfParse(fs.readFileSync(path.resolve(pdfRoot, "complete-aptitude-test-500q.pdf")));
const answerKeyPdf = await pdfParse(fs.readFileSync(path.resolve(pdfRoot, "complete-answer-key-500q.pdf")));
const fixesPdf = await pdfParse(fs.readFileSync(path.resolve(pdfRoot, "Jumpstart Fixes Req.pdf")));
const mechSpatialPdf = await pdfParse(fs.readFileSync(path.resolve(pdfRoot, "Mechanical & Spatial Questions.pdf")));

console.log("=== PDF EXTRACTION COMPLETE ===");
console.log("Aptitude PDF pages:", aptitudePdf.numpages, "chars:", aptitudePdf.text.length);
console.log("Answer Key PDF pages:", answerKeyPdf.numpages, "chars:", answerKeyPdf.text.length);
console.log("Fixes PDF pages:", fixesPdf.numpages, "chars:", fixesPdf.text.length);
console.log("Mech/Spatial PDF pages:", mechSpatialPdf.numpages, "chars:", mechSpatialPdf.text.length);

// ─── Dump Fixes PDF ─────────────────────────────────────────────────────────
console.log("\n\n========== FIXES PDF FULL TEXT ==========\n");
console.log(fixesPdf.text);

// ─── Dump Mechanical/Spatial PDF ────────────────────────────────────────────
console.log("\n\n========== MECHANICAL & SPATIAL PDF (first 8000 chars) ==========\n");
console.log(mechSpatialPdf.text.substring(0, 8000));

// ─── Answer Key excerpt ─────────────────────────────────────────────────────
console.log("\n\n========== ANSWER KEY PDF FULL TEXT ==========\n");
console.log(answerKeyPdf.text);
