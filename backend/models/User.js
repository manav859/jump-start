import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { cloneResultProfile } from "../utils/assessmentReports.js";

const toPlainObject = (value) =>
  value?.toObject ? value.toObject() : value || {};

const toNullableNumber = (value) => {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toNumberOrFallback = (value, fallback) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const sanitizeTestProgress = (progress = {}) => {
  const rawProgress = toPlainObject(progress);

  return {
    ...rawProgress,
    sectionId: toNumberOrFallback(rawProgress.sectionId, 1),
    questionIndex: toNumberOrFallback(rawProgress.questionIndex, 0),
    completedSectionIds: Array.isArray(rawProgress.completedSectionIds)
      ? rawProgress.completedSectionIds
          .map((value) => toNullableNumber(value))
          .filter(Number.isFinite)
      : [],
    timeRemainingSeconds: toNullableNumber(rawProgress.timeRemainingSeconds),
    answers:
      rawProgress.answers && typeof rawProgress.answers === "object"
        ? rawProgress.answers
        : {},
  };
};

const sanitizeAssessmentReports = (reports = []) =>
  Array.isArray(reports)
    ? reports.map((report) => {
        const rawReport = toPlainObject(report);
        return {
          ...rawReport,
          attemptNumber: toNumberOrFallback(rawReport.attemptNumber, 1),
          profile: cloneResultProfile(rawReport.profile),
        };
      })
    : [];

const testResultSchema = new mongoose.Schema(
  {
    testName: { type: String, default: "" },
    sectionName: { type: String, default: "" },
    sectionId: { type: Number, default: null },
    completedAt: { type: Date, default: null },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    reportUrl: { type: String, default: "" },
    interpretation: { type: String, default: "" },
  },
  { _id: false }
);

const factorResultSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    key: { type: String, default: "" },
    label: { type: String, default: "" },
    score: { type: Number, default: null },
    rawScore: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    average: { type: Number, default: null },
    percentage: { type: Number, default: null },
    band: { type: String, default: "" },
    status: { type: String, default: "" },
    description: { type: String, default: "" },
    interpretation: { type: String, default: "" },
    careerImplication: { type: String, default: "" },
    answerType: { type: String, default: "" },
    scoreType: { type: String, default: "" },
    questionNumbers: { type: [Number], default: [] },
    questionRangeLabel: { type: String, default: "" },
  },
  { _id: false }
);

const subsectionSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    key: { type: String, default: "" },
    label: { type: String, default: "" },
    score: { type: Number, default: null },
    rawScore: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    average: { type: Number, default: null },
    percentage: { type: Number, default: null },
    band: { type: String, default: "" },
    status: { type: String, default: "" },
    description: { type: String, default: "" },
    interpretation: { type: String, default: "" },
    careerImplication: { type: String, default: "" },
    answerType: { type: String, default: "" },
    scoreType: { type: String, default: "" },
    questionNumbers: { type: [Number], default: [] },
    questionRangeLabel: { type: String, default: "" },
    factorResults: { type: [factorResultSchema], default: [] },
  },
  { _id: false }
);

const sectionBreakdownSchema = new mongoose.Schema(
  {
    sectionId: { type: Number, default: null },
    title: { type: String, default: "" },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    average: { type: Number, default: null },
    percentage: { type: Number, default: null },
    answeredCount: { type: Number, default: null },
    totalQuestions: { type: Number, default: null },
    status: { type: String, default: "" },
    interpretation: { type: String, default: "" },
    careerImplication: { type: String, default: "" },
    scoringType: { type: String, default: "" },
    answerType: { type: String, default: "" },
    scoreType: { type: String, default: "" },
    questionNumbers: { type: [Number], default: [] },
    questionRangeLabel: { type: String, default: "" },
    subsections: { type: [subsectionSchema], default: [] },
  },
  { _id: false }
);

const strengthSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    value: { type: Number, default: null },
    desc: { type: String, default: "" },
  },
  { _id: false }
);

const careerRecommendationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    matchPercent: { type: Number, default: null },
    description: { type: String, default: "" },
    skills: { type: [String], default: [] },
    salaryRange: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false }
);

const personalityTraitSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    value: { type: Number, default: null },
  },
  { _id: false }
);

const personalityTypeSchema = new mongoose.Schema(
  {
    code: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    traits: { type: [personalityTraitSchema], default: [] },
  },
  { _id: false }
);

