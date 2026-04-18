import { getPersonalityAxisForQuestion } from "./personalityQuestionMetadata.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const average = (values = []) =>
  values.length
    ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
    : 0;

const averageOrDefault = (values = [], fallback = 50) => {
  const numericValues = values.filter((value) => Number.isFinite(value));
  return numericValues.length ? Math.round(average(numericValues)) : fallback;
};

const normalizeLikert = (rawAnswer, invert = false) => {
  const numeric = Number(rawAnswer);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) return null;
  return invert ? 6 - numeric : numeric;
};

const likertToPercent = (avg) =>
  clamp(Math.round(((Number(avg || 0) - 1) / 4) * 100), 0, 100);

const ratioToPercent = (earned, possible) =>
  possible > 0 ? clamp(Math.round((earned / possible) * 100), 0, 100) : 0;

const getAnswerKey = (sectionId, questionIndex) => `${sectionId}-${questionIndex}`;

const getQuestionId = (question = {}, fallbackIndex = 0) =>
  Number(question.questionId || question.question_id || fallbackIndex + 1);

const getSectionByTitle = (sections = [], title) =>
  sections.find(
    (section) =>
      String(section.title || "").trim().toLowerCase() === title.trim().toLowerCase()
  ) || null;

const getSelectedOptionText = (question = {}, rawAnswer) => {
  if (!question || question.type !== "single") return "";
  const options = Array.isArray(question.options) ? question.options : [];
  const answer = String(rawAnswer || "").trim().toUpperCase();
  if (!answer) return "";
  const optionIndex = answer.charCodeAt(0) - 65;
  if (optionIndex < 0 || optionIndex >= options.length) return "";
  return String(options[optionIndex] || "").trim();
};

const scoreSection = (section, answers = {}) => {
  const questions = Array.isArray(section?.questions) ? section.questions : [];
  let earned = 0;
  let possible = 0;
  let answeredCount = 0;

  questions.forEach((question, questionIndex) => {
    const rawAnswer = answers[getAnswerKey(section.sectionId, questionIndex)];
    const weight = Number(question.weight || 1);

    if (question.type === "single") {
      const correctOption = String(question.correctOption || "")
        .trim()
        .toUpperCase();
      const hasAnswer = rawAnswer !== undefined && String(rawAnswer).trim() !== "";
      if (hasAnswer) {
        answeredCount += 1;
      }

      if (!correctOption) {
        // Objective sections can contain conceptual items without machine-checkable
        // answer keys. Track completion for review, but do not inflate the score.
        if (section?.scoringType === "objective") {
          return;
        }

        // Interest-style single-choice questions do not have a correct option.
        // Treat them as completion-based scoring so the section is represented
        // in review/report breakdowns instead of being dropped entirely.
        possible += weight;
        if (hasAnswer) {
          earned += weight;
        }
        return;
      }

      possible += weight;
      if (String(rawAnswer || "").trim().toUpperCase() === correctOption) {
        earned += weight;
      }
      return;
    }

    const numeric = normalizeLikert(rawAnswer);
    if (numeric == null) return;
    answeredCount += 1;
    earned += numeric * weight;
    possible += 5 * weight;
  });

  if (!possible || !answeredCount) return null;

  const score = ratioToPercent(earned, possible);
  return {
    score,
    avgOutOf5: Number(((earned / possible) * 5).toFixed(2)),
    answeredCount,
    earnedValue: Number(earned.toFixed(2)),
    possibleValue: Number(possible.toFixed(2)),
    totalQuestions: questions.length,
  };
};

const MULTIPLE_INTELLIGENCE_GROUPS = [
  {
    key: "logicalMathematical",
    label: "Logical Reasoning",
    description: "Comfort with patterns, numbers, systems, and analytical problem solving.",
    startIndex: 0,
    endIndex: 9,
  },
  {
    key: "linguistic",
    label: "Communication",
    description: "Strength in reading, writing, vocabulary, and explaining ideas clearly.",
    startIndex: 10,
    endIndex: 19,
  },
  {
    key: "visualSpatial",
    label: "Visual Design",
    description: "Ability to visualize, design, and work with spatial relationships.",
    startIndex: 20,
    endIndex: 29,
  },
  {
    key: "musical",
    label: "Musical Sensitivity",
    description: "Sensitivity to rhythm, melody, sound patterns, and auditory detail.",
    startIndex: 30,
    endIndex: 39,
  },
  {
    key: "bodilyKinesthetic",
    label: "Hands-on Execution",
    description: "Learning through movement, making, performing, and physical coordination.",
    startIndex: 40,
    endIndex: 49,
  },
  {
    key: "interpersonal",
    label: "People Insight",
    description: "Understanding others, collaborating smoothly, and working with groups.",
    startIndex: 50,
    endIndex: 59,
  },
  {
    key: "intrapersonal",
    label: "Self Insight",
    description: "Awareness of personal motivations, strengths, and reflective thinking.",
    startIndex: 60,
    endIndex: 69,
  },
  {
    key: "naturalistic",
    label: "Nature Awareness",
    description: "Interest in ecosystems, natural patterns, and observing the environment.",
    startIndex: 70,
    endIndex: 79,
  },
];

const EMOTIONAL_INTELLIGENCE_GROUPS = [
  {
    key: "selfAwareness",
    label: "Self-Awareness",
    description: "Reading your own emotions, triggers, and internal patterns clearly.",
    startIndex: 0,
    endIndex: 9,
  },
  {
    key: "selfRegulation",
    label: "Self-Regulation",
    description: "Staying composed, managing impulses, and adapting under pressure.",
    startIndex: 10,
    endIndex: 19,
  },
  {
    key: "motivation",
    label: "Drive & Motivation",
    description: "Persistence, initiative, and commitment to long-term goals.",
    startIndex: 20,
    endIndex: 29,
  },
  {
    key: "empathy",
    label: "Empathy",
    description: "Understanding the feelings, perspectives, and non-verbal cues of others.",
    startIndex: 30,
    endIndex: 39,
  },
  {
    key: "socialSkills",
    label: "Social Skills",
    description: "Building rapport, leading groups, negotiating, and resolving conflict well.",
    startIndex: 40,
    endIndex: 49,
  },
];

