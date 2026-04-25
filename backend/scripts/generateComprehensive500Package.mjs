import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import { applyPersonalityMetadataToQuestions } from "../utils/personalityQuestionMetadata.js";
import { LIVE_SPATIAL_RELATIONS_OVERRIDES } from "../config/spatialPdfQuestionBank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const referenceRoot = path.resolve(backendRoot, "reference");

const APTITUDE_PDF_PATH = path.resolve(
  referenceRoot,
  "complete-aptitude-test-500q.pdf"
);
const ANSWER_KEY_PDF_PATH = path.resolve(
  referenceRoot,
  "complete-answer-key-500q.pdf"
);
const ASSESSMENT_SEED_PATH = path.resolve(
  backendRoot,
  "config",
  "assessment-seed.json"
);
const OUTPUT_PATH = path.resolve(
  backendRoot,
  "config",
  "comprehensive500Package.generated.js"
);

const PACKAGE_META = {
  id: "complete-aptitude-500q",
  title: "Complete Aptitude Test (500Q)",
  badge: "Comprehensive",
  amount: 2499,
  strikeAmount: null,
  features: [
    "500 total questions",
    "Full 5-section assessment",
    "Detailed section and subsection reporting",
    "Admin review compatible scoring structure",
  ],
  durationText: "120-minute comprehensive assessment",
  active: true,
  sortOrder: 3,
};

const SECTION_3_DURATION = 18;
const SECTION_4_DURATION = 45;

const CANDIDATE_POSITION_GROUPS = [
  [1, 3],
  [1, 3, 4],
  [1, 2, 3, 4],
  [2, 4],
  [1, 2],
  [1, 4],
  [2, 3],
  [1, 2, 4],
  [2, 3, 4],
  [1],
  [2],
  [3],
  [4],
];

const cleanPdfText = (text) =>
  text
    .replace(/\u0000/g, " ")
    .replace(/[\u0007\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/--\s+\d+\s+of\s+\d+\s+--/g, " ")
    .replace(/Instructions:[^\n]*(?:\n|$)/g, "\n")
    .replace(/Duration:[^\n]*(?:\n|$)/g, "\n")
    .replace(/\uFFFD/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const loadPdfLines = async (filePath) => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  const result = await parser.getText();
  await parser.destroy();
  return cleanPdfText(result.text);
};

const getSectionSlice = (lines, startPattern, endPattern) => {
  const startIndex = lines.findIndex((line) => startPattern.test(line));
  if (startIndex < 0) {
    throw new Error(`Could not find section start: ${startPattern}`);
  }

  const endIndex = endPattern
    ? lines.findIndex(
        (line, index) => index > startIndex && endPattern.test(line)
      )
    : -1;

  return lines.slice(startIndex + 1, endIndex >= 0 ? endIndex : undefined);
};

const mapSeedQuestion = (question = {}, index = 0) => ({
  questionId:
    question.questionId || question.question_id || String(index + 1),
  text: question.text || question.question || "",
  type: question.type || "likert",
  options:
    question.options ||
    [
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.option_e,
    ].filter(Boolean),
  correctOption: question.correctOption || question.correct_option || "",
  reverseScored:
    question.reverseScored === true ||
    String(question.reverse_scored || "").toLowerCase() === "true",
  weight: Number(question.weight || 1),
  subscale: question.subscale || "",
  notes: question.notes || "",
});

const mapSeedSection = (section = {}) => ({
  sectionId: Number(section.sectionId),
  title: section.title,
  durationMinutes: Number(section.durationMinutes || 20),
  enabled: section.enabled !== false,
  scoringType: section.scoringType || "mixed",
  sheetCsvUrl: section.sheetCsvUrl || "",
  questions:
    Number(section.sectionId) === 1
      ? applyPersonalityMetadataToQuestions(
          Array.isArray(section.questions)
            ? section.questions.map((question, index) =>
                mapSeedQuestion(question, index)
              )
            : []
        )
      : Array.isArray(section.questions)
        ? section.questions.map((question, index) =>
            mapSeedQuestion(question, index)
          )
        : [],
});

const getSeedSection = (seedSections, sectionId) => {
  const section = (seedSections || []).find(
    (entry) => Number(entry.sectionId) === Number(sectionId)
  );
  if (!section) {
    throw new Error(`Seed section ${sectionId} not found`);
  }
  return mapSeedSection(section);
};

const createLikertQuestion = (questionId, text, weight = 1) => ({
  questionId: String(questionId),
  text: String(text || "").trim(),
  type: "likert",
  options: [],
  correctOption: "",
  reverseScored: false,
  weight,
});

const createSingleQuestion = (
  questionId,
  text,
  options,
  correctOption = "",
  weight = 1
) => ({
  questionId: String(questionId),
  text: String(text || "").replace(/\s+/g, " ").trim(),
  type: "single",
  options: options.map((value) => String(value || "").replace(/\s+/g, " ").trim()),
  correctOption,
  reverseScored: false,
  weight,
});

const stripQuestionPrefix = (line = "") =>
  line.replace(/^\d{3}\.\s*/, "").replace(/\s+/g, " ").trim();

const parseActivityBlockQuestions = (lines, startQuestionId) => {
  const questions = [];

  for (let index = 0; index < lines.length; ) {
    const prompt = String(lines[index] || "").trim();
    const optionA = String(lines[index + 1] || "").replace(/^a\)\s*/i, "").trim();
    const optionB = String(lines[index + 2] || "").replace(/^b\)\s*/i, "").trim();
    const optionC = String(lines[index + 3] || "").replace(/^c\)\s*/i, "").trim();

    if (!prompt || !optionA || !optionB || !optionC) {
      throw new Error(`Failed to parse activity question near line: ${prompt}`);
    }

    questions.push(
      createSingleQuestion(startQuestionId + questions.length, prompt, [
        optionA,
        optionB,
        optionC,
      ])
    );
    index += 4;
  }

  return questions;
};

