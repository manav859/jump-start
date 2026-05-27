// Idempotent seed for the Gujarati edition of the 500-question package.
//
// What it does
// ------------
// Upserts the package with id "complete-aptitude-500q-gujarati" into the
// single AssessmentConfig document, without touching the English /
// demo / dummy packages.
//
// When to run
// -----------
// - First time: after `npm run seed:assessment` has created the initial
//   AssessmentConfig document.
// - Repeats: any time the English bank or its text_gu / options_gu
//   translations change. Because the Gujarati package is derived
//   from the English bank at import time, re-running this script
//   pushes the latest Gujarati content to the DB.
//
// Usage
// -----
//   npm run seed:gujarati-package

import "dotenv/config";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import GUJARATI_PACKAGE from "../config/gujaratiPackage.generated.js";

const GUJARATI_PACKAGE_ID = "complete-aptitude-500q-gujarati";

async function run() {
  ensureRequiredEnv();

  await mongoose.connect(process.env.MONGODB_URI);
  const cfg = await AssessmentConfig.getOrCreateDefault();

  // Deep-clone so the in-memory module object can't be accidentally
  // mutated by Mongoose's save lifecycle.
  const guPayload = {
    ...JSON.parse(JSON.stringify(GUJARATI_PACKAGE)),
    active: true,
    sortOrder: 2,
  };

  const existingIndex = (cfg.packages || []).findIndex(
    (pkg) => pkg.id === GUJARATI_PACKAGE_ID
  );

  if (existingIndex >= 0) {
    cfg.packages[existingIndex] = guPayload;
    console.log(`[seed:gu] updated existing Gujarati package at index ${existingIndex}`);
  } else {
    cfg.packages.push(guPayload);
    console.log("[seed:gu] inserted Gujarati package");
  }

  cfg.markModified("packages");
  await cfg.save();

  const summary = (cfg.packages || [])
    .map(
      (pkg) =>
        `${pkg.id} -> ${(pkg.sections || [])
          .map((s) => `${s.sectionId}:${s.questions.length}`)
          .join(", ")}`
    )
    .join(" | ");
  console.log("[seed:gu] config now holds:", summary);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