const reviewSummarySchema = new mongoose.Schema(
  {
    statusLabel: { type: String, default: "" },
    strongestSignals: { type: [String], default: [] },
    topCareerTitles: { type: [String], default: [] },
    observations: { type: [String], default: [] },
  },
  { _id: false }
);

const resultMetadataSchema = new mongoose.Schema(
  {
    algorithmKey: { type: String, default: "" },
    overallMaxScore: { type: Number, default: null },
    packageId: { type: String, default: "" },
    scoringGuideSources: { type: [String], default: [] },
    ambiguityNotes: { type: [String], default: [] },
  },
  { _id: false }
);

const resultProfileSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, default: null },
    overallPercentile: { type: String, default: "" },
    completedTestsCount: { type: Number, default: 0 },
    totalTestsCount: { type: Number, default: 0 },
    careerPathwaysCount: { type: Number, default: 0 },
    testResults: { type: [testResultSchema], default: [] },
    sectionBreakdown: { type: [sectionBreakdownSchema], default: [] },
    strengths: { type: [strengthSchema], default: [] },
    careerRecommendations: { type: [careerRecommendationSchema], default: [] },
    personalityType: { type: personalityTypeSchema, default: () => ({}) },
    reviewSummary: { type: reviewSummarySchema, default: () => ({}) },
    metadata: { type: resultMetadataSchema, default: () => ({}) },
  },
  { _id: false }
);

const resultPublicationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["not_submitted", "pending_approval", "approved"],
      default: "not_submitted",
    },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedByName: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const assessmentReportSchema = new mongoose.Schema({
  packageId: { type: String, default: "" },
  packageTitle: { type: String, default: "" },
  attemptNumber: { type: Number, default: 1 },
  profile: { type: resultProfileSchema, default: () => ({}) },
  publication: { type: resultPublicationSchema, default: () => ({}) },
  createdAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 6, default: null },
    mobile: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, trim: true, default: "" },
    schoolName: { type: String, trim: true, default: "" },
    schoolLocation: { type: String, trim: true, default: "" },
    residentialAddress: { type: String, trim: true, default: "" },
    googleId: { type: String, sparse: true, default: null },
    avatar: { type: String, default: null },
    subscription: {
      type: String,
      enum: ["Basic", "Standard", "Premium"],
      default: "Basic",
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isSuspended: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    selectedPackageId: { type: String, default: "" },
    purchasedPackages: [{ type: String }],

    // Dashboard counters
    testsCompleted: { type: Number, default: 0 },
    testsInProgress: { type: Number, default: 0 },
    reportsReady: { type: Number, default: 0 },
    counsellingSessions: { type: Number, default: 0 },

    // Dashboard: per-user available tests (simple structure for now)
    availableTests: [
      {
        title: { type: String, required: true },
        durationMinutes: { type: Number, default: 180 },
        totalQuestions: { type: Number, default: 50 },
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed"],
          default: "not_started",
        },
      },
    ],

    // Dashboard: top career matches for this user
    topCareers: [
      {
        title: { type: String, required: true },
        matchPercent: { type: Number, required: true },
      },
    ],

    // Current/latest result snapshot kept for backward compatibility.
    resultProfile: { type: resultProfileSchema, default: () => ({}) },

    resultPublication: {
      type: resultPublicationSchema,
      default: () => ({ status: "not_submitted" }),
    },

    // Scalable result history for multiple purchased tests and repeated attempts.
    assessmentReports: { type: [assessmentReportSchema], default: [] },

    // Livetest progress (section, question index, answers, time left)
    testProgress: {
      sectionId: { type: Number, default: 1 },
      questionIndex: { type: Number, default: 0 },
      answers: { type: mongoose.Schema.Types.Mixed, default: {} },
      completedSectionIds: { type: [Number], default: [] },
      timeRemainingSeconds: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  this.resultProfile = cloneResultProfile(this.resultProfile);
  this.assessmentReports = sanitizeAssessmentReports(this.assessmentReports);
  this.testProgress = sanitizeTestProgress(this.testProgress);
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toAuthJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    mobile: this.mobile || "",
    city: this.city || "",
    dateOfBirth: this.dateOfBirth || "",
    schoolName: this.schoolName || "",
    schoolLocation: this.schoolLocation || "",
    residentialAddress: this.residentialAddress || "",
    subscription: this.subscription,
    role: this.role,
    isSuspended: this.isSuspended || false,
    lastLoginAt: this.lastLoginAt || null,
    selectedPackageId: this.selectedPackageId || "",
  };
};

export default mongoose.model("User", userSchema);