const APTITUDE_GROUPS = [
  {
    key: "verbalReasoning",
    label: "Verbal Reasoning",
    description: "Analogies, language accuracy, and verbal logic.",
    fromQuestionId: 291,
    toQuestionId: 315,
  },
  {
    key: "numericalAbility",
    label: "Numerical Ability",
    description: "Arithmetic fluency, ratios, sequences, and numerical problem solving.",
    fromQuestionId: 316,
    toQuestionId: 340,
  },
  {
    key: "abstractReasoning",
    label: "Abstract Reasoning",
    description: "Pattern recognition, symbolic logic, and non-verbal reasoning.",
    fromQuestionId: 341,
    toQuestionId: 365,
  },
  {
    key: "spatialRelations",
    label: "Spatial Relations",
    description: "Visualizing shapes, rotations, folding, and three-dimensional relationships.",
    questionIds: Array.from({ length: 25 }, (_, index) => 366 + index),
  },
  {
    key: "mechanicalReasoning",
    label: "Mechanical Reasoning",
    description: "Understanding gears, pulleys, force, motion, and physical systems.",
    questionIds: Array.from({ length: 20 }, (_, index) => 391 + index),
  },
  {
    key: "clericalAccuracy",
    label: "Clerical Speed & Accuracy",
    description: "Detecting exact matches quickly across codes, names, numbers, and records.",
    fromQuestionId: 411,
    toQuestionId: 430,
  },
  {
    key: "criticalThinking",
    label: "Critical Thinking",
    description: "Evaluating claims, spotting fallacies, and judging source quality.",
    fromQuestionId: 431,
    toQuestionId: 440,
  },
  {
    key: "problemSolving",
    label: "Problem Solving",
    description: "Working through logic puzzles, constraints, and multi-step scenarios.",
    fromQuestionId: 441,
    toQuestionId: 450,
  },
];

const aptitudeGroupIncludesQuestion = (group = {}, questionId) =>
  Array.isArray(group.questionIds) && group.questionIds.length
    ? group.questionIds.includes(questionId)
    : questionId >= group.fromQuestionId && questionId <= group.toQuestionId;

const INTEREST_THEME_LABELS = {
  realistic: "Practical Interests",
  investigative: "Investigative Interests",
  artistic: "Creative Interests",
  social: "People-Centered Interests",
  enterprising: "Leadership Interests",
  conventional: "Structured Work Interests",
};

const PERSONALITY_AXIS_RULES = {
  extraversion: [
    {
      pattern:
        /talkative|outgoing|full of energy|enthusiasm|start conversations|large gatherings|social gatherings|lots of people|center of attention|confident in most social situations|comfortable being the center of attention|generate a lot of enthusiasm/i,
      direction: 1,
    },
    {
      pattern: /reserved and quiet|shy and withdrawn|working alone rather than in groups/i,
      direction: -1,
    },
  ],
  openness: [
    {
      pattern:
        /learning new things|exploring ideas|curious|active imagination|creatively|artistic|aesthetic|reflect and play with ideas|abstract thinking|ideas than in practical matters|intellectual discussions|new adventures/i,
      direction: 1,
    },
    {
      pattern: /routine and predictable|practical solutions over theoretical/i,
      direction: -1,
    },
  ],
  agreeableness: [
    {
      pattern:
        /trusting and cooperative|helpful and unselfish|forgiving nature|trusting of other people|sensitive to others' feelings|understand others' perspectives|concerned when others are suffering|put myself in someone else's shoes|sensitive to others' feelings and emotions/i,
      direction: 1,
    },
    {
      pattern: /find fault with others easily|cold and aloof toward others/i,
      direction: -1,
    },
  ],
  conscientiousness: [
    {
      pattern:
        /organized and in its place|plans and follow through|persevere until a task is finished|plan ahead|follow rules and established procedures|like to be in control|have everything organized/i,
      direction: 1,
    },
    {
      pattern:
        /keep my options open rather than stick to a plan|careless and disorganized|lazy and put off tasks/i,
      direction: -1,
    },
  ],
  emotionalStability: [
    {
      pattern: /remain calm|relaxed and handle stress well|rarely feel blue|calm under pressure/i,
      direction: 1,
    },
    {
      pattern: /easily stressed|worry|nervous and anxious|concerned about what others think/i,
      direction: -1,
    },
  ],
};