const parseSection3Questions = (aptitudeLines) => {
  const hollandItems = aptitudeLines
    .filter((line) => /^\d{3}\.\s+/.test(line))
    .filter((line) => {
      const numericId = Number(line.slice(0, 3));
      return numericId >= 201 && numericId <= 236;
    })
    .map((line) => {
      const numericId = Number(line.slice(0, 3));
      return createLikertQuestion(numericId, stripQuestionPrefix(line));
    });

  const subjectItems = getSectionSlice(
    aptitudeLines,
    /3\.2 SUBJECT PREFERENCES/i,
    /3\.3 ACTIVITY PREFERENCES/i
  ).map((line, index) => createLikertQuestion(237 + index, line));

  const activityItems = parseActivityBlockQuestions(
    getSectionSlice(
      aptitudeLines,
      /3\.3 ACTIVITY PREFERENCES/i,
      /3\.4 WORK ENVIRONMENT PREFERENCES/i
    ),
    255
  );

  const workPreferenceItems = parseActivityBlockQuestions(
    getSectionSlice(aptitudeLines, /3\.4 WORK ENVIRONMENT PREFERENCES/i, /SECTION 4/i),
    273
  );

  const questions = [
    ...hollandItems,
    ...subjectItems,
    ...activityItems,
    ...workPreferenceItems,
  ];

  if (questions.length !== 90) {
    throw new Error(`Section 3 expected 90 questions, got ${questions.length}`);
  }

  return questions;
};

const parseInlineOptions = (text) => {
  const options = [];
  const matches = [...text.matchAll(/([a-d])\)\s*/gi)];

  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    options.push({
      key: matches[index][1].toLowerCase(),
      value: text.slice(start, end).trim(),
    });
  }

  return options;
};

