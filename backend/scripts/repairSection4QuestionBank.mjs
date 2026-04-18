import "dotenv/config";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig, {
  PRIMARY_PACKAGE_ID,
} from "../models/AssessmentConfig.js";

const OFFENDER_PATTERN = /description:|\]$/i;

const getSection4Summary = (cfg = {}) => {
  const pkg = (cfg.packages || []).find((item) => item.id === PRIMARY_PACKAGE_ID);
  const section = (pkg?.sections || []).find(
    (item) => Number(item.sectionId) === 4
  );
  const questions = section?.questions || [];
  const offenders = questions.filter((question) =>
    OFFENDER_PATTERN.test(String(question?.text || "").trim())
  );
  const ordinals = questions.slice(120, 139).map((question, index) => ({
    ordinal: 121 + index,
    questionId: question.questionId,
    text: question.text,
    options: question.options,
    correctOption: question.correctOption,
  }));

  return {
    questionCount: questions.length,
    offenderCount: offenders.length,
    ordinals,
  };
};

async function run() {
  ensureRequiredEnv();
  await mongoose.connect(process.env.MONGODB_URI);

  const before = await AssessmentConfig.findOne({ key: "default" }).lean();
  console.log("Before repair:");
  console.log(JSON.stringify(getSection4Summary(before), null, 2));

  const cfg = await AssessmentConfig.getOrCreateDefault();
  await cfg.save();

  const after = await AssessmentConfig.findOne({ key: "default" }).lean();
  console.log("After repair:");
  console.log(JSON.stringify(getSection4Summary(after), null, 2));

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