export const PERSONALITY_ARCHETYPES = {
  INTJ: {
    title: "Architect",
    description:
      "Strategic, future-focused, and motivated by solving complex problems with independent thinking.",
  },
  INTP: {
    title: "Logician",
    description:
      "Curious, analytical, and energized by ideas, systems, and unconventional solutions.",
  },
  ENTJ: {
    title: "Commander",
    description:
      "Decisive, ambitious, and naturally drawn to leadership, planning, and long-range execution.",
  },
  ENTP: {
    title: "Visionary",
    description:
      "Inventive, energetic, and quick to spot opportunities, patterns, and new possibilities.",
  },
  INFJ: {
    title: "Advocate",
    description:
      "Insightful, values-driven, and motivated by helping people grow in meaningful ways.",
  },
  INFP: {
    title: "Mediator",
    description:
      "Reflective, idealistic, and guided by values, creativity, and personal authenticity.",
  },
  ENFJ: {
    title: "Mentor",
    description:
      "Supportive, persuasive, and skilled at motivating people around shared goals.",
  },
  ENFP: {
    title: "Catalyst",
    description:
      "Expressive, imaginative, and excited by people, ideas, and new experiences.",
  },
  ISTJ: {
    title: "Logistician",
    description:
      "Reliable, methodical, and strongest in roles that value structure, accuracy, and accountability.",
  },
  ISFJ: {
    title: "Protector",
    description:
      "Steady, compassionate, and attentive to people, details, and dependable follow-through.",
  },
  ESTJ: {
    title: "Executive",
    description:
      "Organized, pragmatic, and effective at driving teams, systems, and operational discipline.",
  },
  ESFJ: {
    title: "Coordinator",
    description:
      "Warm, responsible, and strong at keeping teams aligned, supported, and productive.",
  },
  ISTP: {
    title: "Problem Solver",
    description:
      "Calm, adaptable, and skilled at practical troubleshooting and hands-on analysis.",
  },
  ISFP: {
    title: "Creator",
    description:
      "Observant, grounded, and expressive through craft, design, and values-led choices.",
  },
  ESTP: {
    title: "Builder",
    description:
      "Action-oriented, bold, and effective in fast-moving environments with visible results.",
  },
  ESFP: {
    title: "Connector",
    description:
      "Engaging, energetic, and naturally tuned to people, experience, and momentum.",
  },
};

const SIGNAL_LABELS = {
  realistic: "hands-on and practical interests",
  investigative: "investigative interests",
  artistic: "creative expression",
  social: "people-centered motivation",
  enterprising: "leadership and initiative",
  conventional: "structured work preferences",
  logicalMathematical: "analytical reasoning",
  linguistic: "communication strength",
  visualSpatial: "design and visualization skill",
  musical: "auditory pattern sensitivity",
  bodilyKinesthetic: "hands-on execution",
  interpersonal: "collaboration skill",
  intrapersonal: "self-awareness",
  naturalistic: "environmental awareness",
  selfAwareness: "emotional awareness",
  selfRegulation: "self-regulation",
  motivation: "self-motivation",
  empathy: "empathy",
  socialSkills: "relationship building",
  logicalReasoning: "logical aptitude",
  abstractReasoning: "abstract reasoning",
  spatialRelations: "spatial reasoning",
  mechanicalReasoning: "mechanical aptitude",
  clericalAccuracy: "accuracy and detail orientation",
  criticalThinking: "critical evaluation",
  problemSolving: "problem-solving",
  verbalReasoning: "verbal aptitude",
  numericalAbility: "numerical aptitude",
  quantitativeReasoning: "quantitative aptitude",
  introversion: "deep focus",
  extraversion: "social energy",
  intuition: "future-oriented thinking",
  sensing: "practical focus",
  feeling: "human-centered judgment",
  thinking: "objective decision-making",
  judging: "planning discipline",
  perceiving: "adaptable exploration",
  assertive: "calm confidence",
  turbulent: "intense self-pressure",
  openness: "curiosity",
};

