// Idempotent seed for the Gujarati edition of the 500-question package.
//
// What it does
// ------------
// Ensures the package with id "complete-aptitude-500q-gujarati" exists in
// the single AssessmentConfig document. INSERT-ONLY by design: if the
// package is already present it does nothing (no update, no duplicate);
// if it's missing it appends the derived Gujarati package. The English /
// demo / dummy packages are never touched.
//
// Two entry points
// ----------------
// 1. seedGujaratiPackage() — exported named function. Assumes a Mongoose
//    connection is ALREADY open (e.g. called from server.js right after
//    connectDB()). Does NOT connect or disconnect. Safe to call on every
//    boot — after the first insert it's just a cheap presence check.
// 2. CLI: `npm run seed:gujarati-package` — runs the function inside a
//    self-managed connect/disconnect so it can be run standalone.
//
// When the translations change
// -----------------------------
// This script is insert-only, so re-running it will NOT push updated
// Gujarati content once the package exists. To refresh translations after
// the English bank / text_gu changes, delete the package first (or run
// `npm run seed:assessment`, which rewrites all packages including the
// Gujarati one), then let this re-insert it.

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import GUJARATI_PACKAGE from "../config/gujaratiPackage.generated.js";

export const GUJARATI_PACKAGE_ID = "complete-aptitude-500q-gujarati";

// Ensure the Gujarati package exists in the AssessmentConfig. Connection
// must already be open. Returns { created, packageId } so callers can log
// a meaningful boot message.
export async function seedGujaratiPackage() {
  const cfg = await AssessmentConfig.getOrCreateDefault();

  const alreadyPresent = (cfg.packages || []).some(
    (pkg) => pkg.id === GUJARATI_PACKAGE_ID
  );
  if (alreadyPresent) {
    // No-op: never update or duplicate an existing package.
    return { created: false, packageId: GUJARATI_PACKAGE_ID };
  }

  // Deep-clone so the in-memory module object can't be mutated by
  // Mongoose's save lifecycle.
  const guPayload = {
    ...JSON.parse(JSON.stringify(GUJARATI_PACKAGE)),
    active: true,
    sortOrder: 2,
  };

  cfg.packages.push(guPayload);
  cfg.markModified("packages");
  await cfg.save();

  return { created: true, packageId: GUJARATI_PACKAGE_ID };
}

// ---------------------------------------------------------------------------
// CLI entry point — only runs when this file is executed directly
// (`node scripts/seedGujaratiPackage.mjs`), not when imported by server.js.
// ---------------------------------------------------------------------------
const isDirectRun = (() => {
  try {
    if (!process.argv[1]) return false;
    return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  (async () => {
    ensureRequiredEnv();
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await seedGujaratiPackage();
    console.log(
      result.created
        ? "[seed:gu] inserted Gujarati package"
        : "[seed:gu] Gujarati package already present — skipped"
    );

    const cfg = await AssessmentConfig.getOrCreateDefault();
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
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
