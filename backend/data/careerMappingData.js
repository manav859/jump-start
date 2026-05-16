// Career-aptitude mapping source-of-truth.
//
// Transcribed from career_aptitude_mapping.html (repo root). The HTML title
// reads "121 Careers" but the underlying data array contains 125 entries
// across 12 categories — every entry from that source is preserved here.
//
// Field conventions match the careerMatcher contract:
//   hollandCodes:      ordered ["primary", "secondary", ...]  (R/I/A/S/E/C)
//   intelligenceTypes: array of Gardner intelligence display names
//                      ("Logical-Math", "Linguistic", "Spatial", "Musical",
//                       "Bodily-Kinesthetic", "Interpersonal",
//                       "Intrapersonal", "Naturalistic")
//   aptitudeStrengths: array of aptitude-battery display names
//                      ("Verbal", "Numerical", "Abstract", "Spatial Relations",
//                       "Mechanical", "Clerical", "Critical Thinking",
//                       "Problem Solving")
//   eqCompetencies:    array of EQ display names
//                      ("Empathy", "Motivation", "Self-Regulation",
//                       "Social Skills", "Self-Awareness")

export const CAREER_CATEGORIES = [
  "Science & Research",
  "Technology & Engineering",
  "Healthcare & Medicine",
  "Creative & Arts",
  "Writing & Communication",
  "Education & Social Services",
  "Business & Entrepreneurship",
  "Law, Policy & Public Service",
  "Finance & Accounting",
  "Nature & Environment",
  "Skilled Trades & Applied Work",
  "Sports, Fitness & Performing Arts",
];

export const HOLLAND_CODES = ["R", "I", "A", "S", "E", "C"];

export const INTELLIGENCE_TYPES = [
  "Logical-Math",
  "Linguistic",
  "Spatial",
  "Musical",
  "Bodily-Kinesthetic",
  "Interpersonal",
  "Intrapersonal",
  "Naturalistic",
];

export const APTITUDE_SECTIONS = [
  "Verbal",
  "Numerical",
  "Abstract",
  "Spatial Relations",
  "Mechanical",
  "Clerical",
  "Critical Thinking",
  "Problem Solving",
];

export const EQ_COMPETENCIES = [
  "Empathy",
  "Motivation",
  "Self-Regulation",
  "Social Skills",
  "Self-Awareness",
];