const CAREER_ARCHETYPES = [
  {
    title: "Data Scientist",
    summary:
      "Turn messy datasets into clear insights, forecasts, and decision support.",
    salaryRange: "Avg. salary: INR 8-18 LPA",
    skills: ["Python", "Statistics", "Machine Learning", "Data Visualization"],
    weights: {
      investigative: 0.16,
      conventional: 0.06,
      logicalMathematical: 0.19,
      intrapersonal: 0.04,
      logicalReasoning: 0.14,
      quantitativeReasoning: 0.17,
      intuition: 0.06,
      selfRegulation: 0.05,
      motivation: 0.05,
    },
  },
  {
    title: "Software Engineer",
    summary:
      "Build reliable digital products by combining structured logic with technical depth.",
    salaryRange: "Avg. salary: INR 7-20 LPA",
    skills: ["Programming", "System Design", "Debugging", "Problem Solving"],
    weights: {
      investigative: 0.14,
      realistic: 0.06,
      conventional: 0.05,
      logicalMathematical: 0.18,
      visualSpatial: 0.08,
      logicalReasoning: 0.16,
      quantitativeReasoning: 0.12,
      introversion: 0.05,
      judging: 0.05,
      intuition: 0.05,
      selfRegulation: 0.06,
    },
  },
  {
    title: "UX Designer",
    summary:
      "Design digital experiences that feel intuitive, useful, and emotionally clear.",
    salaryRange: "Avg. salary: INR 6-15 LPA",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    weights: {
      artistic: 0.15,
      investigative: 0.05,
      social: 0.08,
      visualSpatial: 0.18,
      linguistic: 0.08,
      interpersonal: 0.08,
      verbalReasoning: 0.07,
      intuition: 0.1,
      feeling: 0.06,
      empathy: 0.08,
      socialSkills: 0.07,
    },
  },
  {
    title: "Business Analyst",
    summary:
      "Bridge operations, data, and stakeholders to improve how teams solve business problems.",
    salaryRange: "Avg. salary: INR 7-16 LPA",
    skills: ["SQL", "Requirements", "Process Mapping", "Stakeholder Communication"],
    weights: {
      enterprising: 0.11,
      investigative: 0.09,
      conventional: 0.12,
      logicalMathematical: 0.14,
      linguistic: 0.07,
      logicalReasoning: 0.14,
      verbalReasoning: 0.1,
      quantitativeReasoning: 0.12,
      judging: 0.08,
      thinking: 0.07,
      socialSkills: 0.06,
    },
  },
  {
    title: "Product Manager",
    summary:
      "Translate user needs, strategy, and execution into products that create real impact.",
    salaryRange: "Avg. salary: INR 10-24 LPA",
    skills: [
      "Roadmapping",
      "User Discovery",
      "Prioritization",
      "Cross-functional Leadership",
    ],
    weights: {
      enterprising: 0.14,
      investigative: 0.06,
      social: 0.08,
      logicalMathematical: 0.08,
      linguistic: 0.08,
      interpersonal: 0.1,
      verbalReasoning: 0.1,
      logicalReasoning: 0.08,
      extraversion: 0.06,
      intuition: 0.07,
      judging: 0.06,
      selfAwareness: 0.04,
      socialSkills: 0.1,
      motivation: 0.05,
    },
  },
  {
    title: "Psychologist / Counsellor",
    summary:
      "Use empathy, reflection, and people insight to guide individuals through growth and decisions.",
    salaryRange: "Avg. salary: INR 4-12 LPA",
    skills: ["Active Listening", "Counselling", "Observation", "Ethical Practice"],
    weights: {
      social: 0.16,
      investigative: 0.06,
      artistic: 0.04,
      interpersonal: 0.14,
      intrapersonal: 0.11,
      linguistic: 0.07,
      feeling: 0.09,
      intuition: 0.05,
      selfAwareness: 0.08,
      empathy: 0.15,
      socialSkills: 0.08,
    },
  },
  {
    title: "Teacher / Learning Designer",
    summary:
      "Explain ideas clearly, design learning journeys, and help others build confidence over time.",
    salaryRange: "Avg. salary: INR 4-10 LPA",
    skills: ["Teaching", "Curriculum Design", "Communication", "Facilitation"],
    weights: {
      social: 0.14,
      artistic: 0.05,
      enterprising: 0.05,
      linguistic: 0.15,
      interpersonal: 0.11,
      intrapersonal: 0.06,
      verbalReasoning: 0.08,
      feeling: 0.07,
      empathy: 0.11,
      socialSkills: 0.1,
      motivation: 0.08,
    },
  },
  {
    title: "Marketing Strategist",
    summary:
      "Combine audience insight, storytelling, and positioning to create demand and brand momentum.",
    salaryRange: "Avg. salary: INR 6-14 LPA",
    skills: ["Positioning", "Campaign Strategy", "Copywriting", "Audience Research"],
    weights: {
      artistic: 0.1,
      enterprising: 0.16,
      social: 0.08,
      linguistic: 0.12,
      interpersonal: 0.07,
      visualSpatial: 0.05,
      verbalReasoning: 0.12,
      extraversion: 0.07,
      intuition: 0.06,
      empathy: 0.06,
      socialSkills: 0.09,
      motivation: 0.05,
    },
  },
  {
    title: "Financial Analyst",
    summary:
      "Evaluate numbers, trends, and risk to support disciplined business and investment decisions.",
    salaryRange: "Avg. salary: INR 7-17 LPA",
    skills: ["Excel", "Financial Modeling", "Valuation", "Reporting"],
    weights: {
      conventional: 0.13,
      investigative: 0.08,
      enterprising: 0.05,
      logicalMathematical: 0.17,
      logicalReasoning: 0.11,
      quantitativeReasoning: 0.18,
      judging: 0.08,
      thinking: 0.08,
      selfRegulation: 0.06,
      motivation: 0.06,
    },
  },
  {
    title: "Healthcare Professional",
    summary:
      "Support wellbeing by combining science, calm decision-making, and consistent empathy.",
    salaryRange: "Avg. salary: INR 5-15 LPA",
    skills: ["Patient Care", "Clinical Judgment", "Communication", "Decision Making"],
    weights: {
      social: 0.14,
      investigative: 0.11,
      realistic: 0.04,
      logicalMathematical: 0.11,
      interpersonal: 0.08,
      logicalReasoning: 0.08,
      quantitativeReasoning: 0.06,
      feeling: 0.05,
      selfRegulation: 0.1,
      motivation: 0.08,
      empathy: 0.1,
      socialSkills: 0.05,
    },
  },
  {
    title: "Environmental Researcher",
    summary:
      "Study ecosystems, sustainability, and real-world patterns to solve environmental challenges.",
    salaryRange: "Avg. salary: INR 5-12 LPA",
    skills: ["Field Research", "Data Analysis", "Environmental Science", "Reporting"],
    weights: {
      realistic: 0.11,
      investigative: 0.12,
      social: 0.03,
      naturalistic: 0.19,
      logicalMathematical: 0.08,
      visualSpatial: 0.05,
      logicalReasoning: 0.08,
      quantitativeReasoning: 0.06,
      intuition: 0.05,
      selfRegulation: 0.06,
      motivation: 0.05,
    },
  },
  {
    title: "Operations Manager",
    summary:
      "Build reliable systems, improve workflows, and keep teams executing with consistency.",
    salaryRange: "Avg. salary: INR 7-18 LPA",
    skills: ["Planning", "Process Improvement", "Coordination", "Execution"],
    weights: {
      enterprising: 0.08,
      conventional: 0.15,
      interpersonal: 0.06,
      logicalMathematical: 0.08,
      logicalReasoning: 0.09,
      quantitativeReasoning: 0.08,
      judging: 0.11,
      thinking: 0.05,
      selfRegulation: 0.11,
      motivation: 0.09,
      socialSkills: 0.1,
    },
  },
];

const computeGroupedLikertScores = (section, answers, groups) =>
  groups.map((group) => {
    const values = [];
    const questions = Array.isArray(section?.questions) ? section.questions : [];

    questions.forEach((question, questionIndex) => {
      if (questionIndex < group.startIndex || questionIndex > group.endIndex) return;
      const numeric = normalizeLikert(
        answers[getAnswerKey(section.sectionId, questionIndex)],
        question.reverseScored === true
      );
      if (numeric != null) values.push(numeric);
    });

    return {
      key: group.key,
      label: group.label,
      description: group.description,
      value: values.length ? likertToPercent(average(values)) : 0,
    };
  });

