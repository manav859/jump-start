import "dotenv/config";
import mongoose from "mongoose";
import { ensureRequiredEnv } from "../config/env.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import COMPREHENSIVE_500_PACKAGE from "../config/comprehensive500Package.generated.js";
import {
  DEMO_PACKAGE_ID,
  buildDemoPackageDoc,
} from "../utils/scoring/configs/career500qDemo.config.js";

// Idempotently inserts (or refreshes) the demo-aptitude-50q package on the
// default AssessmentConfig document. Other packages are preserved so this
// script can be run independently of seed:assessment.

async function run() {
  ensureRequiredEnv();

  await mongoose.connect(process.env.MONGODB_URI);
  const cfg = await AssessmentConfig.getOrCreateDefault();

  const demoPackage = {
    ...buildDemoPackageDoc(COMPREHENSIVE_500_PACKAGE),
    active: true,
    sortOrder: 0,
  };

  const existingPackages = Array.isArray(cfg.packages) ? cfg.packages : [];
  const existingIndex = existingPackages.findIndex(
    (pkg) => String(pkg?.id || "") === DEMO_PACKAGE_ID
  );

  if (existingIndex >= 0) {
    existingPackages[existingIndex] = demoPackage;
  } else {
    existingPackages.push(demoPackage);
  }

  cfg.packages = existingPackages;
  cfg.markModified("packages");
  await cfg.save();

  const totalQuestions = (demoPackage.sections || []).reduce(
    (sum, section) => sum + (section.questions?.length || 0),
    0
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        packageId: DEMO_PACKAGE_ID,
        title: demoPackage.title,
        sections: (demoPackage.sections || []).map((s) => ({
          sectionId: s.sectionId,
          title: s.title,
          questions: s.questions?.length || 0,
        })),
        totalQuestions,
      },
      null,
      2
    )
  );
}

run()
  .catch((err) => {
    console.error(err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