const parseMcqSection = (lines) => {
  const questions = [];
  let current = null;

  const createDraft = () => ({
    textParts: [],
    options: { a: "", b: "", c: "", d: "" },
    lastOption: "",
  });

  const finalizeCurrent = () => {
    if (!current) return;
    if (
      current.textParts.length &&
      Object.values(current.options).every((value) => value)
    ) {
      questions.push({
        text: current.textParts.join(" ").replace(/\s+/g, " ").trim(),
        options: ["a", "b", "c", "d"].map((key) => current.options[key]),
      });
      current = null;
    }
  };

  for (const line of lines) {
    if (/^(SECTION \d|\d\.\d )/i.test(line)) continue;
    if (!current) current = createDraft();

    if (/^[a-d]\)/i.test(line)) {
      const parsedOptions = parseInlineOptions(line);
      if (parsedOptions.length) {
        parsedOptions.forEach(({ key, value }) => {
          current.options[key] = value;
          current.lastOption = key;
        });
        continue;
      }
    }

    if (line.includes("a)")) {
      const optionStart = line.indexOf("a)");
      const beforeOptions = line.slice(0, optionStart).trim();
      if (beforeOptions) {
        current.textParts.push(beforeOptions);
      }
      parseInlineOptions(line.slice(optionStart)).forEach(({ key, value }) => {
        current.options[key] = value;
        current.lastOption = key;
      });
      continue;
    }

    if (Object.values(current.options).every((value) => value)) {
      finalizeCurrent();
      current = createDraft();
      current.textParts.push(line);
      continue;
    }

    if (current.lastOption) {
      current.options[current.lastOption] = `${current.options[current.lastOption]} ${line}`.trim();
      continue;
    }

    current.textParts.push(line);
  }

  finalizeCurrent();
  return questions;
};

const parseAnswerLetters = (lines, startPattern, endPattern) =>
  getSectionSlice(lines, startPattern, endPattern)
    .map((line) => (line.match(/^([a-d])\)/i) || [])[1])
    .filter(Boolean)
    .map((value) => value.toUpperCase());

const toOptionLetter = (index) => String.fromCharCode(65 + index);

const formatPositions = (positions = []) => {
  if (!positions.length) return "No pairs are identical.";
  if (positions.length === 1) return `Pair ${positions[0]} is identical.`;
  if (positions.length === 2) {
    return `Pairs ${positions[0]} and ${positions[1]} are identical.`;
  }
  const head = positions.slice(0, -1).join(", ");
  return `Pairs ${head}, and ${positions.at(-1)} are identical.`;
};

const splitPairLine = (line = "") => {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length % 2 !== 0) {
    throw new Error(`Unable to split clerical pair line: ${line}`);
  }
  const midpoint = tokens.length / 2;
  return {
    left: tokens.slice(0, midpoint).join(" "),
    right: tokens.slice(midpoint).join(" "),
  };
};

const parseClericalQuestions = (lines, startQuestionId) => {
  const questions = [];
  let activeLabel = "Check which pairs are identical";
  let pairLines = [];

  const flushGroup = () => {
    if (!pairLines.length) return;
    if (pairLines.length !== 4) {
      throw new Error(
        `Clerical group expected 4 pair lines, got ${pairLines.length}`
      );
    }

    const pairs = pairLines.map((line) => splitPairLine(line));
    const identicalPositions = pairs
      .map((pair, index) => (pair.left === pair.right ? index + 1 : null))
      .filter(Boolean);

    const correctLabel = formatPositions(identicalPositions);
    const distractors = [];
    for (const candidate of CANDIDATE_POSITION_GROUPS) {
      const candidateLabel = formatPositions(candidate);
      if (candidateLabel === correctLabel || distractors.includes(candidateLabel)) {
        continue;
      }
      distractors.push(candidateLabel);
      if (distractors.length === 3) break;
    }

    const correctIndex = questions.length % 4;
    const options = [...distractors];
    options.splice(correctIndex, 0, correctLabel);

    const questionText = [
      `${activeLabel.replace(/:$/, "")}.`,
      ...pairs.map(
        (pair, index) => `${index + 1}. ${pair.left} / ${pair.right}`
      ),
    ].join(" ");

    questions.push(
      createSingleQuestion(
        startQuestionId + questions.length,
        questionText,
        options,
        toOptionLetter(correctIndex)
      )
    );

    pairLines = [];
  };

  for (const line of lines) {
    if (/:$/.test(line)) {
      flushGroup();
      activeLabel = line;
      continue;
    }
    pairLines.push(line);
    if (pairLines.length === 4) {
      flushGroup();
    }
  }

  flushGroup();

  if (questions.length !== 20) {
    throw new Error(`Section 4.6 expected 20 questions, got ${questions.length}`);
  }

  return questions;
};