export const CAREER_MAPPINGS = [
  // -- Science & Research --
  { title: "Research Scientist", category: "Science & Research", hollandCodes: ["I"], intelligenceTypes: ["Logical-Math", "Naturalistic"], aptitudeStrengths: ["Numerical", "Abstract", "Critical Thinking"], eqCompetencies: ["Motivation", "Self-Awareness"] },
  { title: "Physicist / Chemist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Mechanical", "Abstract"], eqCompetencies: ["Self-Regulation"] },
  { title: "Biologist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math", "Naturalistic"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Mathematician / Statistician", category: "Science & Research", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Abstract", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },
  { title: "Data Scientist / Analyst", category: "Science & Research", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Abstract", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Environmental Scientist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Empathy"] },
  { title: "Astronomer", category: "Science & Research", hollandCodes: ["I"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Abstract", "Spatial Relations"], eqCompetencies: ["Motivation"] },
  { title: "Forensic Scientist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Pharmacologist", category: "Science & Research", hollandCodes: ["I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Geologist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Spatial"], aptitudeStrengths: ["Spatial Relations", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Marine Biologist", category: "Science & Research", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Empathy"] },

  // -- Technology & Engineering --
  { title: "Software Developer / Engineer", category: "Technology & Engineering", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Abstract", "Numerical", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },
  { title: "Computer Scientist", category: "Technology & Engineering", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Abstract", "Numerical", "Problem Solving"], eqCompetencies: ["Motivation"] },
  { title: "Cybersecurity Analyst", category: "Technology & Engineering", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Abstract", "Critical Thinking", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "AI / ML Engineer", category: "Technology & Engineering", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Abstract", "Problem Solving"], eqCompetencies: ["Motivation"] },
  { title: "Civil Engineer", category: "Technology & Engineering", hollandCodes: ["R", "I"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Mechanical", "Spatial Relations"], eqCompetencies: ["Self-Regulation"] },
  { title: "Mechanical Engineer", category: "Technology & Engineering", hollandCodes: ["R", "I"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Mechanical", "Spatial Relations"], eqCompetencies: ["Self-Regulation"] },
  { title: "Electrical Engineer", category: "Technology & Engineering", hollandCodes: ["R", "I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Mechanical", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Robotics Engineer", category: "Technology & Engineering", hollandCodes: ["R", "I"], intelligenceTypes: ["Logical-Math", "Bodily-Kinesthetic"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Problem Solving"], eqCompetencies: ["Motivation"] },
  { title: "Aerospace Engineer", category: "Technology & Engineering", hollandCodes: ["R", "I"], intelligenceTypes: ["Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Mechanical", "Spatial Relations"], eqCompetencies: ["Self-Regulation"] },
  { title: "Architect", category: "Technology & Engineering", hollandCodes: ["A", "I", "R"], intelligenceTypes: ["Spatial", "Logical-Math"], aptitudeStrengths: ["Spatial Relations", "Numerical", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "UX / UI Designer", category: "Technology & Engineering", hollandCodes: ["A", "I"], intelligenceTypes: ["Spatial", "Interpersonal"], aptitudeStrengths: ["Abstract", "Spatial Relations"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Network Administrator", category: "Technology & Engineering", hollandCodes: ["R", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Abstract", "Clerical", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },

  // -- Healthcare & Medicine --
  { title: "Medical Doctor", category: "Healthcare & Medicine", hollandCodes: ["I", "S"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal"], eqCompetencies: ["Empathy", "Self-Regulation"] },
  { title: "Surgeon", category: "Healthcare & Medicine", hollandCodes: ["I", "R"], intelligenceTypes: ["Logical-Math", "Bodily-Kinesthetic", "Spatial"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Nurse", category: "Healthcare & Medicine", hollandCodes: ["S", "R"], intelligenceTypes: ["Interpersonal", "Bodily-Kinesthetic"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Clerical"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Pharmacist", category: "Healthcare & Medicine", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Psychologist / Psychiatrist", category: "Healthcare & Medicine", hollandCodes: ["S", "I"], intelligenceTypes: ["Interpersonal", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Self-Awareness"] },
  { title: "Occupational Therapist", category: "Healthcare & Medicine", hollandCodes: ["S", "R"], intelligenceTypes: ["Interpersonal", "Bodily-Kinesthetic"], aptitudeStrengths: ["Problem Solving", "Verbal"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Physical Therapist", category: "Healthcare & Medicine", hollandCodes: ["S", "R"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Mechanical", "Problem Solving"], eqCompetencies: ["Empathy"] },
  { title: "Speech-Language Pathologist", category: "Healthcare & Medicine", hollandCodes: ["S", "I"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Dentist", category: "Healthcare & Medicine", hollandCodes: ["R", "I", "S"], intelligenceTypes: ["Logical-Math", "Bodily-Kinesthetic", "Spatial"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Veterinarian", category: "Healthcare & Medicine", hollandCodes: ["I", "R", "S"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Empathy"] },
  { title: "Public Health Officer", category: "Healthcare & Medicine", hollandCodes: ["S", "I"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Medical Researcher", category: "Healthcare & Medicine", hollandCodes: ["I"], intelligenceTypes: ["Logical-Math", "Naturalistic"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Abstract"], eqCompetencies: ["Motivation"] },

  // -- Creative & Arts --
  { title: "Graphic Designer", category: "Creative & Arts", hollandCodes: ["A"], intelligenceTypes: ["Spatial"], aptitudeStrengths: ["Abstract", "Spatial Relations"], eqCompetencies: ["Self-Awareness"] },
  { title: "Animator / 3D Artist", category: "Creative & Arts", hollandCodes: ["A", "R"], intelligenceTypes: ["Spatial", "Bodily-Kinesthetic"], aptitudeStrengths: ["Spatial Relations", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Filmmaker / Director", category: "Creative & Arts", hollandCodes: ["A", "E"], intelligenceTypes: ["Spatial", "Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Photographer", category: "Creative & Arts", hollandCodes: ["A", "R"], intelligenceTypes: ["Spatial"], aptitudeStrengths: ["Spatial Relations", "Abstract"], eqCompetencies: ["Self-Awareness"] },
  { title: "Interior Designer", category: "Creative & Arts", hollandCodes: ["A", "R"], intelligenceTypes: ["Spatial"], aptitudeStrengths: ["Spatial Relations", "Abstract"], eqCompetencies: ["Empathy"] },
  { title: "Fashion Designer", category: "Creative & Arts", hollandCodes: ["A", "E"], intelligenceTypes: ["Spatial", "Bodily-Kinesthetic"], aptitudeStrengths: ["Abstract", "Spatial Relations"], eqCompetencies: ["Self-Awareness"] },
  { title: "Illustrator", category: "Creative & Arts", hollandCodes: ["A"], intelligenceTypes: ["Spatial"], aptitudeStrengths: ["Abstract", "Spatial Relations"], eqCompetencies: ["Motivation"] },
  { title: "Musician / Composer", category: "Creative & Arts", hollandCodes: ["A"], intelligenceTypes: ["Musical", "Intrapersonal"], aptitudeStrengths: ["Abstract"], eqCompetencies: ["Self-Awareness", "Motivation"] },
  { title: "Actor / Performer", category: "Creative & Arts", hollandCodes: ["A", "S"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal", "Linguistic"], aptitudeStrengths: ["Verbal"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Art Director", category: "Creative & Arts", hollandCodes: ["A", "E"], intelligenceTypes: ["Spatial", "Interpersonal"], aptitudeStrengths: ["Abstract", "Verbal"], eqCompetencies: ["Social Skills"] },
  { title: "Game Designer", category: "Creative & Arts", hollandCodes: ["A", "I", "R"], intelligenceTypes: ["Spatial", "Logical-Math"], aptitudeStrengths: ["Abstract", "Problem Solving"], eqCompetencies: ["Motivation"] },
  { title: "Music Therapist", category: "Creative & Arts", hollandCodes: ["A", "S"], intelligenceTypes: ["Musical", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy"] },
  { title: "Sound Engineer", category: "Creative & Arts", hollandCodes: ["A", "R"], intelligenceTypes: ["Musical", "Logical-Math"], aptitudeStrengths: ["Mechanical", "Abstract"], eqCompetencies: ["Self-Regulation"] },

  // -- Writing & Communication --
  { title: "Journalist / Reporter", category: "Writing & Communication", hollandCodes: ["A", "S", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Author / Novelist", category: "Writing & Communication", hollandCodes: ["A"], intelligenceTypes: ["Linguistic", "Intrapersonal"], aptitudeStrengths: ["Verbal"], eqCompetencies: ["Self-Awareness"] },
  { title: "Editor / Publisher", category: "Writing & Communication", hollandCodes: ["A", "C"], intelligenceTypes: ["Linguistic"], aptitudeStrengths: ["Verbal", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Copywriter / Content Creator", category: "Writing & Communication", hollandCodes: ["A", "E"], intelligenceTypes: ["Linguistic"], aptitudeStrengths: ["Verbal", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Translator / Interpreter", category: "Writing & Communication", hollandCodes: ["A", "C"], intelligenceTypes: ["Linguistic"], aptitudeStrengths: ["Verbal", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Technical Writer", category: "Writing & Communication", hollandCodes: ["A", "I", "C"], intelligenceTypes: ["Linguistic", "Logical-Math"], aptitudeStrengths: ["Verbal", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Public Relations Specialist", category: "Writing & Communication", hollandCodes: ["E", "A"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal"], eqCompetencies: ["Social Skills"] },
  { title: "Broadcaster / News Anchor", category: "Writing & Communication", hollandCodes: ["A", "S", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal"], eqCompetencies: ["Social Skills", "Self-Regulation"] },
  { title: "Social Media Manager", category: "Writing & Communication", hollandCodes: ["A", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Abstract"], eqCompetencies: ["Social Skills"] },
  { title: "Speech Writer", category: "Writing & Communication", hollandCodes: ["A", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy"] },

  // -- Education & Social Services --
  { title: "Teacher / Professor", category: "Education & Social Services", hollandCodes: ["S"], intelligenceTypes: ["Interpersonal", "Linguistic"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "School Counselor", category: "Education & Social Services", hollandCodes: ["S"], intelligenceTypes: ["Interpersonal", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Self-Awareness"] },
  { title: "Special Education Teacher", category: "Education & Social Services", hollandCodes: ["S"], intelligenceTypes: ["Interpersonal", "Bodily-Kinesthetic"], aptitudeStrengths: ["Verbal", "Problem Solving"], eqCompetencies: ["Empathy", "Self-Regulation"] },
  { title: "Social Worker", category: "Education & Social Services", hollandCodes: ["S", "E"], intelligenceTypes: ["Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Community Organizer", category: "Education & Social Services", hollandCodes: ["S", "E"], intelligenceTypes: ["Interpersonal"], aptitudeStrengths: ["Verbal", "Problem Solving"], eqCompetencies: ["Social Skills", "Motivation"] },
  { title: "Career Counselor", category: "Education & Social Services", hollandCodes: ["S", "E"], intelligenceTypes: ["Interpersonal", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Self-Awareness"] },
  { title: "Child Development Specialist", category: "Education & Social Services", hollandCodes: ["S", "I"], intelligenceTypes: ["Interpersonal", "Naturalistic"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy"] },
  { title: "Educational Psychologist", category: "Education & Social Services", hollandCodes: ["S", "I"], intelligenceTypes: ["Interpersonal", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal"], eqCompetencies: ["Empathy", "Self-Awareness"] },
  { title: "Librarian", category: "Education & Social Services", hollandCodes: ["S", "C"], intelligenceTypes: ["Linguistic", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "NGO / Non-profit Worker", category: "Education & Social Services", hollandCodes: ["S", "E"], intelligenceTypes: ["Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking", "Problem Solving"], eqCompetencies: ["Empathy", "Social Skills"] },

  // -- Business & Entrepreneurship --
  { title: "Entrepreneur / Business Owner", category: "Business & Entrepreneurship", hollandCodes: ["E"], intelligenceTypes: ["Interpersonal", "Intrapersonal"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Problem Solving", "Verbal"], eqCompetencies: ["Motivation", "Social Skills"] },
  { title: "Marketing Manager", category: "Business & Entrepreneurship", hollandCodes: ["E", "A"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Numerical", "Critical Thinking"], eqCompetencies: ["Social Skills", "Empathy"] },
  { title: "Sales Manager", category: "Business & Entrepreneurship", hollandCodes: ["E"], intelligenceTypes: ["Interpersonal", "Linguistic"], aptitudeStrengths: ["Verbal", "Numerical"], eqCompetencies: ["Social Skills", "Motivation"] },
  { title: "Business Analyst", category: "Business & Entrepreneurship", hollandCodes: ["I", "E", "C"], intelligenceTypes: ["Logical-Math", "Linguistic"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal"], eqCompetencies: ["Self-Regulation"] },
  { title: "Management Consultant", category: "Business & Entrepreneurship", hollandCodes: ["E", "I"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal", "Problem Solving"], eqCompetencies: ["Social Skills", "Motivation"] },
  { title: "Product Manager", category: "Business & Entrepreneurship", hollandCodes: ["E", "I"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Problem Solving", "Critical Thinking", "Verbal"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Human Resources Manager", category: "Business & Entrepreneurship", hollandCodes: ["S", "E", "C"], intelligenceTypes: ["Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking", "Clerical"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Operations Manager", category: "Business & Entrepreneurship", hollandCodes: ["E", "C"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Numerical", "Problem Solving", "Clerical"], eqCompetencies: ["Social Skills", "Self-Regulation"] },
  { title: "Supply Chain Manager", category: "Business & Entrepreneurship", hollandCodes: ["E", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Problem Solving", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Real Estate Agent", category: "Business & Entrepreneurship", hollandCodes: ["E", "S"], intelligenceTypes: ["Interpersonal"], aptitudeStrengths: ["Numerical", "Verbal"], eqCompetencies: ["Social Skills"] },
  { title: "Investment Banker", category: "Business & Entrepreneurship", hollandCodes: ["E", "C", "I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Motivation", "Self-Regulation"] },
  { title: "Brand Strategist", category: "Business & Entrepreneurship", hollandCodes: ["A", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking", "Abstract"], eqCompetencies: ["Empathy", "Social Skills"] },

  // -- Law, Policy & Public Service --
  { title: "Lawyer / Advocate", category: "Law, Policy & Public Service", hollandCodes: ["E", "I"], intelligenceTypes: ["Linguistic", "Logical-Math"], aptitudeStrengths: ["Verbal", "Critical Thinking", "Problem Solving"], eqCompetencies: ["Social Skills", "Self-Regulation"] },
  { title: "Judge", category: "Law, Policy & Public Service", hollandCodes: ["E", "I", "C"], intelligenceTypes: ["Linguistic", "Logical-Math", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Self-Regulation", "Self-Awareness"] },
  { title: "Politician / Legislator", category: "Law, Policy & Public Service", hollandCodes: ["E", "S"], intelligenceTypes: ["Interpersonal", "Linguistic"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Social Skills", "Empathy"] },
  { title: "Policy Analyst", category: "Law, Policy & Public Service", hollandCodes: ["I", "E"], intelligenceTypes: ["Logical-Math", "Linguistic"], aptitudeStrengths: ["Numerical", "Verbal", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Diplomat", category: "Law, Policy & Public Service", hollandCodes: ["S", "E"], intelligenceTypes: ["Linguistic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Law Enforcement Officer", category: "Law, Policy & Public Service", hollandCodes: ["R", "S", "E"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking", "Problem Solving"], eqCompetencies: ["Self-Regulation", "Empathy"] },
  { title: "Urban Planner", category: "Law, Policy & Public Service", hollandCodes: ["I", "A", "S"], intelligenceTypes: ["Spatial", "Logical-Math"], aptitudeStrengths: ["Numerical", "Spatial Relations", "Critical Thinking"], eqCompetencies: ["Empathy"] },
  { title: "Government Administrator", category: "Law, Policy & Public Service", hollandCodes: ["E", "C"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Verbal", "Numerical", "Clerical"], eqCompetencies: ["Social Skills", "Self-Regulation"] },
  { title: "Human Rights Activist", category: "Law, Policy & Public Service", hollandCodes: ["S", "E"], intelligenceTypes: ["Interpersonal", "Linguistic"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Motivation"] },
  { title: "Military Officer", category: "Law, Policy & Public Service", hollandCodes: ["R", "E"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Problem Solving", "Critical Thinking", "Numerical"], eqCompetencies: ["Self-Regulation", "Social Skills"] },

  // -- Finance & Accounting --
  { title: "Chartered Accountant / CPA", category: "Finance & Accounting", hollandCodes: ["C", "I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Financial Analyst", category: "Finance & Accounting", hollandCodes: ["C", "I", "E"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Actuary", category: "Finance & Accounting", hollandCodes: ["C", "I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Abstract", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },
  { title: "Auditor", category: "Finance & Accounting", hollandCodes: ["C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Investment Analyst", category: "Finance & Accounting", hollandCodes: ["C", "I", "E"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Tax Consultant", category: "Finance & Accounting", hollandCodes: ["C", "I"], intelligenceTypes: ["Logical-Math", "Linguistic"], aptitudeStrengths: ["Numerical", "Verbal", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Insurance Underwriter", category: "Finance & Accounting", hollandCodes: ["C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Clerical", "Critical Thinking"], eqCompetencies: ["Self-Regulation"] },
  { title: "Banking Professional", category: "Finance & Accounting", hollandCodes: ["C", "E"], intelligenceTypes: ["Logical-Math", "Interpersonal"], aptitudeStrengths: ["Numerical", "Verbal", "Clerical"], eqCompetencies: ["Social Skills"] },
  { title: "Economist", category: "Finance & Accounting", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Risk Manager", category: "Finance & Accounting", hollandCodes: ["C", "I"], intelligenceTypes: ["Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },

  // -- Nature & Environment --
  { title: "Environmental Consultant", category: "Nature & Environment", hollandCodes: ["I", "R", "S"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Verbal"], eqCompetencies: ["Empathy"] },
  { title: "Wildlife Biologist", category: "Nature & Environment", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Botanist", category: "Nature & Environment", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Ecologist", category: "Nature & Environment", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Problem Solving"], eqCompetencies: ["Motivation"] },
  { title: "Agricultural Scientist", category: "Nature & Environment", hollandCodes: ["R", "I"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Mechanical"], eqCompetencies: ["Motivation"] },
  { title: "Park Ranger / Forest Officer", category: "Nature & Environment", hollandCodes: ["R", "S"], intelligenceTypes: ["Naturalistic", "Bodily-Kinesthetic"], aptitudeStrengths: ["Problem Solving"], eqCompetencies: ["Empathy"] },
  { title: "Oceanographer", category: "Nature & Environment", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math", "Spatial"], aptitudeStrengths: ["Numerical", "Spatial Relations", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Landscape Architect", category: "Nature & Environment", hollandCodes: ["A", "R", "I"], intelligenceTypes: ["Spatial", "Naturalistic"], aptitudeStrengths: ["Spatial Relations", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Climate Scientist", category: "Nature & Environment", hollandCodes: ["I", "R"], intelligenceTypes: ["Naturalistic", "Logical-Math"], aptitudeStrengths: ["Numerical", "Abstract", "Critical Thinking"], eqCompetencies: ["Motivation"] },
  { title: "Conservation Officer", category: "Nature & Environment", hollandCodes: ["R", "S"], intelligenceTypes: ["Naturalistic", "Interpersonal"], aptitudeStrengths: ["Problem Solving", "Verbal"], eqCompetencies: ["Empathy"] },

  // -- Skilled Trades & Applied Work --
  { title: "Electrician / Plumber", category: "Skilled Trades & Applied Work", hollandCodes: ["R"], intelligenceTypes: ["Bodily-Kinesthetic", "Logical-Math"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Problem Solving"], eqCompetencies: ["Self-Regulation"] },
  { title: "Automotive Technician", category: "Skilled Trades & Applied Work", hollandCodes: ["R"], intelligenceTypes: ["Bodily-Kinesthetic", "Logical-Math"], aptitudeStrengths: ["Mechanical", "Spatial Relations"], eqCompetencies: ["Self-Regulation"] },
  { title: "Construction Manager", category: "Skilled Trades & Applied Work", hollandCodes: ["R", "E"], intelligenceTypes: ["Spatial", "Interpersonal"], aptitudeStrengths: ["Mechanical", "Numerical", "Problem Solving"], eqCompetencies: ["Social Skills"] },
  { title: "Pilot / Aviation Technician", category: "Skilled Trades & Applied Work", hollandCodes: ["R", "I"], intelligenceTypes: ["Spatial", "Logical-Math", "Bodily-Kinesthetic"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Numerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Industrial Designer", category: "Skilled Trades & Applied Work", hollandCodes: ["R", "A", "I"], intelligenceTypes: ["Spatial", "Bodily-Kinesthetic"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Abstract"], eqCompetencies: ["Motivation"] },
  { title: "Dental Technician", category: "Skilled Trades & Applied Work", hollandCodes: ["R", "C"], intelligenceTypes: ["Bodily-Kinesthetic", "Spatial"], aptitudeStrengths: ["Mechanical", "Spatial Relations", "Clerical"], eqCompetencies: ["Self-Regulation"] },
  { title: "Chef / Culinary Artist", category: "Skilled Trades & Applied Work", hollandCodes: ["A", "R"], intelligenceTypes: ["Bodily-Kinesthetic", "Spatial"], aptitudeStrengths: ["Problem Solving"], eqCompetencies: ["Social Skills"] },
  { title: "Carpenter / Craftsperson", category: "Skilled Trades & Applied Work", hollandCodes: ["R"], intelligenceTypes: ["Bodily-Kinesthetic", "Spatial"], aptitudeStrengths: ["Mechanical", "Spatial Relations"], eqCompetencies: ["Motivation"] },

  // -- Sports, Fitness & Performing Arts --
  { title: "Professional Athlete / Coach", category: "Sports, Fitness & Performing Arts", hollandCodes: ["R", "S"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Problem Solving"], eqCompetencies: ["Motivation", "Self-Regulation"] },
  { title: "Sports Psychologist", category: "Sports, Fitness & Performing Arts", hollandCodes: ["S", "I"], intelligenceTypes: ["Interpersonal", "Intrapersonal"], aptitudeStrengths: ["Verbal", "Critical Thinking"], eqCompetencies: ["Empathy", "Self-Awareness"] },
  { title: "Dance Instructor / Choreographer", category: "Sports, Fitness & Performing Arts", hollandCodes: ["A", "S"], intelligenceTypes: ["Bodily-Kinesthetic", "Musical", "Interpersonal"], aptitudeStrengths: ["Abstract"], eqCompetencies: ["Empathy", "Social Skills"] },
  { title: "Personal Trainer", category: "Sports, Fitness & Performing Arts", hollandCodes: ["S", "R"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Problem Solving", "Verbal"], eqCompetencies: ["Empathy", "Motivation"] },
  { title: "Sports Analyst", category: "Sports, Fitness & Performing Arts", hollandCodes: ["I", "C"], intelligenceTypes: ["Logical-Math", "Bodily-Kinesthetic"], aptitudeStrengths: ["Numerical", "Critical Thinking", "Abstract"], eqCompetencies: ["Self-Regulation"] },
  { title: "Physiotherapist", category: "Sports, Fitness & Performing Arts", hollandCodes: ["S", "R"], intelligenceTypes: ["Bodily-Kinesthetic", "Interpersonal"], aptitudeStrengths: ["Mechanical", "Problem Solving", "Verbal"], eqCompetencies: ["Empathy"] },
  { title: "Yoga / Wellness Instructor", category: "Sports, Fitness & Performing Arts", hollandCodes: ["S", "A"], intelligenceTypes: ["Bodily-Kinesthetic", "Intrapersonal"], aptitudeStrengths: ["Verbal"], eqCompetencies: ["Empathy", "Self-Awareness"] },
];

export const CAREER_COUNT = CAREER_MAPPINGS.length;

export default CAREER_MAPPINGS;