const computeAptitudeScores = (section, answers) =>
  APTITUDE_GROUPS.map((group) => {
    let earned = 0;
    let possible = 0;
    let questionCount = 0;
    let answeredCount = 0;

    (section?.questions || []).forEach((question, questionIndex) => {
      const questionId = getQuestionId(question, questionIndex);
      if (!aptitudeGroupIncludesQuestion(group, questionId)) return;
      questionCount += 1;
      const rawAnswer = String(
        answers[getAnswerKey(section.sectionId, questionIndex)] || ""
      )
        .trim()
        .toUpperCase();
      if (rawAnswer) {
        answeredCount += 1;
      }
      const correctOption = String(question.correctOption || "")
        .trim()
        .toUpperCase();
      if (!correctOption) return;
      possible += 1;
      if (rawAnswer && rawAnswer === correctOption) earned += 1;
    });

    if (!questionCount) return null;

    return {
      key: group.key,
      label: group.label,
      description: group.description,
      value:
        possible > 0
          ? ratioToPercent(earned, possible)
          : ratioToPercent(answeredCount, questionCount),
      status:
        answeredCount >= questionCount ? "completed" : "incomplete",
    };
  }).filter(Boolean);

const getAxisScore = (section, answers, axisKey, rules = []) => {
  const values = [];
  (section?.questions || []).forEach((question, questionIndex) => {
    const rawAnswer = answers[getAnswerKey(section.sectionId, questionIndex)];
    const explicitAxis = getPersonalityAxisForQuestion(question, questionIndex);

    if (explicitAxis === axisKey) {
      const numeric = normalizeLikert(rawAnswer, question.reverseScored === true);
      if (numeric != null) values.push(numeric);
      return;
    }

    if (explicitAxis) return;

    const text = String(question.text || question.question || "");
    const matchedRule = rules.find((rule) => rule.pattern.test(text));
    if (!matchedRule) return;

    const numeric = normalizeLikert(rawAnswer, matchedRule.direction < 0);
    if (numeric != null) values.push(numeric);
  });
  return values.length ? likertToPercent(average(values)) : 50;
};

const INTEREST_THEME_RULES = {
  realistic: [
    /sports?|outdoor|nature|conservation|rural|prototype|build|robot|hands-on|traveling|maps?|diagrams?|mechanical/i,
  ],
  investigative: [
    /science|chemistry|research|data|mathematics?|programming|engineer|architect|doctor|nurse|technology|laboratory|scientific|discoveries|puzzles?|logic/i,
  ],
  artistic: [
    /design|art|creative|writing|music|theater|drama|animation|gallery|museum|publication|cultural|self-expression|playlists/i,
  ],
  social: [
    /charity|tutoring|coaching|volunteer|hospital|clinic|social services|community service|group discussions|seminars|collaborative|team|helping|clients?|customers?|school|educational|supportive/i,
  ],
  enterprising: [
    /fundraising|business|campaign|market research|presentation|debate|student government|entrepreneur|marketing|advertising|budget|leadership|advancement|corporate|sales|dynamic/i,
  ],
  conventional: [
    /files|records|databases|numbers|financial data|procedures|schedules|administrative|accuracy|structured|organized|office|regular business hours|stability and security|established corporation|9[- ]?5/i,
  ],
};

const classifyInterestText = (text = "") => {
  const weights = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  Object.entries(INTEREST_THEME_RULES).forEach(([theme, patterns]) => {
    const matchedCount = patterns.reduce(
      (count, pattern) => count + (pattern.test(text) ? 1 : 0),
      0
    );
    if (matchedCount > 0) {
      weights[theme] += matchedCount;
    }
  });

  if (!Object.values(weights).some((value) => value > 0)) {
    if (/historical|foreign cultures|languages/i.test(text)) weights.artistic += 1;
    if (/science museum/i.test(text)) weights.investigative += 1;
    if (/major city/i.test(text)) weights.enterprising += 1;
    if (/work-life balance/i.test(text)) weights.social += 1;
    if (/peaceful/i.test(text)) weights.conventional += 1;
  }

  return weights;
};

const computeInterestScores = (section, answers = {}) => {
  const themeTotals = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  (section?.questions || []).forEach((question, questionIndex) => {
    const rawAnswer = answers[getAnswerKey(section.sectionId, questionIndex)];
    if (question.type === "single") {
      const selectedText = getSelectedOptionText(question, rawAnswer);
      if (!selectedText) return;
      const weights = classifyInterestText(selectedText);
      Object.keys(themeTotals).forEach((theme) => {
        themeTotals[theme] += weights[theme] || 0;
      });
      return;
    }

    const numeric = normalizeLikert(rawAnswer);
    if (numeric == null) return;
    const weights = classifyInterestText(String(question.text || ""));
    const intensity = numeric / 5;
    Object.keys(themeTotals).forEach((theme) => {
      themeTotals[theme] += (weights[theme] || 0) * intensity;
    });
  });

  const maxThemeScore = Math.max(...Object.values(themeTotals), 1);
  const normalized = Object.fromEntries(
    Object.entries(themeTotals).map(([theme, value]) => [
      theme,
      clamp(Math.round((value / maxThemeScore) * 100), 0, 100),
    ])
  );

  const orderedThemes = Object.entries(normalized)
    .sort(([, a], [, b]) => b - a)
    .map(([theme]) => theme);

  return {
    ...normalized,
    code: orderedThemes
      .slice(0, 3)
      .map((theme) => theme.charAt(0).toUpperCase())
      .join(""),
  };
};

