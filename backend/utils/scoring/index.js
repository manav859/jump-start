import { computeGenericResultFromAnswers } from "./genericScoring.js";
import scoreCareer500QPackage from "./packageScoring/career500q.js";

const CAREER_500Q_PACKAGE_ID = "complete-aptitude-500q";

export const hasCareer500QPackage = (pkg = {}) =>
  String(pkg?.id || pkg?.packageId || "").trim() === CAREER_500Q_PACKAGE_ID;

export const computeAssessmentResult = ({
  answers = {},
  sections = [],
  packageId = "",
} = {}) => {
  if (String(packageId || "").trim() === CAREER_500Q_PACKAGE_ID) {
    return scoreCareer500QPackage(answers, sections);
  }

  return computeGenericResultFromAnswers(answers, sections);
};

export default computeAssessmentResult;
