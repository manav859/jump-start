const DEFAULT_GUIDANCE_POINTS = [
  "30-minute personalized guidance session",
  "Expert support from career psychologists",
  "Personalized action plan for next steps",
];

const DEFAULT_OUTLOOK = {
  marketDemand: 82,
  jobSatisfaction: 80,
  workLifeBalance: 74,
};

const DEFAULT_EDUCATION = [
  "A relevant bachelor's degree builds a strong foundation for this path.",
  "Short certifications and portfolio work improve role-specific readiness.",
  "Internships, projects, and guided practice help convert interest into employability.",
];

const DEFAULT_COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "TCS",
  "Infosys",
  "Accenture",
];

const DEFAULT_SKILLS = [
  "Problem Solving",
  "Communication",
  "Domain Knowledge",
  "Structured Thinking",
];

const CAREER_DETAIL_CONTENT = {
  "data scientist": {
    overview:
      "Data Scientists turn complex datasets into insights that guide business decisions, product strategy, and forecasting. The role blends statistical thinking, machine learning, and clear communication.",
    salaryBands: [
      { label: "Entry Level", range: "INR 6-10 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 10-18 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 18-35 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Collect, clean, and structure large datasets from multiple sources.",
      "Build predictive models and machine learning pipelines.",
      "Create dashboards, visualizations, and reports for stakeholders.",
      "Work with product and engineering teams to solve measurable problems.",
      "Translate technical findings into business recommendations.",
    ],
    education: [
      "Bachelor's degree in Computer Science, Statistics, Mathematics, or a related field.",
      "Master's degree or PG program can help for advanced analytics and ML-heavy roles.",
      "Certifications in Data Science, Machine Learning, SQL, or Python strengthen readiness.",
    ],
    outlook: { marketDemand: 92, jobSatisfaction: 88, workLifeBalance: 75 },
    companies: [
      "Google",
      "Amazon",
      "Microsoft",
      "Flipkart",
      "Swiggy",
      "PhonePe",
      "Razorpay",
      "CRED",
    ],
    extraSkills: ["SQL", "R Programming", "Big Data", "Deep Learning"],
  },
  "software engineer": {
    overview:
      "Software Engineers design, build, test, and improve digital products. The role suits people who enjoy structured problem solving, systems thinking, and translating ideas into reliable software.",
    salaryBands: [
      { label: "Entry Level", range: "INR 5-9 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 10-18 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 18-32 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Develop application features, APIs, and core platform services.",
      "Debug issues and improve software reliability and performance.",
      "Participate in code reviews and technical design discussions.",
      "Write tests and maintain engineering quality standards.",
      "Collaborate with product, design, and operations teams to ship releases.",
    ],
    education: [
      "Bachelor's degree in Computer Science, IT, Electronics, or a related field.",
      "Bootcamps, open-source work, and strong projects can also build employability.",
      "Specialized learning in cloud, backend, frontend, or mobile helps with focus areas.",
    ],
    outlook: { marketDemand: 94, jobSatisfaction: 85, workLifeBalance: 72 },
    companies: ["Google", "Microsoft", "Amazon", "Adobe", "Zoho", "TCS", "Infosys", "Wipro"],
    extraSkills: ["JavaScript", "React", "Node.js", "Cloud"],
  },
  "ux designer": {
    overview:
      "UX Designers create digital experiences that feel intuitive, useful, and clear. They combine user research, interaction design, and visual thinking to improve how products work for people.",
    salaryBands: [
      { label: "Entry Level", range: "INR 4-8 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 8-16 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 16-28 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Conduct user research and translate findings into design decisions.",
      "Build user flows, wireframes, and interactive prototypes.",
      "Collaborate with product and engineering on experience improvements.",
      "Run usability testing and iterate on feedback.",
      "Contribute to design systems and interaction standards.",
    ],
    education: [
      "Degrees in Design, HCI, Psychology, Communication, or Computer Science are useful.",
      "A strong portfolio often matters as much as formal education in hiring decisions.",
      "Courses in UX research, Figma, prototyping, and accessibility help build readiness.",
    ],
    outlook: { marketDemand: 85, jobSatisfaction: 87, workLifeBalance: 79 },
    companies: ["Google", "Adobe", "Paytm", "Myntra", "PhonePe", "Swiggy", "Zomato", "Freshworks"],
    extraSkills: ["Interaction Design", "Accessibility", "Usability Testing", "Information Architecture"],
  },
  "business analyst": {
    overview:
      "Business Analysts bridge data, processes, and stakeholders to improve how teams solve business problems. The role works well for people who enjoy analysis, documentation, and structured communication.",
    salaryBands: [
      { label: "Entry Level", range: "INR 5-8 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 8-15 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 15-26 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Gather and document business requirements from stakeholders.",
      "Analyze workflows, pain points, and operational bottlenecks.",
      "Translate business needs into clear process or product recommendations.",
      "Support project teams with reporting, dashboards, and process tracking.",
      "Coordinate across technical and non-technical teams to keep delivery aligned.",
    ],
    education: [
      "Bachelor's degree in Business, Economics, Commerce, Engineering, or Analytics.",
      "Knowledge of SQL, Excel, BPM tools, and requirement documentation is valuable.",
      "Certifications in business analysis, agile delivery, or data analytics can help.",
    ],
    outlook: { marketDemand: 88, jobSatisfaction: 82, workLifeBalance: 77 },
    companies: ["Accenture", "Deloitte", "EY", "KPMG", "Infosys", "Wipro", "Genpact", "Capgemini"],
    extraSkills: ["Excel", "Power BI", "Agile", "Documentation"],
  },
  "product manager": {
    overview:
      "Product Managers align user needs, strategy, and execution to shape what a product team builds next. It is a strong fit for people who enjoy leadership, decision-making, and balancing multiple priorities.",
    salaryBands: [
      { label: "Entry Level", range: "INR 8-14 LPA", experience: "0-3 years" },
      { label: "Mid Level", range: "INR 14-24 LPA", experience: "4-8 years" },
      { label: "Senior Level", range: "INR 24-45 LPA", experience: "9+ years" },
    ],
    responsibilities: [
      "Define product goals, user problems, and roadmap priorities.",
      "Coordinate with engineering, design, marketing, and leadership teams.",
      "Use research and analytics to evaluate feature impact.",
      "Write requirements, success metrics, and launch plans.",
      "Balance short-term execution with long-term product strategy.",
    ],
    education: [
      "Common backgrounds include Engineering, Business, Economics, or Design.",
      "Experience in product analysis, consulting, or software delivery often leads into PM roles.",
      "Courses in product strategy, analytics, and user research improve readiness.",
    ],
    outlook: { marketDemand: 89, jobSatisfaction: 86, workLifeBalance: 71 },
    companies: ["Google", "Amazon", "Razorpay", "CRED", "Meesho", "PhonePe", "Freshworks", "Atlassian"],
    extraSkills: ["Analytics", "Strategy", "Experimentation", "Stakeholder Alignment"],
  },
  "psychologist counsellor": {
    overview:
      "Psychologists and counsellors support people through growth, emotional challenges, and life decisions. The work relies on empathy, observation, ethical practice, and strong listening skills.",
    salaryBands: [
      { label: "Entry Level", range: "INR 3-6 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 6-12 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 12-24 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Conduct counselling sessions and build trust with clients.",
      "Assess emotional, behavioral, or career-related concerns.",
      "Develop intervention plans and monitor progress over time.",
      "Maintain confidential records and ethical practice standards.",
      "Collaborate with families, institutions, or healthcare professionals when needed.",
    ],
    education: [
      "Bachelor's degree in Psychology is a starting point for this path.",
      "Master's degree in Counselling, Clinical Psychology, or a related field is commonly required.",
      "Supervised training and relevant licensing or certifications may be needed depending on role.",
    ],
    outlook: { marketDemand: 78, jobSatisfaction: 90, workLifeBalance: 76 },
    companies: ["MindPeers", "YourDOST", "Practo", "Fortis", "Apollo", "Schools", "NGOs", "Private Practice"],
    extraSkills: ["Case Documentation", "Assessment Tools", "Empathy", "Behavioral Observation"],
  },
  "teacher learning designer": {
    overview:
      "Teachers and Learning Designers help people build confidence and understanding over time. The role blends communication, facilitation, and thoughtful lesson or curriculum design.",
    salaryBands: [
      { label: "Entry Level", range: "INR 3-5 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 5-9 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 9-16 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Plan lessons, activities, or learning journeys around clear outcomes.",
      "Facilitate sessions that keep learners engaged and supported.",
      "Assess performance and adapt teaching strategies where needed.",
      "Design content, worksheets, or digital learning materials.",
      "Collaborate with parents, peers, or institutional teams to improve outcomes.",
    ],
    education: [
      "Bachelor's degree in the subject area plus education training is common.",
      "B.Ed., M.Ed., instructional design, or learning science credentials can help.",
      "Experience with digital tools and assessment design strengthens modern roles.",
    ],
    outlook: { marketDemand: 76, jobSatisfaction: 88, workLifeBalance: 78 },
    companies: ["BYJU'S", "Unacademy", "Vedantu", "LEAD", "Schools", "Universities", "UpGrad", "Coursera"],
    extraSkills: ["Instructional Design", "Assessment Design", "Facilitation", "Content Creation"],
  },
  "marketing strategist": {
    overview:
      "Marketing Strategists connect audience insight, storytelling, and positioning to help brands grow. The role suits people who enjoy ideas, communication, and understanding what drives customer behavior.",
    salaryBands: [
      { label: "Entry Level", range: "INR 4-7 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 7-14 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 14-25 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Build go-to-market plans and campaign messaging.",
      "Analyze audience behavior, channels, and campaign performance.",
      "Work with content, design, and sales teams to drive growth.",
      "Shape positioning and brand communication for new launches.",
      "Track experiments and optimize strategies using performance data.",
    ],
    education: [
      "Degrees in Marketing, Mass Communication, Business, or Economics are common.",
      "Hands-on portfolio work in campaigns, content, or digital growth is valuable.",
      "Skills in analytics, copywriting, and consumer psychology help long-term growth.",
    ],
    outlook: { marketDemand: 84, jobSatisfaction: 81, workLifeBalance: 74 },
    companies: ["Google", "Meta", "Unilever", "Zomato", "Swiggy", "Nykaa", "Mamaearth", "Dentsu"],
    extraSkills: ["Brand Strategy", "Performance Marketing", "Consumer Research", "Content"],
  },
  "financial analyst": {
    overview:
      "Financial Analysts evaluate numbers, trends, and risk to support business, investment, and planning decisions. It is a strong fit for people who like structured analysis and disciplined reasoning.",
    salaryBands: [
      { label: "Entry Level", range: "INR 5-9 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 9-17 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 17-30 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Build financial models and scenario analyses.",
      "Track budgets, forecasts, and business performance trends.",
      "Prepare reports for leadership, investors, or clients.",
      "Evaluate investment opportunities and operational risks.",
      "Support strategic decisions with data-backed financial recommendations.",
    ],
    education: [
      "Bachelor's degree in Finance, Commerce, Economics, Mathematics, or Business.",
      "CA, CFA, FRM, or MBA credentials can improve access to advanced roles.",
      "Strong command of Excel, valuation, and reporting tools is essential.",
    ],
    outlook: { marketDemand: 83, jobSatisfaction: 80, workLifeBalance: 73 },
    companies: ["Goldman Sachs", "JP Morgan", "Deloitte", "EY", "KPMG", "ICICI", "HDFC", "American Express"],
    extraSkills: ["Risk Analysis", "Accounting", "PowerPoint", "Forecasting"],
  },
  "healthcare professional": {
    overview:
      "Healthcare Professionals combine science, judgment, and empathy to support patient wellbeing. The role may span diagnostics, treatment support, communication, and consistent care delivery.",
    salaryBands: [
      { label: "Entry Level", range: "INR 4-8 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 8-15 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 15-28 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Assess patient conditions and document observations carefully.",
      "Support diagnosis, treatment planning, or care coordination.",
      "Communicate medical guidance clearly and compassionately.",
      "Maintain standards of safety, ethics, and compliance.",
      "Work with multidisciplinary teams in fast-moving environments.",
    ],
    education: [
      "This pathway often requires specialized degrees such as MBBS, BDS, BSc Nursing, Pharmacy, or allied health programs.",
      "Licensing, hospital training, and supervised clinical exposure are typically essential.",
      "Further specialization or postgraduate study can improve long-term progression.",
    ],
    outlook: { marketDemand: 87, jobSatisfaction: 84, workLifeBalance: 68 },
    companies: ["Apollo", "Fortis", "Max Healthcare", "Narayana Health", "Medanta", "Practo", "Manipal", "Aster"],
    extraSkills: ["Clinical Judgment", "Patient Communication", "Documentation", "Ethics"],
  },
  "environmental researcher": {
    overview:
      "Environmental Researchers study ecosystems, sustainability, and real-world patterns to help solve climate and resource challenges. The role combines field curiosity with analytical thinking.",
    salaryBands: [
      { label: "Entry Level", range: "INR 4-7 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 7-12 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 12-20 LPA", experience: "8+ years" },
    ],
    responsibilities: [
      "Plan and conduct field or desk-based environmental studies.",
      "Analyze ecological, climate, or sustainability data.",
      "Prepare reports and recommendations for policy or industry stakeholders.",
      "Support impact assessments and compliance documentation.",
      "Collaborate with scientists, NGOs, or public institutions on research initiatives.",
    ],
    education: [
      "Bachelor's degree in Environmental Science, Biology, Geography, or related disciplines.",
      "Master's degree can help for advanced research or policy roles.",
      "GIS, fieldwork, data analysis, and sustainability reporting skills are especially useful.",
    ],
    outlook: { marketDemand: 74, jobSatisfaction: 86, workLifeBalance: 77 },
    companies: ["TERI", "WWF", "UNEP", "CPCB", "EY Sustainability", "WRI India", "Shell", "Tata Power"],
    extraSkills: ["GIS", "Sustainability Reporting", "Field Research", "Policy Analysis"],
  },
  "operations manager": {
    overview:
      "Operations Managers improve workflows, coordinate teams, and keep execution reliable at scale. The role is a fit for people who like planning, ownership, and turning complexity into smoother systems.",
    salaryBands: [
      { label: "Entry Level", range: "INR 6-10 LPA", experience: "0-3 years" },
      { label: "Mid Level", range: "INR 10-18 LPA", experience: "4-8 years" },
      { label: "Senior Level", range: "INR 18-30 LPA", experience: "9+ years" },
    ],
    responsibilities: [
      "Monitor day-to-day operations and remove process bottlenecks.",
      "Build tracking systems for quality, timelines, and output consistency.",
      "Coordinate across teams, vendors, or facilities to maintain delivery.",
      "Use data to improve efficiency and capacity planning.",
      "Support team performance, escalation handling, and execution discipline.",
    ],
    education: [
      "Degrees in Business, Commerce, Engineering, Supply Chain, or Operations are common.",
      "Experience in project coordination, logistics, or process improvement is useful.",
      "Lean, Six Sigma, and analytics skills can support faster growth in this path.",
    ],
    outlook: { marketDemand: 86, jobSatisfaction: 79, workLifeBalance: 73 },
    companies: ["Amazon", "Flipkart", "Delhivery", "Swiggy", "Zomato", "DHL", "Tata", "Reliance Retail"],
    extraSkills: ["Excel", "Lean Process", "People Management", "Planning"],
  },
};

const normalizeCareerKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dedupe = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildFallbackSalaryBands = (salaryText = "") => {
  const match = String(salaryText).match(/(\d+)\s*-\s*(\d+)/i);
  if (!match) {
    return [
      { label: "Entry Level", range: "INR 4-7 LPA", experience: "0-2 years" },
      { label: "Mid Level", range: "INR 7-12 LPA", experience: "3-7 years" },
      { label: "Senior Level", range: "INR 12-22 LPA", experience: "8+ years" },
    ];
  }

  const low = Number(match[1]);
  const high = Number(match[2]);
  const seniorHigh = high + Math.max(4, Math.round((high - low) * 0.9));

  return [
    {
      label: "Entry Level",
      range: `INR ${Math.max(3, low - 2)}-${low} LPA`,
      experience: "0-2 years",
    },
    {
      label: "Mid Level",
      range: `INR ${low}-${high} LPA`,
      experience: "3-7 years",
    },
    {
      label: "Senior Level",
      range: `INR ${high}-${seniorHigh} LPA`,
      experience: "8+ years",
    },
  ];
};

const buildFallbackResponsibilities = (title = "career") => [
  `Analyze problems and opportunities relevant to a ${title} role.`,
  "Collaborate with teams and stakeholders to move work forward.",
  "Use core tools, workflows, and domain knowledge to deliver outcomes.",
  "Present insights, progress, or recommendations clearly.",
  "Keep improving your methods through practice and feedback.",
];

export const buildCareerDetailPath = (careerOrTitle) => {
  const title =
    typeof careerOrTitle === "string" ? careerOrTitle : careerOrTitle?.title || "";
  return title ? `/careerdetail?career=${encodeURIComponent(title)}` : "/careerdetail";
};

export const getCareerDetailContent = (career = null) => {
  const title = career?.title || "Career Match";
  const key = normalizeCareerKey(title);
  const detail = CAREER_DETAIL_CONTENT[key] || {};
  const salaryText = career?.salaryRange || detail.salaryRange || "";
  const resolvedSkills = dedupe([
    ...(career?.skills || []),
    ...(detail.extraSkills || []),
  ]).slice(0, 8);

  return {
    title,
    matchPercent: career?.matchPercent ?? 82,
    description:
      career?.description ||
      detail.overview ||
      `Explore what it takes to grow in ${title} and how it aligns with your profile.`,
    overview:
      detail.overview ||
      career?.description ||
      `This pathway blends the strengths and interests commonly associated with ${title}.`,
    salaryText,
    salaryBands: detail.salaryBands || buildFallbackSalaryBands(salaryText),
    responsibilities:
      detail.responsibilities || buildFallbackResponsibilities(title.toLowerCase()),
    education: detail.education || DEFAULT_EDUCATION,
    outlook: detail.outlook || DEFAULT_OUTLOOK,
    companies: detail.companies || DEFAULT_COMPANIES,
    guidancePoints: detail.guidancePoints || DEFAULT_GUIDANCE_POINTS,
    skills: resolvedSkills.length ? resolvedSkills : DEFAULT_SKILLS,
  };
};

export const matchCareerByTitle = (careers = [], title = "") => {
  const requestedKey = normalizeCareerKey(title);
  if (!requestedKey) return null;
  return careers.find((career) => normalizeCareerKey(career?.title) === requestedKey) || null;
};