const buildPersonalityProfile = (personalitySection, eqScores = [], answers = {}) => {
  const extraversion = getAxisScore(
    personalitySection,
    answers,
    "extraversion",
    PERSONALITY_AXIS_RULES.extraversion
  );
  const openness = getAxisScore(
    personalitySection,
    answers,
    "openness",
    PERSONALITY_AXIS_RULES.openness
  );
  const agreeableness = getAxisScore(
    personalitySection,
    answers,
    "agreeableness",
    PERSONALITY_AXIS_RULES.agreeableness
  );
  const conscientiousness = getAxisScore(
    personalitySection,
    answers,
    "conscientiousness",
    PERSONALITY_AXIS_RULES.conscientiousness
  );
  const emotionalStability = getAxisScore(
    personalitySection,
    answers,
    "emotionalStability",
    PERSONALITY_AXIS_RULES.emotionalStability
  );

  const eqMap = Object.fromEntries(eqScores.map((entry) => [entry.key, entry.value]));
  const feeling = clamp(
    Math.round(
      agreeableness * 0.55 +
        Number(eqMap.empathy || 50) * 0.3 +
        Number(eqMap.socialSkills || 50) * 0.15
    ),
    0,
    100
  );
  const judging = clamp(
    Math.round(
      conscientiousness * 0.75 + Number(eqMap.selfRegulation || 50) * 0.25
    ),
    0,
    100
  );
  const assertive = clamp(
    Math.round(
      emotionalStability * 0.6 +
        Number(eqMap.selfRegulation || 50) * 0.25 +
        Number(eqMap.motivation || 50) * 0.15
    ),
    0,
    100
  );

  const baseCode = `${extraversion >= 50 ? "E" : "I"}${openness >= 50 ? "N" : "S"}${
    feeling >= 50 ? "F" : "T"
  }${judging >= 50 ? "J" : "P"}`;
  const fullCode = `${baseCode}-${assertive >= 50 ? "A" : "T"}`;
  const archetype = PERSONALITY_ARCHETYPES[baseCode] || {
    title: "Career Explorer",
    description: "Balanced across structure, curiosity, and interpersonal awareness.",
  };

  return {
    code: fullCode,
    title: archetype.title,
    description: `${archetype.description} ${
      assertive >= 50
        ? "You also show a calm, self-directed style under pressure."
        : "You also appear highly responsive, conscientious, and emotionally engaged under pressure."
    }`,
    traits: [
      {
        name: extraversion >= 50 ? "Extraversion" : "Introversion",
        value: extraversion >= 50 ? extraversion : 100 - extraversion,
      },
      {
        name: openness >= 50 ? "Intuition" : "Sensing",
        value: openness >= 50 ? openness : 100 - openness,
      },
      {
        name: feeling >= 50 ? "Feeling" : "Thinking",
        value: feeling >= 50 ? feeling : 100 - feeling,
      },
      {
        name: judging >= 50 ? "Judging" : "Perceiving",
        value: judging >= 50 ? judging : 100 - judging,
      },
    ],
    metrics: {
      extraversion,
      openness,
      feeling,
      judging,
      assertive,
      agreeableness,
      conscientiousness,
      emotionalStability,
    },
  };
};

export const buildStrengths = (signals = {}) => {
  const signal = (key) => Number(signals[key] ?? 50);

  const candidates = [
    {
      name: "Analytical Thinking",
      value: Math.round(
        average([
          signal("logicalMathematical"),
          signal("logicalReasoning"),
          signal("quantitativeReasoning"),
          signal("investigative"),
        ])
      ),
      desc: "Comfort with structured problem solving, evidence, and patterns in complex information.",
    },
    {
      name: "Creative Problem Solving",
      value: Math.round(
        average([
          signal("artistic"),
          signal("visualSpatial"),
          signal("intuition"),
          signal("openness"),
        ])
      ),
      desc: "Ability to reframe challenges, imagine alternatives, and generate novel approaches.",
    },
    {
      name: "Communication",
      value: Math.round(
        average([
          signal("linguistic"),
          signal("verbalReasoning"),
          signal("socialSkills"),
        ])
      ),
      desc: "Explaining ideas clearly, organizing information, and adapting messages to the audience.",
    },
    {
      name: "Empathy & Collaboration",
      value: Math.round(
        average([
          signal("interpersonal"),
          signal("empathy"),
          signal("feeling"),
          signal("social"),
        ])
      ),
      desc: "Reading people well, understanding context, and contributing positively in team settings.",
    },
    {
      name: "Leadership Potential",
      value: Math.round(
        average([
          signal("enterprising"),
          signal("socialSkills"),
          signal("motivation"),
          signal("extraversion"),
        ])
      ),
      desc: "Drive to influence outcomes, take initiative, and guide people toward shared goals.",
    },
    {
      name: "Self-Management",
      value: Math.round(
        average([
          signal("selfAwareness"),
          signal("selfRegulation"),
          signal("judging"),
          signal("assertive"),
        ])
      ),
      desc: "Consistent planning, emotional balance, and follow-through even when conditions change.",
    },
    {
      name: "Research Orientation",
      value: Math.round(
        average([
          signal("investigative"),
          signal("logicalReasoning"),
          signal("logicalMathematical"),
          signal("intrapersonal"),
        ])
      ),
      desc: "Natural tendency to investigate, question assumptions, and learn through evidence.",
    },
  ];

  return candidates.sort((a, b) => b.value - a.value).slice(0, 5);
};

const joinList = (items = []) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

export const buildCareerRecommendations = (signals = {}) =>
  CAREER_ARCHETYPES.map((career) => {
    let weightedScore = 0;
    let totalWeight = 0;
    const contributions = [];

    Object.entries(career.weights).forEach(([key, weight]) => {
      const signalValue = clamp(Number(signals[key] ?? 50), 0, 100);
      weightedScore += signalValue * weight;
      totalWeight += weight;
      contributions.push({
        key,
        weightedValue: signalValue * weight,
      });
    });

    const rawMatch = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const matchPercent = clamp(Math.round(52 + rawMatch * 0.43), 58, 96);
    const drivers = contributions
      .sort((a, b) => b.weightedValue - a.weightedValue)
      .slice(0, 3)
      .map((entry) => SIGNAL_LABELS[entry.key] || entry.key);

    return {
      title: career.title,
      matchPercent,
      description: `${career.summary} Strong alignment with your ${joinList(drivers)}.`,
      skills: career.skills,
      salaryRange: career.salaryRange,
      link: "/careerdetail",
    };
  })
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 6);