const buildSection4Questions = (aptitudeLines, answerKeyLines) => {
  const normalizeTimeValues = (value = "") =>
    String(value).replace(
      /\b(\d{1,2})\s+(\d{2})\s*(AM|PM)\b/gi,
      (_match, hours, minutes, meridiem) =>
        `${hours}:${minutes} ${String(meridiem).toUpperCase()}`
    );
  const normalizeQuestionTimes = (question = {}) => ({
    ...question,
    text: normalizeTimeValues(question.text || ""),
    options: Array.isArray(question.options)
      ? question.options.map((option) => normalizeTimeValues(option))
      : [],
  });

  const spatialRelationsOverrides = LIVE_SPATIAL_RELATIONS_OVERRIDES;

  if (spatialRelationsOverrides.length !== 25) {
    throw new Error(
      `Spatial Relations overrides expected 25 core live questions, got ${spatialRelationsOverrides.length}`
    );
  }
  const numericalAbilityOverrides = [
    {
      text: "If 3x + 7 = 22, then x equals:",
    },
    null,
    null,
    null,
    {
      text:
        "The ratio of boys to girls in a class is 3:4. If there are 28 students total, how many are boys?",
    },
    null,
    null,
    null,
    {
      text: "If 4y - 3 = 2y + 11, then y equals:",
    },
    null,
    {
      text: "What is (3/4) × (2/5)?",
    },
    null,
    null,
    {
      text: "If 5x + 3 = 3x + 15, then x equals:",
    },
    {
      text: "A circle has radius 5. What is its area? (Use π = 3.14)",
    },
    null,
    null,
    null,
    null,
    {
      text: "What is (2/3) + (1/4)?",
    },
    {
      text: "If 6x - 4 = 2x + 12, then x equals:",
    },
    null,
    null,
    {
      text: "If 7y + 2 = 5y + 18, then y equals:",
    },
    null,
  ];
  const mechanicalReasoningOverrides = [
    {
      text:
        "If the weight of each pulley is equal to the load, what is the ratio between the pulling force F and the load L? (F / L = ?)",
      options: ["1/4", "1/8", "1"],
      correctOption: "C",
    },
    {
      text: "How many revolutions does the wheel M make when K completes 4 revolutions?",
      options: ["1", "2", "4"],
      correctOption: "A",
    },
    {
      text: "Which statement is WRONG about springs?",
      options: [
        "Springs are a kind of simple machines",
        "Springs can be used as energy stores",
        "Springs constant depends on the properties of material they are made of",
      ],
      correctOption: "A",
    },
    {
      text:
        "How many inches must one pull the rope down in order to lift the load in the figure by 28 inches?",
      options: ["14 in", "28 in", "56 in"],
      correctOption: "C",
    },
    {
      text:
        "Electrons in a circuit flow from a place where there are __?__ electrons to a place where there are __?__ electrons.",
      options: ["Less, More", "Many, No", "More, Less"],
      correctOption: "C",
    },
    {
      text: "We use __?__ to measure a specific gas pressure.",
      options: ["Barometer", "Thermometer", "Manometer"],
      correctOption: "C",
    },
    {
      text: "Which term is NOT related to gears?",
      options: ["Cogwheel", "Pinion", "Rack"],
      correctOption: "C",
    },
    {
      text: "A screw is a combination of:",
      options: [
        "Nail and wedge",
        "Inclined plane and wedge",
        "Inclined plane and cylinder",
      ],
      correctOption: "C",
    },
    {
      text: "Which of the following materials can become a magnet?",
      options: ["Aluminum", "Copper", "Zinc"],
      correctOption: "C",
    },
    {
      text:
        "If the big wheel (A) turns 3 times at clockwise direction, how many times and in which direction does the small one (B) turn?",
      options: [
        "3 times counter-clockwise",
        "6 times counter-clockwise",
        "6 times clockwise",
      ],
      correctOption: "C",
    },
    {
      text: "What value does the ammeter in the circuit shown in the figure read?",
      options: ["0.25 A", "0 A", "4 A"],
      correctOption: "B",
    },
    {
      text:
        "If gear A rotates in the clockwise direction, what will the direction of wheels B, C and D be?",
      options: [
        "B clockwise, C clockwise, D counter-clockwise",
        "B counter-clockwise, C clockwise, D clockwise",
        "B counter-clockwise, C counter-clockwise, D counter-clockwise",
      ],
      correctOption: "B",
    },
    {
      text: "Which of the following does NOT use magnetism to operate?",
      options: ["Compass", "NMR apparatus", "Vehicle"],
      correctOption: "C",
    },
    {
      text: "Belts usually are made from materials that __?__ friction.",
      options: ["Increase", "Reduce", "Don't change"],
      correctOption: "A",
    },
    {
      text: "What kind of lever is the hydraulic crane shown in the figure?",
      options: ["First class lever", "Second class lever", "Third class lever"],
      correctOption: "C",
    },
    {
      text:
        "What would happen to the distance Earth-Sun if one year became 400 days without any change in the gravitational force?",
      options: [
        "Distance would increase",
        "Distance would decrease",
        "Distance would remain the same",
      ],
      correctOption: "B",
    },
    {
      text: "Centripetal force is proportional to\u2026",
      options: [
        "Radius of curvature",
        "Mass of the rotating object",
        "Speed of rotation",
      ],
      correctOption: "A",
    },
    {
      text: "Which statement is CORRECT?",
      options: [
        "Linear motion is a special case of circular motion",
        "Circular motion is a special case of linear motion",
        "When linear motion stops, circular motion begins",
      ],
      correctOption: "B",
    },
    {
      text: "Which statement below is WRONG about springs?",
      options: [
        "Springs are simple machines as they make the object move",
        "The extension or compression of springs always occur in the direction of the applied force",
        "To increase the elasticity of a system of springs, we must combine them in series",
      ],
      correctOption: "A",
    },
    {
      text:
        "Why can we not use the equation P = rho * g * h for calculating the air pressure at a height h taking as a reference level the upper part of the atmosphere?",
      options: [
        "Because the atmosphere is very thick",
        "Because the density of the atmosphere is not uniform",
        "Because the atmosphere is not a fluid",
      ],
      correctOption: "B",
    },
  ];

  const mcqConfigs = [
    {
      startQuestionId: 291,
      startPattern: /4\.1 VERBAL REASONING/i,
      endPattern: /4\.2 NUMERICAL ABILITY/i,
      answerStart: /4\.1 Verbal Reasoning/i,
      answerEnd: /4\.2 Numerical Ability/i,
      expectedCount: 25,
      weight: 1,
      fallbackToCompletion: false,
    },
    {
      startQuestionId: 316,
      startPattern: /4\.2 NUMERICAL ABILITY/i,
      endPattern: /4\.3 ABSTRACT REASONING/i,
      answerStart: /4\.2 Numerical Ability/i,
      answerEnd: /4\.3 Abstract Reasoning/i,
      expectedCount: 25,
      weight: 1,
      fallbackToCompletion: false,
    },
    {
      startQuestionId: 341,
      startPattern: /4\.3 ABSTRACT REASONING/i,
      endPattern: /4\.4 SPATIAL RELATIONS/i,
      answerStart: /4\.3 Abstract Reasoning/i,
      answerEnd: /4\.4 Spatial Relations/i,
      expectedCount: 25,
      weight: 1,
      fallbackToCompletion: false,
    },
    {
      startQuestionId: 366,
      startPattern: /4\.4 SPATIAL RELATIONS/i,
      endPattern: /4\.5 MECHANICAL REASONING/i,
      answerStart: null,
      answerEnd: null,
      expectedCount: 25,
      weight: 0.1,
      fallbackToCompletion: true,
    },
    {
      startQuestionId: 391,
      startPattern: /4\.5 MECHANICAL REASONING/i,
      endPattern: /4\.6 CLERICAL SPEED/i,
      answerStart: /4\.5 Mechanical Reasoning/i,
      answerEnd: /4\.6 Clerical Speed/i,
      expectedCount: 20,
      weight: 1,
      fallbackToCompletion: false,
    },
    {
      startQuestionId: 431,
      startPattern: /4\.7 CRITICAL THINKING/i,
      endPattern: /4\.8 PROBLEM SOLVING/i,
      answerStart: /4\.7 Critical Thinking/i,
      answerEnd: /4\.8 Problem Solving/i,
      expectedCount: 10,
      weight: 1,
      fallbackToCompletion: false,
    },
    {
      startQuestionId: 441,
      startPattern: /4\.8 PROBLEM SOLVING/i,
      endPattern: /SECTION 5/i,
      answerStart: /4\.8 Problem Solving/i,
      answerEnd: /SECTION 5/i,
      expectedCount: 10,
      weight: 1,
      fallbackToCompletion: false,
    },
  ];

  const questions = [];

  for (const config of mcqConfigs) {
    const parsedQuestions = parseMcqSection(
      getSectionSlice(aptitudeLines, config.startPattern, config.endPattern)
    );

    if (parsedQuestions.length !== config.expectedCount) {
      throw new Error(
        `Section ${config.startQuestionId} expected ${config.expectedCount} questions, got ${parsedQuestions.length}`
      );
    }

    const answerLetters =
      config.answerStart && config.answerEnd
        ? parseAnswerLetters(answerKeyLines, config.answerStart, config.answerEnd)
        : [];

    parsedQuestions.forEach((question, index) => {
      const numericalOverride =
        config.startQuestionId === 316 ? numericalAbilityOverrides[index] : null;
      const spatialOverride =
        config.startQuestionId === 366 ? spatialRelationsOverrides[index] : null;
      const mechanicalOverride =
        config.startQuestionId === 391 ? mechanicalReasoningOverrides[index] : null;

      const override = numericalOverride || spatialOverride || mechanicalOverride;
      const resolvedText = override?.text || question.text;
      const resolvedOptions = override?.options || question.options;

      questions.push(
        createSingleQuestion(
          config.startQuestionId + index,
          normalizeTimeValues(resolvedText),
          resolvedOptions.map((option) => normalizeTimeValues(option)),
          override?.correctOption || answerLetters[index] || "",
          config.weight
        )
      );
    });
  }

  const clericalQuestions = parseClericalQuestions(
    getSectionSlice(aptitudeLines, /4\.6 CLERICAL SPEED/i, /4\.7 CRITICAL THINKING/i),
    411
  ).map(normalizeQuestionTimes);

  questions.splice(100, 0, ...clericalQuestions);

  if (questions.length !== 160) {
    throw new Error(`Section 4 expected 160 questions, got ${questions.length}`);
  }

  return questions;
};

