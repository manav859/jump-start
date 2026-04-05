import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";
import { applyPersonalityMetadataToQuestions } from "../utils/personalityQuestionMetadata.js";

async function run() {
  ensureRequiredEnv();

  const filePath = path.resolve(process.cwd(), "config/assessment-seed.json");
  if (!fs.existsSync(filePath)) {
    console.error("Seed file not found:", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const payload = JSON.parse(raw);

  await mongoose.connect(process.env.MONGODB_URI);
  const cfg = await AssessmentConfig.getOrCreateDefault();

  const mappedSections = Array.isArray(payload.sections)
    ? payload.sections.map((s) => ({
      sectionId: Number(s.sectionId),
      title: s.title,
      durationMinutes: Number(s.durationMinutes || 20),
      enabled: s.enabled !== false,
      scoringType: s.scoringType || "mixed",
      sheetCsvUrl: s.sheetCsvUrl || "",
      questions: Array.isArray(s.questions)
        ? s.questions
            .map((q, idx) => ({
              questionId: q.questionId || q.question_id || `${idx + 1}`,
              text: q.text || q.question || "",
              type: q.type || "likert",
              options: q.options || [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e].filter(Boolean),
              correctOption: q.correctOption || q.correct_option || "",
              reverseScored:
                q.reverseScored === true ||
                String(q.reverse_scored || "").toLowerCase() === "true",
              weight: Number(q.weight || 1),
              subscale: q.subscale || "",
              notes: q.notes || "",
            }))
            .filter((q) => q.text)
        : [],
    }))
    .map((section) =>
      Number(section.sectionId) === 1
        ? {
            ...section,
            questions: applyPersonalityMetadataToQuestions(section.questions || []),
          }
        : section
    )
    : [];

  cfg.packages = [
    {
      id: "starter",
      title: "Starter Package",
      badge: "Recommended",
      amount: 1499,
      strikeAmount: null,
      features: ["Complete assessment", "Personalized report", "Dashboard access"],
      durationText: "Duration based on selected sections",
      active: true,
      sortOrder: 1,
      sections: mappedSections,
    },
    {
      id: "dummy-test",
      title: "Dummy Test",
      badge: "Quick Test",
      amount: 0,
      strikeAmount: null,
      features: [
        "3 quick sections",
        "1 question per section",
        "Fast end-to-end result testing",
      ],
      durationText: "3-minute dummy assessment",
      active: true,
      sortOrder: 2,
      sections: [
        {
          sectionId: 1,
          title: "Personality Assessment",
          durationMinutes: 1,
          enabled: true,
          scoringType: "likert",
          sheetCsvUrl: "",
          questions: [
            {
              questionId: "1",
              text: "I enjoy taking initiative when working with others.",
              type: "likert",
              options: [],
              correctOption: "",
              reverseScored: false,
              weight: 1,
            },
          ],
        },
        {
          sectionId: 2,
          title: "Interest Assessment",
          durationMinutes: 1,
          enabled: true,
          scoringType: "mixed",
          sheetCsvUrl: "",
          questions: [
            {
              questionId: "2",
              text: "Which activity sounds most interesting to you?",
              type: "single",
              options: [
                "Organizing a community event",
                "Analyzing a science experiment",
                "Designing a poster for a campaign",
                "Managing records for a school club",
              ],
              correctOption: "",
              reverseScored: false,
              weight: 1,
            },
          ],
        },
        {
          sectionId: 3,
          title: "Aptitude Battery",
          durationMinutes: 1,
          enabled: true,
          scoringType: "objective",
          sheetCsvUrl: "",
          questions: [
            {
              questionId: "291",
              text: "What is the next number in the pattern 2, 4, 8, 16, ?",
              type: "single",
              options: ["18", "24", "32", "34"],
              correctOption: "C",
              reverseScored: false,
              weight: 1,
            },
          ],
        },
      ],
    },
    COMPREHENSIVE_500_PACKAGE,
  ];

  cfg.markModified("packages");
  await cfg.save();
  console.log(
    "Seeded config:",
    (cfg.packages || [])
      .map(
        (pkg) =>
          `${pkg.id} -> ${(pkg.sections || [])
            .map((s) => `${s.sectionId}:${s.questions.length}`)
            .join(", ")}`
      )
      .join(" | ")
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