const buildSectionBreakdown = ({
  scoredSections = [],
  multipleIntelligenceScores = [],
  emotionalIntelligenceScores = [],
  aptitudeScores = [],
  interestScores = {},
  personalityType = null,
}) =>
  scoredSections.map(({ section, summary, interpretation }) => {
    let subsections = [];

    if (section.title === "Multiple Intelligence Assessment") {
      subsections = multipleIntelligenceScores.map((entry, index) => ({
        id: `${section.sectionId}.${index + 1}`,
        key: entry.key,
        label: entry.label,
        score: entry.value,
        maxScore: 100,
        percentage: entry.value,
        status: "completed",
        description: entry.description,
      }));
    } else if (section.title === "Emotional Intelligence Assessment") {
      subsections = emotionalIntelligenceScores.map((entry, index) => ({
        id: `${section.sectionId}.${index + 1}`,
        key: entry.key,
        label: entry.label,
        score: entry.value,
        maxScore: 100,
        percentage: entry.value,
        status: "completed",
        description: entry.description,
      }));
    } else if (section.title === "Aptitude Battery") {
      subsections = aptitudeScores.map((entry, index) => ({
        id: `${section.sectionId}.${index + 1}`,
        key: entry.key,
        label: entry.label,
        score: entry.value,
        maxScore: 100,
        percentage: entry.value,
        status: entry.status || "completed",
        description: entry.description,
      }));
    } else if (section.title === "Interest Assessment") {
      subsections = Object.entries(INTEREST_THEME_LABELS).map(
        ([key, label], index) => ({
          id: `${section.sectionId}.${index + 1}`,
          key,
          label,
          score: Number(interestScores[key] ?? 0),
          maxScore: 100,
          percentage: Number(interestScores[key] ?? 0),
          status: "completed",
          description: SIGNAL_LABELS[key] || "",
        })
      );
    } else if (section.title === "Personality Assessment") {
      const metrics = personalityType?.metrics || {};
      const personalityMetrics = [
        {
          key: "extraversion",
          label: "Extraversion",
          description: "Social energy, expression, and outward engagement.",
        },
        {
          key: "openness",
          label: "Openness",
          description: "Curiosity, imagination, and comfort with new ideas.",
        },
        {
          key: "agreeableness",
          label: "Agreeableness",
          description: "Cooperation, empathy, and trust in working with others.",
        },
        {
          key: "conscientiousness",
          label: "Conscientiousness",
          description: "Planning, discipline, and consistency in execution.",
        },
        {
          key: "emotionalStability",
          label: "Emotional Stability",
          description: "Calmness, resilience, and steadiness under pressure.",
        },
      ];

      subsections = personalityMetrics.map((metric, index) => ({
        id: `${section.sectionId}.${index + 1}`,
        key: metric.key,
        label: metric.label,
        score: Number(metrics[metric.key] ?? 0),
        maxScore: 100,
        percentage: Number(metrics[metric.key] ?? 0),
        status: "completed",
        description: metric.description,
      }));
    }

    return {
      sectionId: section.sectionId,
      title: section.title,
      score: summary.earnedValue,
      maxScore: summary.possibleValue,
      percentage: summary.score,
      answeredCount: summary.answeredCount,
      totalQuestions: summary.totalQuestions,
      status:
        summary.answeredCount >= summary.totalQuestions ? "completed" : "incomplete",
      interpretation,
      scoringType: section.scoringType || "",
      subsections,
    };
  });

export const buildReviewSummary = ({
  strengths = [],
  careerRecommendations = [],
  personalityType = null,
  sectionBreakdown = [],
  completedTestsCount = 0,
  totalTestsCount = 0,
}) => ({
  statusLabel:
    completedTestsCount >= totalTestsCount && totalTestsCount > 0
      ? "Ready for Review"
      : "Incomplete Submission",
  strongestSignals: strengths.slice(0, 3).map((item) => item.name),
  topCareerTitles: careerRecommendations.slice(0, 3).map((item) => item.title),
  observations: [
    personalityType?.code
      ? `Estimated personality profile: ${personalityType.code} (${personalityType.title}).`
      : "",
    strengths[0]?.name
      ? `Strongest signal area: ${strengths[0].name} at ${strengths[0].value}%.`
      : "",
    careerRecommendations[0]?.title
      ? `Top recommended pathway: ${careerRecommendations[0].title} with ${careerRecommendations[0].matchPercent}% match.`
      : "",
    sectionBreakdown.some((section) => section.status === "incomplete")
      ? "Some sections appear incomplete and should be reviewed before publication."
      : "All available sections were completed and are ready for admin review.",
  ].filter(Boolean),
});

