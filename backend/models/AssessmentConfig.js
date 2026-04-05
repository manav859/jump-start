import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";
import { applyPersonalityMetadataToQuestions } from "../utils/personalityQuestionMetadata.js";

const packageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    badge: { type: String, default: "Recommended" },
    amount: { type: Number, required: true, min: 0 },
    strikeAmount: { type: Number, default: null },
    features: [{ type: String }],
    durationText: { type: String, default: "" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    sections: [
      {
        sectionId: { type: Number, required: true },
        title: { type: String, required: true },
        durationMinutes: { type: Number, default: 20 },
        enabled: { type: Boolean, default: true },
        scoringType: { type: String, enum: ["likert", "objective", "mixed"], default: "mixed" },
        sheetCsvUrl: { type: String, default: "" },
        questions: [
          {
            questionId: { type: String, default: "" },
            text: { type: String, required: true },
            type: { type: String, enum: ["likert", "single"], default: "likert" },
            options: [{ type: String }],
            correctOption: { type: String, default: "" },
            reverseScored: { type: Boolean, default: false },
            weight: { type: Number, default: 1, min: 0.1 },
            subscale: { type: String, default: "" },
            notes: { type: String, default: "" },
          },
        ],
      },
    ],
  },
  { _id: false }
);

const assessmentConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    packages: [packageSchema],
  },
  { timestamps: true }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_STARTER_PACKAGE = {
  id: "starter",
  title: "Starter Package",
  badge: "Recommended",
  amount: 1499,
  strikeAmount: null,
  features: [
    "Complete 5-section assessment",
    "Personalized report",
    "Dashboard access",
  ],
  durationText: "Total duration based on selected sections",
  active: true,
  sortOrder: 1,
  sections: [],
};

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
};

let cachedDefaultConfig = null;

const countQuestions = (pkg = {}) =>
  (pkg.sections || []).reduce(
    (sum, section) => sum + ((section.questions || []).length || 0),
    0
  );

const mergeSeededPackage = (target, seeded) => {
  let changed = false;

  if (countQuestions(target) === 0 && countQuestions(seeded) > 0) {
    target.sections = seeded.sections;
    changed = true;
  }
  if (!Array.isArray(target.features) || !target.features.length) {
    target.features = seeded.features;
    changed = true;
  }
  if (!target.durationText && seeded.durationText) {
    target.durationText = seeded.durationText;
    changed = true;
  }
  if (!target.badge && seeded.badge) {
    target.badge = seeded.badge;
    changed = true;
  }
  if ((target.amount == null || Number.isNaN(Number(target.amount))) && seeded.amount != null) {
    target.amount = seeded.amount;
    changed = true;
  }
  if (!Number.isFinite(Number(target.sortOrder)) && seeded.sortOrder != null) {
    target.sortOrder = seeded.sortOrder;
    changed = true;
  }

  return changed;
};

const loadDefaultConfig = () => {
  if (cachedDefaultConfig) {
    return cachedDefaultConfig;
  }

  try {
    const filePath = path.resolve(__dirname, "../config/assessment-seed.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const payload = JSON.parse(raw);

    const mappedSections = Array.isArray(payload.sections)
      ? payload.sections.map((section, index) => ({
          sectionId: Number(section.sectionId || index + 1),
          title: String(section.title || `Section ${index + 1}`),
          durationMinutes: Number(section.durationMinutes || 20),
          enabled: section.enabled !== false,
          scoringType: section.scoringType || "mixed",
          sheetCsvUrl: section.sheetCsvUrl || "",
          questions: Array.isArray(section.questions)
            ? section.questions
                .map((question, questionIndex) => ({
                  questionId:
                    question.questionId ||
                    question.question_id ||
                    `${questionIndex + 1}`,
                  text: question.text || question.question || "",
                  type: question.type || "likert",
                  options:
                    question.options ||
                    [
                      question.option_a,
                      question.option_b,
                      question.option_c,
                      question.option_d,
                      question.option_e,
                    ].filter(Boolean),
                  correctOption:
                    question.correctOption || question.correct_option || "",
                  reverseScored:
                    question.reverseScored === true ||
                    String(question.reverse_scored || "").toLowerCase() ===
                      "true",
                  weight: Number(question.weight || 1),
                  subscale: question.subscale || "",
                  notes: question.notes || "",
                }))
                .filter((question) => question.text)
            : [],
        }))
          .map((section) =>
            Number(section.sectionId) === 1
              ? {
                  ...section,
                  questions: applyPersonalityMetadataToQuestions(
                    section.questions || []
                  ),
                }
              : section
          )
      : [];

    cachedDefaultConfig = {
      key: "default",
      packages: [
        {
          ...FALLBACK_STARTER_PACKAGE,
          features: [
            "Complete assessment",
            "Personalized report",
            "Dashboard access",
          ],
          durationText: "Duration based on selected sections",
          sections: mappedSections,
        },
        { ...DUMMY_TEST_PACKAGE },
        { ...COMPREHENSIVE_500_PACKAGE },
      ],
    };
  } catch (error) {
    console.error("Failed to load bundled assessment seed:", error.message);
    cachedDefaultConfig = {
      key: "default",
      packages: [
        { ...FALLBACK_STARTER_PACKAGE },
        { ...DUMMY_TEST_PACKAGE },
        { ...COMPREHENSIVE_500_PACKAGE },
      ],
    };
  }

  return cachedDefaultConfig;
};

assessmentConfigSchema.statics.getOrCreateDefault = async function getOrCreateDefault() {
  const defaultConfig = loadDefaultConfig();

  await this.updateOne(
    { key: "default" },
    { $setOnInsert: defaultConfig },
    { upsert: true }
  );

  const cfg = await this.findOne({ key: "default" });
  if (!cfg) {
    return this.findOne({ key: "default" });
  }

  let changed = false;

  if (!Array.isArray(cfg.packages) || cfg.packages.length === 0) {
    cfg.packages = defaultConfig.packages;
    changed = true;
  } else {
    for (const seededPackage of defaultConfig.packages || []) {
      const existingPackage = (cfg.packages || []).find(
        (pkg) => pkg.id === seededPackage.id
      );

      if (existingPackage) {
        changed = mergeSeededPackage(existingPackage, seededPackage) || changed;
        continue;
      }

      cfg.packages = [...(cfg.packages || []), seededPackage];
      changed = true;
    }
  }

  if (changed) {
    await cfg.save();
  }

  return cfg;
};

export default mongoose.model("AssessmentConfig", assessmentConfigSchema);
