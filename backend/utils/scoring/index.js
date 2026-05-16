import { computeGenericResultFromAnswers } from "./genericScoring.js";
import scoreCareer500QPackage from "./packageScoring/career500q.js";
import scoreCareer500QDemoPackage from "./packageScoring/career500qDemo.js";
import { DEMO_PACKAGE_ID } from "./configs/career500qDemo.config.js";

const CAREER_500Q_PACKAGE_ID = "complete-aptitude-500q";

export const hasCareer500QPackage = (pkg = {}) =>
  String(pkg?.id || pkg?.packageId || "").trim() === CAREER_500Q_PACKAGE_ID;

export const isDemoAptitude50QPackage = (pkg = {}) =>
  String(pkg?.id || pkg?.packageId || "").trim() === DEMO_PACKAGE_ID;

export const computeAssessmentResult = ({
  answers = {},
  sections = [],
  packageId = "",
} = {}) => {
  const id = String(packageId || "").trim();

  if (id === DEMO_PACKAGE_ID) {
    return scoreCareer500QDemoPackage(answers, sections);
  }

  if (id === CAREER_500Q_PACKAGE_ID) {
    return scoreCareer500QPackage(answers, sections);
  }

  return computeGenericResultFromAnswers(answers, sections);
};

export default computeAssessmentResult;