export const computeResultFromAnswers = (answers, sections) => {
  if (!answers || typeof answers !== "object") return null;
  const enabledSections = (sections || []).filter((section) => section.enabled !== false);
  if (!enabledSections.length) return null;

  const scoredSections = enabledSections
    .map((section) => {
      const summary = scoreSection(section, answers);
      if (!summary) return null;

      const interpretation =
        section.scoringType === "objective"
          ? summary.score >= 80
            ? "High aptitude range"
            : summary.score >= 60
              ? "Moderate aptitude range"
              : "Developing aptitude range"
          : summary.avgOutOf5 >= 4
            ? "Strong preference / profile signal"
            : summary.avgOutOf5 >= 3
              ? "Balanced profile signal"
              : "Developing profile signal";

      return { section, summary, interpretation };
    })
    .filter(Boolean);

  const testResults = scoredSections.map(({ section, summary, interpretation }) => ({
    sectionId: section.sectionId,
    sectionName: section.title,
    testName: section.title,
    completedAt: new Date(),
    score: summary.score,
    maxScore: 100,
    avgOutOf5: summary.avgOutOf5,
    interpretation,
    reportUrl: "",
  }));

  if (!testResults.length) return null;

  const personalitySection = getSectionByTitle(enabledSections, "Personality Assessment");
  const multipleIntelligenceSection = getSectionByTitle(
    enabledSections,
    "Multiple Intelligence Assessment"
  );
  const interestSection = getSectionByTitle(enabledSections, "Interest Assessment");
  const aptitudeSection = getSectionByTitle(enabledSections, "Aptitude Battery");
  const emotionalIntelligenceSection = getSectionByTitle(
    enabledSections,
    "Emotional Intelligence Assessment"
  );

  const multipleIntelligenceScores = multipleIntelligenceSection
    ? computeGroupedLikertScores(
        multipleIntelligenceSection,
        answers,
        MULTIPLE_INTELLIGENCE_GROUPS
      )
    : [];
  const emotionalIntelligenceScores = emotionalIntelligenceSection
    ? computeGroupedLikertScores(
        emotionalIntelligenceSection,
        answers,
        EMOTIONAL_INTELLIGENCE_GROUPS
      )
    : [];
  const aptitudeScores = aptitudeSection
    ? computeAptitudeScores(aptitudeSection, answers)
    : [];
  const interestScores = interestSection
    ? computeInterestScores(interestSection, answers)
    : {
        realistic: 50,
        investigative: 50,
        artistic: 50,
        social: 50,
        enterprising: 50,
        conventional: 50,
        code: "ISE",
      };
  const personalityType = personalitySection
    ? buildPersonalityProfile(personalitySection, emotionalIntelligenceScores, answers)
    : null;

  const miMap = Object.fromEntries(
    multipleIntelligenceScores.map((entry) => [entry.key, entry.value])
  );
  const eqMap = Object.fromEntries(
    emotionalIntelligenceScores.map((entry) => [entry.key, entry.value])
  );
  const aptitudeMap = Object.fromEntries(
    aptitudeScores.map((entry) => [entry.key, entry.value])
  );
  const metrics = personalityType?.metrics || {
    extraversion: 50,
    openness: 50,
    feeling: 50,
    judging: 50,
    assertive: 50,
  };

  const flattenedSignals = {
    realistic: interestScores.realistic ?? 50,
    investigative: interestScores.investigative ?? 50,
    artistic: interestScores.artistic ?? 50,
    social: interestScores.social ?? 50,
    enterprising: interestScores.enterprising ?? 50,
    conventional: interestScores.conventional ?? 50,
    logicalMathematical: miMap.logicalMathematical ?? 50,
    linguistic: miMap.linguistic ?? 50,
    visualSpatial: miMap.visualSpatial ?? 50,
    musical: miMap.musical ?? 50,
    bodilyKinesthetic: miMap.bodilyKinesthetic ?? 50,
    interpersonal: miMap.interpersonal ?? 50,
    intrapersonal: miMap.intrapersonal ?? 50,
    naturalistic: miMap.naturalistic ?? 50,
    selfAwareness: eqMap.selfAwareness ?? 50,
    selfRegulation: eqMap.selfRegulation ?? 50,
    motivation: eqMap.motivation ?? 50,
    empathy: eqMap.empathy ?? 50,
    socialSkills: eqMap.socialSkills ?? 50,
    logicalReasoning: averageOrDefault(
      [aptitudeMap.abstractReasoning, aptitudeMap.criticalThinking, aptitudeMap.problemSolving],
      50
    ),
    verbalReasoning: aptitudeMap.verbalReasoning ?? 50,
    quantitativeReasoning: averageOrDefault(
      [aptitudeMap.numericalAbility, aptitudeMap.clericalAccuracy],
      50
    ),
    extraversion: metrics.extraversion ?? 50,
    introversion: 100 - Number(metrics.extraversion ?? 50),
    intuition: metrics.openness ?? 50,
    sensing: 100 - Number(metrics.openness ?? 50),
    feeling: metrics.feeling ?? 50,
    thinking: 100 - Number(metrics.feeling ?? 50),
    judging: metrics.judging ?? 50,
    perceiving: 100 - Number(metrics.judging ?? 50),
    assertive: metrics.assertive ?? 50,
    turbulent: 100 - Number(metrics.assertive ?? 50),
    openness: metrics.openness ?? 50,
  };

  const strengths = buildStrengths(flattenedSignals);
  const careerRecommendations = buildCareerRecommendations(flattenedSignals);
  const overallScore = Math.round(average(testResults.map((item) => item.score)));
  const sectionBreakdown = buildSectionBreakdown({
    scoredSections,
    multipleIntelligenceScores,
    emotionalIntelligenceScores,
    aptitudeScores,
    interestScores,
    personalityType,
  });
  const reviewSummary = buildReviewSummary({
    strengths,
    careerRecommendations,
    personalityType,
    sectionBreakdown,
    completedTestsCount: testResults.length,
    totalTestsCount: enabledSections.length,
  });

  return {
    overallScore,
    overallPercentile: `Top ${Math.max(8, 100 - overallScore)}% profile strength`,
    completedTestsCount: testResults.length,
    totalTestsCount: enabledSections.length,
    careerPathwaysCount: CAREER_ARCHETYPES.length,
    testResults,
    sectionBreakdown,
    strengths,
    careerRecommendations,
    personalityType: personalityType
      ? {
          code: personalityType.code,
          title: personalityType.title,
          description: personalityType.description,
          traits: personalityType.traits,
        }
      : null,
    reviewSummary,
    metadata: {
      algorithmKey: "generic-profile",
      overallMaxScore: 100,
      packageId: "",
      scoringGuideSources: [],
      ambiguityNotes: [],
    },
  };
};