const buildPackage = async () => {
  if (!fs.existsSync(APTITUDE_PDF_PATH)) {
    throw new Error(`Missing aptitude PDF: ${APTITUDE_PDF_PATH}`);
  }
  if (!fs.existsSync(ANSWER_KEY_PDF_PATH)) {
    throw new Error(`Missing answer-key PDF: ${ANSWER_KEY_PDF_PATH}`);
  }
  if (!fs.existsSync(ASSESSMENT_SEED_PATH)) {
    throw new Error(`Missing assessment seed: ${ASSESSMENT_SEED_PATH}`);
  }

  const aptitudeLines = await loadPdfLines(APTITUDE_PDF_PATH);
  const answerKeyLines = await loadPdfLines(ANSWER_KEY_PDF_PATH);
  const seedPayload = JSON.parse(fs.readFileSync(ASSESSMENT_SEED_PATH, "utf-8"));

  return {
    ...PACKAGE_META,
    sections: [
      getSeedSection(seedPayload.sections, 1),
      getSeedSection(seedPayload.sections, 2),
      {
        sectionId: 3,
        title: "Interest Assessment",
        durationMinutes: SECTION_3_DURATION,
        enabled: true,
        scoringType: "mixed",
        sheetCsvUrl: "",
        questions: parseSection3Questions(aptitudeLines),
      },
      {
        sectionId: 4,
        title: "Aptitude Battery",
        durationMinutes: SECTION_4_DURATION,
        enabled: true,
        scoringType: "objective",
        sheetCsvUrl: "",
        questions: buildSection4Questions(aptitudeLines, answerKeyLines),
      },
      getSeedSection(seedPayload.sections, 5),
    ],
  };
};

const writePackageModule = async () => {
  const pkg = await buildPackage();
  const fileContent = `const COMPREHENSIVE_500_PACKAGE = ${JSON.stringify(
    pkg,
    null,
    2
  )};\n\nexport default COMPREHENSIVE_500_PACKAGE;\n`;

  fs.writeFileSync(OUTPUT_PATH, fileContent, "utf-8");

  const sectionSummary = pkg.sections
    .map((section) => `${section.sectionId}:${section.questions.length}`)
    .join(", ");

  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`Package ${pkg.id} -> ${sectionSummary}`);
};

writePackageModule().catch((error) => {
  console.error(error);
  process.exit(1);
});
