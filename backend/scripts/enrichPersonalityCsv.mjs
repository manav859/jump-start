import fs from "node:fs";
import {
  getPersonalityCsvPath,
  inferPersonalityAxis,
  parseCsv,
  toCsv,
} from "../utils/personalityQuestionMetadata.js";

const csvPath = getPersonalityCsvPath();

if (!fs.existsSync(csvPath)) {
  console.error(`Personality CSV not found: ${csvPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf-8");
const rows = parseCsv(raw);

if (!rows.length) {
  console.error("Personality CSV is empty");
  process.exit(1);
}

const headers = rows[0];
const questionIdIndex = headers.findIndex((value) => value === "question_id");
const questionIndex = headers.findIndex((value) => value === "question");
const subscaleIndex = headers.findIndex((value) => value === "subscale");

if (questionIdIndex < 0 || questionIndex < 0 || subscaleIndex < 0) {
  console.error("CSV must contain question_id, question, and subscale columns");
  process.exit(1);
}

let updatedCount = 0;

const nextRows = [
  headers,
  ...rows.slice(1).map((cells, index) => {
    const nextCells = [...cells];
    const existingSubscale = String(nextCells[subscaleIndex] || "").trim();
    if (existingSubscale) return nextCells;

    const inferredAxis = inferPersonalityAxis(
      {
        questionId: String(nextCells[questionIdIndex] || "").trim(),
        text: String(nextCells[questionIndex] || "").trim(),
      },
      index
    );

    if (inferredAxis) {
      nextCells[subscaleIndex] = inferredAxis;
      updatedCount += 1;
    }

    return nextCells;
  }),
];

fs.writeFileSync(csvPath, `${toCsv(nextRows)}\n`, "utf-8");
console.log(`Updated ${updatedCount} personality subscale rows in ${csvPath}`);
