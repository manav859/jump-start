/** Likert scale value: 1 = Strongly Disagree .. 5 = Strongly Agree */
export const LIKERT_OPTIONS = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly Agree", value: 5 },
];

/** 4 sections, 30 questions each = 120 total */
export const SECTIONS = [
  { id: 1, title: "Aptitude Assessment", durationMinutes: 22 },
  { id: 2, title: "Interest", durationMinutes: 20 },
  { id: 3, title: "Personality", durationMinutes: 25 },
  { id: 4, title: "Values", durationMinutes: 20 },
];

const QUESTIONS_S1 = [
  "I enjoy working with numbers and solving mathematical problems.",
  "I prefer following step-by-step instructions rather than improvising.",
  "I find it easy to spot patterns and trends in data.",
  "I like breaking down complex problems into smaller parts.",
  "I am comfortable making decisions under time pressure.",
  "I enjoy learning new tools and software quickly.",
  "I prefer logical reasoning over intuitive guesses.",
  "I like to analyze data before making a decision.",
  "I am good at identifying cause and effect relationships.",
  "I enjoy tasks that require precision and accuracy.",
  "I find it satisfying to solve difficult puzzles.",
  "I prefer structured approaches to open-ended ones.",
  "I am comfortable with abstract thinking.",
  "I like to optimize processes for better results.",
  "I enjoy working with spreadsheets and calculations.",
  "I can focus on detailed work for long periods.",
  "I prefer clear rules and criteria when evaluating options.",
  "I like to measure and track progress numerically.",
  "I am good at estimating quantities and outcomes.",
  "I enjoy finding errors and correcting them.",
  "I prefer evidence-based over opinion-based decisions.",
  "I like to break goals into measurable steps.",
  "I am comfortable with statistical concepts.",
  "I enjoy improving systems and workflows.",
  "I like to compare options using clear criteria.",
  "I am good at prioritizing tasks logically.",
  "I enjoy learning how things work technically.",
  "I prefer working with facts over assumptions.",
  "I like to plan ahead with clear milestones.",
  "I am comfortable with quantitative feedback.",
];

const QUESTIONS_S2 = [
  "I would enjoy a job that involves research and analysis.",
  "I prefer creative tasks over repetitive ones.",
  "I like helping others solve their problems.",
  "I am interested in technology and how things work.",
  "I enjoy working in a team more than alone.",
  "I would like a career that allows me to travel.",
  "I am drawn to careers that involve teaching or mentoring.",
  "I enjoy building or designing things.",
  "I like careers that involve writing or communication.",
  "I am interested in health and wellness fields.",
  "I would enjoy working outdoors or with nature.",
  "I like roles that involve organizing and planning.",
  "I am interested in arts or creative expression.",
  "I enjoy roles that involve selling or persuading.",
  "I like careers focused on science or discovery.",
  "I am drawn to roles that help people directly.",
  "I enjoy working with machines or tools.",
  "I like careers that involve managing others.",
  "I am interested in finance or business strategy.",
  "I would enjoy a career in media or entertainment.",
  "I like roles that require continuous learning.",
  "I am drawn to careers with flexible schedules.",
  "I enjoy roles that involve problem-solving daily.",
  "I like careers that offer variety and change.",
  "I am interested in law or policy.",
  "I would enjoy working with children or education.",
  "I like roles that involve innovation.",
  "I am drawn to careers in sports or fitness.",
  "I enjoy roles that involve data or analytics.",
  "I like careers that make a social impact.",
];

const QUESTIONS_S3 = [
  "I recharge my energy by spending time alone.",
  "I often think about future possibilities and ideas.",
  "I make decisions based on logic rather than feelings.",
  "I prefer a planned schedule over spontaneous activities.",
  "I feel comfortable leading a group discussion.",
  "I adapt easily to changing situations.",
  "I am more reserved than outgoing in social settings.",
  "I focus on the big picture rather than small details.",
  "I consider how decisions affect people emotionally.",
  "I like to keep my options open rather than decide early.",
  "I take charge when no one else does.",
  "I prefer routine over unexpected changes.",
  "I enjoy being the center of attention.",
  "I trust my instincts when making choices.",
  "I like to finish one task before starting another.",
  "I am comfortable speaking in front of groups.",
  "I prefer working with ideas over practical tasks.",
  "I weigh pros and cons carefully before deciding.",
  "I like to have a clear plan for the day.",
  "I naturally step into leadership roles.",
  "I stay calm when plans change suddenly.",
  "I gain energy from being around people.",
  "I imagine different futures and scenarios.",
  "I consider fairness and values when deciding.",
  "I prefer flexibility over strict deadlines.",
  "I delegate tasks when working in a team.",
  "I like to know what to expect in advance.",
  "I speak up in meetings and discussions.",
  "I focus on what could be rather than what is.",
  "I think about how others will feel.",
];

const QUESTIONS_S4 = [
  "I value honesty over being polite when giving feedback.",
  "I prefer job security over high risk and reward.",
  "I value work-life balance over career advancement.",
  "I prefer working independently over in a team.",
  "I value creativity and innovation in my work.",
  "I prefer helping others over maximizing my own success.",
  "I value recognition and status in my career.",
  "I prefer stability over variety in my daily work.",
  "I value making a positive impact on society.",
  "I prefer high income over job satisfaction.",
  "I value learning and growth in my role.",
  "I prefer clear hierarchy over flat structure.",
  "I value autonomy and freedom in how I work.",
  "I prefer competition over collaboration.",
  "I value tradition and proven methods.",
  "I prefer flexibility over fixed schedules.",
  "I value expertise and mastery in one area.",
  "I prefer working with people over with data.",
  "I value fairness and equality in the workplace.",
  "I prefer fast-paced over calm environments.",
  "I value loyalty to one company over exploring options.",
  "I prefer tangible results over abstract goals.",
  "I value diversity of perspectives.",
  "I prefer structure and rules over freedom.",
  "I value sustainability and long-term thinking.",
  "I prefer individual contribution over team success.",
  "I value adventure and new experiences.",
  "I prefer predictability over surprise.",
  "I value integrity and ethics in business.",
  "I prefer quality over speed in delivery.",
];

/** 4 sections × 30 questions = 120 total */
export const LIVETEST_QUESTIONS = [QUESTIONS_S1, QUESTIONS_S2, QUESTIONS_S3, QUESTIONS_S4];

export const TOTAL_SECTIONS = 4;
export const QUESTIONS_PER_SECTION = 30;
export const TOTAL_QUESTIONS = TOTAL_SECTIONS * QUESTIONS_PER_SECTION;

export function getQuestionCount() {
  return TOTAL_QUESTIONS;
}

export function getQuestionIndex(sectionId, questionIdxInSection) {
  return (sectionId - 1) * QUESTIONS_PER_SECTION + questionIdxInSection;
}

export function getSectionAndQuestion(globalIndex) {
  const sectionId = Math.min(TOTAL_SECTIONS, Math.floor(globalIndex / QUESTIONS_PER_SECTION) + 1);
  const questionIdxInSection = (globalIndex % QUESTIONS_PER_SECTION);
  return { sectionId, questionIdxInSection };
}

/** Remaining section titles after completing section X (for Section Break screen) */
export function getRemainingSectionsAfter(completedSectionId) {
  return SECTIONS.filter((s) => s.id > completedSectionId).map((s) => s.title);
}
