import mongoose from "mongoose";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";

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

export const PRIMARY_PACKAGE_ID = COMPREHENSIVE_500_PACKAGE.id;
export const DUMMY_TEST_PACKAGE_ID = "dummy-test";

const createDummyPackage = () => ({
  id: DUMMY_TEST_PACKAGE_ID,
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
});

const createPrimaryPackage = () => ({
  ...JSON.parse(JSON.stringify(COMPREHENSIVE_500_PACKAGE)),
  active: true,
  sortOrder: 1,
});

const createDefaultPackages = () => [createPrimaryPackage(), createDummyPackage()];

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

  cachedDefaultConfig = {
    key: "default",
    packages: createDefaultPackages(),
  };

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
  const packageSeeds = createDefaultPackages();

  if (!Array.isArray(cfg.packages) || cfg.packages.length === 0) {
    cfg.packages = packageSeeds;
    changed = true;
  } else {
    const nextPackages = packageSeeds.map((seed) => {
      const existing = (cfg.packages || []).find((pkg) => pkg.id === seed.id);

      if (!existing) {
        changed = true;
        return seed;
      }

      changed = mergeSeededPackage(existing, seed) || changed;
      if (existing.active === false) {
        existing.active = true;
        changed = true;
      }
      if (Number(existing.sortOrder || 0) !== Number(seed.sortOrder || 0)) {
        existing.sortOrder = seed.sortOrder;
        changed = true;
      }
      return existing;
    });

    if (
      (cfg.packages || []).length !== nextPackages.length ||
      nextPackages.some((pkg, index) => cfg.packages[index]?.id !== pkg.id)
    ) {
      cfg.packages = nextPackages;
      changed = true;
    } else {
      cfg.packages = nextPackages;
    }
  }

  if (changed) {
    await cfg.save();
  }

  return cfg;
};

export default mongoose.model("AssessmentConfig", assessmentConfigSchema);
