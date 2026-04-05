import "dotenv/config";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";

const DUMMY_TEST_PACKAGE = {
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
          subscale: "",
          notes: "",
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
          subscale: "",
          notes: "",
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
          subscale: "",
          notes: "",
        },
      ],
    },
  ],
};

async function run() {
  ensureRequiredEnv();

  await mongoose.connect(process.env.MONGODB_URI);
  const cfg = await AssessmentConfig.getOrCreateDefault();

  cfg.packages = [
    {
      ...JSON.parse(JSON.stringify(COMPREHENSIVE_500_PACKAGE)),
      active: true,
      sortOrder: 1,
    },
    DUMMY_TEST_PACKAGE,
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
