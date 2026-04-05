import pkg from "../config/comprehensive500Package.generated.js";
import { scoreCareer500QPackage } from "../utils/scoring/packageScoring/career500q.js";

const buildMockAnswers = () => {
  const answers = {};

  pkg.sections.forEach((section) => {
    section.questions.forEach((question, index) => {
      const key = `${section.sectionId}-${index}`;
      if (question.type === "likert") {
        answers[key] = index % 2 === 0 ? 4 : 5;
        return;
      }

      answers[key] = question.correctOption || "A";
    });
  });

  return answers;
};

const result = scoreCareer500QPackage(buildMockAnswers(), pkg.sections);

console.log(
  JSON.stringify(
    {
      algorithmKey: result?.metadata?.algorithmKey,
      overallScore: result?.overallScore,
      personalityType: result?.personalityType?.code,
      sectionBreakdown: (result?.sectionBreakdown || []).map((section) => ({
        key: section.key,
        title: section.title,
        score: section.score,
        status: section.status,
        subsections: (section.subsections || []).map((subsection) => ({
          key: subsection.key,
          score: subsection.score,
          average: subsection.average,
          percentage: subsection.percentage,
          band: subsection.band,
          interpretation: subsection.interpretation,
          careerImplication: subsection.careerImplication,
          status: subsection.status,
        })),
      })),
    },
    null,
    2
  )
);
