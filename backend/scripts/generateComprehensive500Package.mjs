import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import { applyPersonalityMetadataToQuestions } from "../utils/personalityQuestionMetadata.js";

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
      questions.push(
        createSingleQuestion(
          config.startQuestionId + index,
          question.text,
          question.options,
          answerLetters[index] || "",
          config.weight
        )
      );
    });
  }

  const clericalQuestions = parseClericalQuestions(
    getSectionSlice(aptitudeLines, /4\.6 CLERICAL SPEED/i, /4\.7 CRITICAL THINKING/i),
    411
  );

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
