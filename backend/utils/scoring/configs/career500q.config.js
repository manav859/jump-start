const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

const likertBands = ({ high, moderate, low }) => [
  {
    label: "High",
    min: 4,
    max: 5,
    interpretation: high.interpretation,
    careerImplication: high.careerImplication,
  },
  {
    label: "Moderate",
    min: 3,
    max: 3.99,
    interpretation: moderate.interpretation,
    careerImplication: moderate.careerImplication,
  },
  {
    label: "Low",
    min: 1,
    max: 2.99,
    interpretation: low.interpretation,
    careerImplication: low.careerImplication,
  },
];

const objectiveBands = (bands) => bands;

export const CAREER_500Q_CONFIG = {
  algorithmKey: "career-500q-v1",
  packageIds: ["complete-aptitude-500q"],
  title: "Complete Aptitude Test (500Q)",
  scoringGuideSources: [
    "backend/reference/complete-answer-key-500q.pdf",
    "backend/reference/complete-aptitude-test-500q.pdf",
  ],
  ambiguityNotes: [
    "Leadership subsection 1.4 intentionally cross-references EQ questions 491, 498, 499, and 500 in the scoring guide.",
    "Spatial Relations 4.4 does not include machine-readable answer keys in the PDF export; it is flagged for review-only handling.",
    "The current generated package still stores section 1.2 and 1.3 booklet prompts without the full A/B/C option metadata from the PDF, so those blocks need a seed/package refresh for fully exact live capture.",
    "Work Style 1.3 and Interest subsections 3.3/3.4 provide summary interpretation guidance in the PDF rather than full per-question scoring keys, so those blocks use package-specific explicit profile routing informed by the booklet wording.",
  ],
  sections: [
    {
      sectionId: 1,
      key: "personality",
      label: "Personality Assessment",
      displayOrder: 1,
      subsections: [
        {
          key: "big_five_ocean",
          label: "1.1 Big Five Personality Traits (OCEAN)",
          displayOrder: 1,
          questionNumbers: range(1, 30),
          answerType: "likert",
          scoringMethod: "factor_profile",
          scoreType: "average",
          interpretationPrompt:
            "Use the exact OCEAN trait groupings and reverse-scored items from the scoring guide.",
          factors: [
            {
              key: "extraversion",
              label: "Extraversion",
              questionNumbers: [1, 6, 11, 16, 21, 26],
              reverseQuestions: [6, 16],
              highText: "Outgoing, social, energetic",
              careerImplication: "Good for sales, teaching, management",
            },
            {
              key: "openness",
              label: "Openness",
              questionNumbers: [2, 4, 9, 14, 19, 24, 29],
              reverseQuestions: [29],
              highText: "Creative, curious, intellectual",
              careerImplication: "Good for research, arts, innovation",
            },
            {
              key: "conscientiousness",
              label: "Conscientiousness",
              questionNumbers: [7, 12, 17, 22, 27],
              reverseQuestions: [12, 22],
              highText: "Organized, responsible, persistent",
              careerImplication: "Good for accounting, medicine, engineering",
            },
            {
              key: "agreeableness",
              label: "Agreeableness",
              questionNumbers: [5, 10, 15, 20, 25, 30],
              reverseQuestions: [10, 20],
              highText: "Cooperative, trusting, helpful",
              careerImplication: "Good for counseling, social work, healthcare",
            },
            {
              key: "neuroticism",
              label: "Neuroticism",
              questionNumbers: [3, 8, 13, 18, 23, 28],
              reverseQuestions: [8, 18, 28],
              highText: "Emotionally reactive and stress-prone",
              careerImplication:
                "Needs stronger support systems before high-pressure career paths.",
              lowBandText: "Calm, stable, resilient",
              lowBandCareerImplication:
                "Good for high-stress careers like surgery and emergency services",
            },
          ],
        },
        {
          key: "hspq_factors",
          label: "1.2 HSPQ-Style Personality Factors",
          displayOrder: 2,
          questionNumbers: range(31, 72),
          answerType: "likert",
          scoringMethod: "factor_profile",
          scoreType: "average",
          interpretationPrompt:
            "Score only the factor-specific items listed beside each HSPQ factor in the guide.",
          factors: [
            {
              key: "warmth",
              label: "Warmth",
              questionNumbers: [31, 35, 46, 56, 64, 72],
              reverseQuestions: [],
              highText: "Warm, approachable, and socially open",
              careerImplication: "Supports teaching, counseling, and relationship-heavy roles",
            },
            {
              key: "reasoning",
              label: "Reasoning",
              questionNumbers: [32, 36, 43, 48, 53, 61, 69],
              reverseQuestions: [],
              highText: "Abstract, analytical, and intellectually oriented",
              careerImplication: "Supports research, programming, and analytical careers",
            },
            {
              key: "emotional_stability",
              label: "Emotional Stability",
              questionNumbers: [33, 44, 54, 62, 70],
              reverseQuestions: [],
              highText: "Calm under pressure with stronger stress tolerance",
              careerImplication: "Supports leadership, healthcare, and demanding environments",
            },
            {
              key: "dominance",
              label: "Dominance",
              questionNumbers: [34, 41, 49, 58, 66],
              reverseQuestions: [],
              highText: "Decisive with stronger leadership tendency",
              careerImplication: "Supports management and entrepreneurship",
            },
            {
              key: "liveliness",
              label: "Liveliness",
              questionNumbers: [39, 51, 63, 71],
              reverseQuestions: [],
              highText: "Energetic, spontaneous, and stimulation-seeking",
              careerImplication: "Supports dynamic, visible, or high-energy roles",
            },
            {
              key: "rule_consciousness",
              label: "Rule-Consciousness",
              questionNumbers: [38, 45, 55],
              reverseQuestions: [],
              highText: "Procedure-aware and structure-oriented",
              careerImplication: "Supports compliance, operations, and formal environments",
            },
            {
              key: "social_boldness",
              label: "Social Boldness",
              questionNumbers: [42, 50, 52, 60, 68],
              reverseQuestions: [42, 50, 52, 60, 68],
              highText: "Confident in social exposure and public interaction",
              careerImplication: "Supports sales, counseling, and public-facing work",
            },
            {
              key: "sensitivity",
              label: "Sensitivity",
              questionNumbers: [40, 47, 57, 59, 65, 67],
              reverseQuestions: [47, 57, 59, 65],
              highText: "More emotionally attuned and empathic",
              careerImplication: "Supports healthcare, social work, and arts-oriented roles",
            },
          ],
          combinationRules: [
            {
              key: "warmth_plus_social_boldness",
              label: "Warmth + Social Boldness",
              requiredFactors: ["warmth", "social_boldness"],
              minAverage: 4,
              interpretation:
                "High warmth with strong social boldness points to confident people-facing engagement.",
              careerImplication: "Teaching, counseling, sales",
            },
            {
              key: "reasoning_plus_low_social_needs",
              label: "Reasoning + Low Social Needs",
              requiredFactors: ["reasoning"],
              maxFactors: ["warmth"],
              minAverage: 4,
              maxAverage: 3,
              interpretation:
                "Strong reasoning with lower social pull points toward focused analytical work.",
              careerImplication: "Research, programming, analysis",
            },
            {
              key: "dominance_plus_emotional_stability",
              label: "Dominance + Emotional Stability",
              requiredFactors: ["dominance", "emotional_stability"],
              minAverage: 4,
              interpretation:
                "Stable, assertive responses suggest leadership under pressure.",
              careerImplication: "Leadership, management, entrepreneurship",
            },
            {
              key: "sensitivity_plus_social_interest",
              label: "Sensitivity + Social Interest",
              requiredFactors: ["sensitivity", "warmth"],
              minAverage: 4,
              interpretation:
                "Sensitive and socially responsive patterns align with helping or expressive roles.",
              careerImplication: "Healthcare, social work, arts",
            },
          ],
        },
        {
          key: "work_style_preferences",
          label: "1.3 Work Style Preferences",
          displayOrder: 3,
          questionNumbers: range(73, 96),
          answerType: "single",
          scoringMethod: "work_style_profile",
          scoreType: "profile_consistency",
          profileOptions: {
            A: {
              key: "structured_independent",
              label: "Structured / Independent",
              interpretation:
                "Responses lean toward structured systems, solo ownership, and procedure-led execution.",
              careerImplication:
                "Research, accounting, law, operations, project planning, quality-focused work",
              highlights: [
                "Prefers structured and predictable work.",
                "Shows comfort with independent ownership.",
                "Works best with clear procedures and organized systems.",
              ],
            },
            B: {
              key: "balanced_collaborative",
              label: "Balanced / Collaborative",
              interpretation:
                "Responses balance teamwork, flexibility, and shared decision-making.",
              careerImplication:
                "Consulting, design, education, healthcare, professional services",
              highlights: [
                "Shows comfort with collaborative environments.",
                "Balances flexibility with team coordination.",
                "Works well in shared decision-making settings.",
              ],
            },
            C: {
              key: "dynamic_autonomous",
              label: "Dynamic / Autonomous",
              interpretation:
                "Responses prefer autonomy, novelty, intensity, and self-directed movement.",
              careerImplication:
                "Entrepreneurship, journalism, consulting, startups, fast-moving environments",
              highlights: [
                "Prefers flexible and fast-moving environments.",
                "Shows a stronger autonomous-work tendency.",
                "Thrives on novelty, intensity, and self-direction.",
              ],
            },
          },
        },
        {
          key: "leadership_social_interaction",
          label: "1.4 Leadership and Social Interaction",
          displayOrder: 4,
          questionNumbers: range(97, 120),
          answerType: "likert",
          scoringMethod: "factor_profile",
          scoreType: "average",
          interpretationPrompt:
            "Use the exact leadership factor groupings, including the cross-referenced EQ items from the guide.",
          factors: [
            {
              key: "taking_charge",
              label: "Taking Charge",
              questionNumbers: [97, 100, 105, 113, 118],
              reverseQuestions: [],
              highText: "Natural leadership tendency",
              careerImplication: "Leadership, management, entrepreneurship",
            },
            {
              key: "organizing_teaching",
              label: "Organizing / Teaching",
              questionNumbers: [98, 103, 107, 111, 116],
              reverseQuestions: [],
              highText: "Supportive, planning-oriented leadership",
              careerImplication: "Education, training, human resources",
            },
            {
              key: "communication",
              label: "Communication",
              questionNumbers: [99, 104, 108, 494, 498],
              reverseQuestions: [],
              highText: "Social influence and message delivery",
              careerImplication: "Sales, marketing, public relations",
            },
            {
              key: "conflict_resolution",
              label: "Conflict Resolution",
              questionNumbers: [102, 108, 110, 491, 499],
              reverseQuestions: [],
              highText: "Mediation and relational de-escalation",
              careerImplication: "Law, mediation, counseling",
            },
            {
              key: "team_building",
              label: "Team Building",
              questionNumbers: [106, 115, 117, 119, 120, 500],
              reverseQuestions: [],
              highText: "Group cohesion and team dynamics",
              careerImplication: "Project management, team leadership",
            },
          ],
          combinationRules: [
            {
              key: "executive_leadership",
              label: "Executive Leadership Pattern",
              requiredFactors: [
                "taking_charge",
                "organizing_teaching",
                "communication",
                "conflict_resolution",
                "team_building",
              ],
              minAverage: 4,
              interpretation:
                "High scores across all leadership factors point to broad leadership readiness.",
              careerImplication:
                "Executive leadership, politics, organizational development",
            },
          ],
        },
      ],
    },
    {
      sectionId: 2,
      key: "multiple_intelligence",
      label: "Multiple Intelligence Assessment",
      displayOrder: 2,
      subsections: [
        {
          key: "logical_mathematical",
          label: "2.1 Logical-Mathematical Intelligence",
          displayOrder: 1,
          questionNumbers: range(121, 130),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong quantitative and analytical thinking.",
              careerImplication:
                "Engineering, computer science, mathematics, research, finance",
            },
            moderate: {
              interpretation: "Usable technical reasoning with room to specialize.",
              careerImplication:
                "Business analysis, quality control, technical roles",
            },
            low: {
              interpretation:
                "Lower preference for sustained quantitative work in this inventory.",
              careerImplication:
                "May struggle with quantitative subjects; focus on qualitative fields",
            },
          }),
        },
        {
          key: "linguistic_verbal",
          label: "2.2 Linguistic-Verbal Intelligence",
          displayOrder: 2,
          questionNumbers: range(131, 140),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong language, explanation, and verbal expression.",
              careerImplication:
                "Writing, journalism, law, teaching, translation, public relations",
            },
            moderate: {
              interpretation: "Balanced communication capability for general roles.",
              careerImplication:
                "General communication roles, customer service",
            },
            low: {
              interpretation:
                "Lower language pull relative to other skill areas in this test.",
              careerImplication:
                "Technical, hands-on, or visual-based careers",
            },
          }),
        },
        {
          key: "spatial_visual",
          label: "2.3 Spatial-Visual Intelligence",
          displayOrder: 3,
          questionNumbers: range(141, 150),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong visualization and spatial imagination.",
              careerImplication:
                "Architecture, engineering, design, art, geography, surgery",
            },
            moderate: {
              interpretation: "Practical spatial sense with usable technical visual skill.",
              careerImplication: "General technical work, crafts",
            },
            low: {
              interpretation:
                "Lower spatial pull relative to other strengths in this profile.",
              careerImplication: "Verbal or numerical focused careers",
            },
          }),
        },
        {
          key: "musical_rhythmic",
          label: "2.4 Musical-Rhythmic Intelligence",
          displayOrder: 4,
          questionNumbers: range(151, 160),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong sensitivity to rhythm, melody, and sound patterns.",
              careerImplication:
                "Music performance, composition, sound engineering, music therapy",
            },
            moderate: {
              interpretation: "Functional musical appreciation and applied creativity.",
              careerImplication: "Arts integration, entertainment industry",
            },
            low: {
              interpretation: "Music is not a leading intelligence signal here.",
              careerImplication: "Focus on non-musical fields",
            },
          }),
        },
        {
          key: "bodily_kinesthetic",
          label: "2.5 Bodily-Kinesthetic Intelligence",
          displayOrder: 5,
          questionNumbers: range(161, 170),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong physical coordination and action-based learning.",
              careerImplication:
                "Sports, dance, physical therapy, surgery, crafts, trades",
            },
            moderate: {
              interpretation: "Comfortable with movement and hands-on tasks.",
              careerImplication: "Active professions, hands-on work",
            },
            low: {
              interpretation: "Less preference for physical execution as a core strength.",
              careerImplication: "Desk-based, intellectual work",
            },
          }),
        },
        {
          key: "interpersonal",
          label: "2.6 Interpersonal Intelligence",
          displayOrder: 6,
          questionNumbers: range(171, 180),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong people-awareness and relationship skill.",
              careerImplication:
                "Counseling, teaching, social work, sales, management, healthcare",
            },
            moderate: {
              interpretation: "Works well in team and service contexts.",
              careerImplication: "Customer service, team-based work",
            },
            low: {
              interpretation: "Lower social pull relative to independent work styles.",
              careerImplication: "Independent, technical work",
            },
          }),
        },
        {
          key: "intrapersonal",
          label: "2.7 Intrapersonal Intelligence",
          displayOrder: 7,
          questionNumbers: range(181, 190),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong self-reflection and self-directed awareness.",
              careerImplication:
                "Psychology, philosophy, writing, research, entrepreneurship",
            },
            moderate: {
              interpretation: "Usable self-direction across many professional settings.",
              careerImplication: "Any field requiring self-direction",
            },
            low: {
              interpretation: "External structure may currently support performance better.",
              careerImplication: "Highly structured, externally-directed roles",
            },
          }),
        },
        {
          key: "naturalistic",
          label: "2.8 Naturalistic Intelligence",
          displayOrder: 8,
          questionNumbers: range(191, 200),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong orientation toward natural systems and environments.",
              careerImplication:
                "Environmental science, biology, veterinary medicine, agriculture, geology",
            },
            moderate: {
              interpretation: "Usable affinity for nature and outdoor contexts.",
              careerImplication: "Outdoor recreation, conservation",
            },
            low: {
              interpretation: "Nature-oriented work is not a dominant pull in this profile.",
              careerImplication: "Urban, indoor-focused careers",
            },
          }),
        },
      ],
    },
    {
      sectionId: 3,
      key: "interest",
      label: "Interest Assessment",
      displayOrder: 3,
      subsections: [
        {
          key: "holland_riasec",
          label: "3.1 Holland Code (RIASEC) Assessment",
          displayOrder: 1,
          questionNumbers: range(201, 236),
          answerType: "likert",
          scoringMethod: "factor_profile",
          scoreType: "average",
          factors: [
            {
              key: "realistic",
              label: "Realistic",
              questionNumbers: range(201, 206),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation: "Strong interest in practical, technical, and hands-on activity.",
                  careerImplication:
                    "Engineering, agriculture, construction, military, technical trades",
                },
                moderate: {
                  interpretation: "Practical interest is present but not dominant.",
                  careerImplication: "Applied sciences, maintenance, operations",
                },
                low: {
                  interpretation: "Less pull toward hands-on realistic environments.",
                  careerImplication: "Office-based, social, or artistic careers",
                },
              }),
            },
            {
              key: "investigative",
              label: "Investigative",
              questionNumbers: range(207, 212),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation: "Strong curiosity for analysis, research, and science.",
                  careerImplication:
                    "Research, medicine, science, mathematics, computer science",
                },
                moderate: {
                  interpretation: "Analytical curiosity is usable but not dominant.",
                  careerImplication: "Analysis, quality control, technical consulting",
                },
                low: {
                  interpretation: "Less pull toward research-heavy work.",
                  careerImplication: "People-focused or routine work",
                },
              }),
            },
            {
              key: "artistic",
              label: "Artistic",
              questionNumbers: range(213, 218),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation: "Strong interest in creative and expressive work.",
                  careerImplication:
                    "Visual arts, performing arts, creative writing, design, media",
                },
                moderate: {
                  interpretation: "Creative interest is present but balanced with other pulls.",
                  careerImplication: "Marketing, advertising, communications",
                },
                low: {
                  interpretation: "Creative expression is not the strongest vocational signal.",
                  careerImplication: "Technical, routine, or highly structured work",
                },
              }),
            },
            {
              key: "social",
              label: "Social",
              questionNumbers: range(219, 224),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation: "Strong interest in helping, teaching, and supporting others.",
                  careerImplication:
                    "Teaching, counseling, healthcare, social work, ministry",
                },
                moderate: {
                  interpretation: "Social service pull is present but balanced.",
                  careerImplication: "Customer service, training, human resources",
                },
                low: {
                  interpretation: "Less pull toward helper-focused environments.",
                  careerImplication: "Independent, technical, or data-focused work",
                },
              }),
            },
            {
              key: "enterprising",
              label: "Enterprising",
              questionNumbers: range(225, 230),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation: "Strong drive for influence, initiative, and leadership.",
                  careerImplication:
                    "Business, sales, management, law, politics, entrepreneurship",
                },
                moderate: {
                  interpretation: "Usable commercial or leadership orientation.",
                  careerImplication: "Marketing, finance, administration",
                },
                low: {
                  interpretation: "Less pull toward persuasive or leadership-heavy environments.",
                  careerImplication: "Research, routine, or solitary work",
                },
              }),
            },
            {
              key: "conventional",
              label: "Conventional",
              questionNumbers: range(231, 236),
              reverseQuestions: [],
              bands: likertBands({
                high: {
                  interpretation:
                    "Strong interest in order, systems, and structured information flow.",
                  careerImplication:
                    "Accounting, banking, administration, data management",
                },
                moderate: {
                  interpretation: "Comfort with office structure and operational support.",
                  careerImplication: "Office management, operations, support services",
                },
                low: {
                  interpretation: "Less preference for routine or highly structured environments.",
                  careerImplication: "Creative, unstructured, or innovative work",
                },
              }),
            },
          ],
          hollandCombinations: [
            {
              code: "RIC",
              interpretation:
                "Realistic-Investigative-Conventional pattern favors technical precision and systems work.",
              careerImplication:
                "Engineering, computer science, technical analysis",
            },
            {
              code: "AIE",
              interpretation:
                "Artistic-Investigative-Enterprising pattern blends creativity with analytical initiative.",
              careerImplication:
                "Graphic design, architecture, creative consulting",
            },
            {
              code: "SEA",
              interpretation:
                "Social-Enterprising-Artistic pattern favors people influence with expressive communication.",
              careerImplication:
                "Teaching, training, educational leadership",
            },
            {
              code: "IAS",
              interpretation:
                "Investigative-Artistic-Social pattern blends analysis with human-centered creativity.",
              careerImplication:
                "Psychology, creative therapy, research with social impact",
            },
            {
              code: "ECS",
              interpretation:
                "Enterprising-Conventional-Social pattern points to organized influence and people coordination.",
              careerImplication:
                "Business management, human resources, organizational development",
            },
          ],
        },
        {
          key: "subject_preferences",
          label: "3.2 Subject Preferences",
          displayOrder: 2,
          questionNumbers: range(237, 254),
          answerType: "likert",
          scoringMethod: "subject_cluster_profile",
          scoreType: "average",
          subjectClusters: [
            {
              key: "stem",
              label: "STEM Subjects",
              questionNumbers: [237, 238, 239, 240, 241, 251],
            },
            {
              key: "humanities",
              label: "Humanities Subjects",
              questionNumbers: [242, 243, 250, 253],
            },
            {
              key: "arts",
              label: "Arts Subjects",
              questionNumbers: [244, 245, 254],
            },
            {
              key: "social_sciences",
              label: "Social Sciences",
              questionNumbers: [243, 244, 248, 252],
            },
          ],
          combinationGuides: [
            "Mathematics + Physics + Engineering = Traditional Engineering",
            "Biology + Medicine = Healthcare / Medical track",
            "Computer Science + Mathematics = Technology track",
            "Literature + History = Liberal Arts track",
            "Philosophy + Law = Legal / Policy track",
            "Languages + Literature = Communications / International studies",
            "Art + Music = Creative Arts track",
            "Art + Communication = Media / Design track",
            "Music + Psychology = Creative therapy",
            "Psychology + Social Studies = Counseling / Social Work",
            "Psychology + Medicine = Clinical Psychology",
            "History + Law = Legal studies",
          ],
        },
        {
          key: "activity_preferences",
          label: "3.3 Activity Preferences",
          displayOrder: 3,
          questionNumbers: range(255, 272),
          answerType: "single",
          scoringMethod: "interest_activity_profile",
          scoreType: "profile_consistency",
          dominantProfiles: {
            science: {
              label: "Science / Investigative Pull",
              interpretation:
                "Activity choices repeatedly favor science, research, and investigative exploration.",
              careerImplication: "Science stream recommendation",
              highlights: [
                "Enjoys research, investigation, and scientific exploration.",
                "Prefers analytical or discovery-based activities.",
                "Shows stronger interest in evidence-driven tasks.",
              ],
            },
            business: {
              label: "Business / Enterprising Pull",
              interpretation:
                "Choices favor organized influence, business execution, and commercial leadership.",
              careerImplication: "Commerce stream recommendation",
              highlights: [
                "Enjoys leadership, initiative, and commercial activity.",
                "Shows comfort influencing outcomes and people.",
                "Prefers goal-driven and enterprise-oriented work.",
              ],
            },
            artistic: {
              label: "Artistic / Creative Pull",
              interpretation:
                "Choices repeatedly favor expressive, design-led, and creative experiences.",
              careerImplication: "Arts / Creative stream recommendation",
              highlights: [
                "Prefers expressive, design-led, or creative activities.",
                "Shows interest in imagination, aesthetics, and originality.",
                "Enjoys open-ended, media, or art-oriented experiences.",
              ],
            },
            social: {
              label: "Social / Service Pull",
              interpretation:
                "Choices repeatedly favor teaching, care, service, and direct people support.",
              careerImplication: "Education, healthcare, counseling, or service pathways",
              highlights: [
                "Enjoys helping, teaching, and direct people support.",
                "Feels drawn to service-oriented or care-focused roles.",
                "Shows comfort in human-centered activities.",
              ],
            },
            technical: {
              label: "Technical / Applied Pull",
              interpretation:
                "Choices show practical, build-oriented, or technology execution interests.",
              careerImplication: "Technical, engineering, or applied problem-solving pathways",
              highlights: [
                "Prefers practical, build-oriented, or hands-on problem solving.",
                "Shows comfort with tools, systems, and applied execution.",
                "Leans toward engineering or technical activity patterns.",
              ],
            },
          },
        },
        {
          key: "work_environment_preferences",
          label: "3.4 Work Environment Preferences",
          displayOrder: 4,
          questionNumbers: range(273, 290),
          answerType: "single",
          scoringMethod: "environment_profile",
          scoreType: "profile_consistency",
          dominantProfiles: {
            research: {
              label: "Research / Quiet / Independent",
              interpretation:
                "Environment choices prefer research-focused, quieter, and independent settings.",
              careerImplication: "Science, research, technical careers",
              highlights: [
                "Prefers quiet, research-focused, or independent settings.",
                "Works comfortably with focused solitary tasks.",
                "Leans toward specialized or low-distraction environments.",
              ],
            },
            collaborative: {
              label: "Collaborative / People / Service",
              interpretation:
                "Environment choices favor collaboration, service, and direct human interaction.",
              careerImplication: "Education, healthcare, social services",
              highlights: [
                "Prefers collaborative and people-centered environments.",
                "Enjoys service, teamwork, and shared activity.",
                "Feels comfortable in interactive group settings.",
              ],
            },
            dynamic: {
              label: "Dynamic / Leadership / Business",
              interpretation:
                "Environment choices favor movement, leadership, and high-energy execution.",
              careerImplication: "Management, sales, entrepreneurship",
              highlights: [
                "Prefers fast-paced, high-energy environments.",
                "Shows comfort with leadership and movement.",
                "Leans toward business, execution, and decision-heavy settings.",
              ],
            },
            creative: {
              label: "Creative / Flexible / Innovative",
              interpretation:
                "Environment choices prefer flexibility, creative tooling, and novel setups.",
              careerImplication: "Arts, design, media, startups",
              highlights: [
                "Prefers flexible and innovative work settings.",
                "Enjoys open-ended, creative, or experimental environments.",
                "Leans toward design, media, or startup-like spaces.",
              ],
            },
          },
        },
      ],
    },
    {
      sectionId: 4,
      key: "aptitude",
      label: "Aptitude Battery",
      displayOrder: 4,
      subsections: [
        {
          key: "verbal_reasoning",
          label: "4.1 Verbal Reasoning",
          displayOrder: 1,
          questionNumbers: range(291, 315),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 23,
              max: 25,
              interpretation: "Excellent verbal reasoning.",
              careerImplication: "Law, journalism, literature",
            },
            {
              label: "Good",
              min: 20,
              max: 22,
              interpretation: "Good verbal skills.",
              careerImplication: "Teaching, communications, business",
            },
            {
              label: "Average",
              min: 17,
              max: 19,
              interpretation: "Average verbal ability.",
              careerImplication: "General professional roles",
            },
            {
              label: "Developing",
              min: 0,
              max: 16,
              interpretation: "Verbal reasoning is not yet the strongest measured aptitude.",
              careerImplication:
                "Focus on non-verbal strengths, including technical, hands-on, or visual fields",
            },
          ]),
        },
        {
          key: "numerical_ability",
          label: "4.2 Numerical Ability",
          displayOrder: 2,
          questionNumbers: range(316, 340),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 23,
              max: 25,
              interpretation: "Strong mathematical ability.",
              careerImplication: "Engineering, finance, science",
            },
            {
              label: "Good",
              min: 20,
              max: 22,
              interpretation: "Good numerical skills.",
              careerImplication: "Business, technical fields",
            },
            {
              label: "Average",
              min: 17,
              max: 19,
              interpretation: "Average mathematical ability.",
              careerImplication: "General professional roles",
            },
            {
              label: "Developing",
              min: 0,
              max: 16,
              interpretation: "Quantitative work may need more structured support.",
              careerImplication:
                "Focus on non-quantitative fields such as arts, social services, or humanities",
            },
          ]),
        },
        {
          key: "abstract_reasoning",
          label: "4.3 Abstract Reasoning",
          displayOrder: 3,
          questionNumbers: range(341, 365),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 23,
              max: 25,
              interpretation: "Excellent pattern recognition.",
              careerImplication: "Research, science, programming",
            },
            {
              label: "Good",
              min: 20,
              max: 22,
              interpretation: "Good abstract thinking.",
              careerImplication: "Engineering, analysis, problem-solving roles",
            },
            {
              label: "Average",
              min: 17,
              max: 19,
              interpretation: "Average abstract ability.",
              careerImplication: "Most professional roles",
            },
            {
              label: "Developing",
              min: 0,
              max: 16,
              interpretation: "Abstract reasoning is still developing.",
              careerImplication:
                "Focus on concrete, practical applications or hands-on service roles",
            },
          ]),
        },
        {
          key: "spatial_relations",
          label: "4.4 Spatial Relations",
          displayOrder: 4,
          questionNumbers: range(366, 390),
          answerType: "single",
          scoringMethod: "manual_review_only",
          scoreType: "review_only",
          reviewNote:
            "The answer-key PDF only provides conceptual scoring principles for these diagram items; machine scoring is intentionally disabled until diagram-level keys are available.",
          bands: objectiveBands([
            {
              label: "Strong",
              min: 20,
              max: 25,
              interpretation: "Strong spatial ability.",
              careerImplication: "Architecture, engineering, surgery, design",
            },
            {
              label: "Good",
              min: 16,
              max: 19,
              interpretation: "Good spatial skills.",
              careerImplication: "Technical fields, trades, visual arts",
            },
            {
              label: "Average",
              min: 12,
              max: 15,
              interpretation: "Average spatial ability.",
              careerImplication: "General professional work",
            },
            {
              label: "Developing",
              min: 0,
              max: 11,
              interpretation: "Spatial reasoning appears less established in the current evidence.",
              careerImplication:
                "Focus on verbal or numerical strengths in humanities, business, or service work",
            },
          ]),
        },
        {
          key: "mechanical_reasoning",
          label: "4.5 Mechanical Reasoning",
          displayOrder: 5,
          questionNumbers: range(391, 410),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Strong",
              min: 16,
              max: 20,
              interpretation: "Strong mechanical aptitude.",
              careerImplication: "Engineering, trades, technical fields",
            },
            {
              label: "Good",
              min: 13,
              max: 15,
              interpretation: "Good mechanical understanding.",
              careerImplication: "Applied technology, maintenance",
            },
            {
              label: "Average",
              min: 10,
              max: 12,
              interpretation: "Average mechanical sense.",
              careerImplication: "General technical work",
            },
            {
              label: "Developing",
              min: 0,
              max: 9,
              interpretation: "Mechanical systems are not yet the strongest aptitude area.",
              careerImplication: "Service, arts, business, and non-mechanical fields",
            },
          ]),
        },
        {
          key: "clerical_accuracy",
          label: "4.6 Clerical Speed & Accuracy",
          displayOrder: 6,
          questionNumbers: range(411, 430),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 17,
              max: 20,
              interpretation: "Excellent attention to detail in clerical checks.",
              careerImplication: "Data entry, quality control, administration",
            },
            {
              label: "Good",
              min: 14,
              max: 16,
              interpretation: "Good clerical accuracy.",
              careerImplication: "General office work, support roles",
            },
            {
              label: "Average",
              min: 11,
              max: 13,
              interpretation: "Average clerical ability.",
              careerImplication: "Customer service, basic administrative tasks",
            },
            {
              label: "Developing",
              min: 0,
              max: 10,
              interpretation: "High-precision clerical checking may need more support.",
              careerImplication:
                "Creative, social, or leadership roles rather than detail-heavy clerical work",
            },
          ]),
        },
        {
          key: "critical_thinking",
          label: "4.7 Critical Thinking",
          displayOrder: 7,
          questionNumbers: range(431, 440),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 9,
              max: 10,
              interpretation: "Excellent critical thinking.",
              careerImplication: "Research, law, analysis, leadership",
            },
            {
              label: "Good",
              min: 7,
              max: 8,
              interpretation: "Good analytical skills.",
              careerImplication: "Management, consulting, education",
            },
            {
              label: "Average",
              min: 5,
              max: 6,
              interpretation: "Average critical thinking.",
              careerImplication: "General professional roles",
            },
            {
              label: "Developing",
              min: 0,
              max: 4,
              interpretation: "More structured reasoning support may help decision quality.",
              careerImplication:
                "Structured roles with clear procedures in technical, service, or support work",
            },
          ]),
        },
        {
          key: "problem_solving",
          label: "4.8 Problem Solving",
          displayOrder: 8,
          questionNumbers: range(441, 450),
          answerType: "single",
          scoringMethod: "objective_correct",
          scoreType: "correct_count",
          bands: objectiveBands([
            {
              label: "Excellent",
              min: 8,
              max: 10,
              interpretation: "Excellent problem-solving.",
              careerImplication:
                "Engineering, research, consulting, entrepreneurship",
            },
            {
              label: "Good",
              min: 6,
              max: 7,
              interpretation: "Good problem-solving.",
              careerImplication: "Technical fields, management, analysis",
            },
            {
              label: "Average",
              min: 4,
              max: 5,
              interpretation: "Average problem-solving.",
              careerImplication: "General professional roles",
            },
            {
              label: "Developing",
              min: 0,
              max: 3,
              interpretation: "Problem solving may be more effective in structured contexts.",
              careerImplication: "Administration, service, support",
            },
          ]),
        },
      ],
    },
    {
      sectionId: 5,
      key: "emotional_intelligence",
      label: "Emotional Intelligence Assessment",
      displayOrder: 5,
      subsections: [
        {
          key: "self_awareness",
          label: "5.1 Self-Awareness",
          displayOrder: 1,
          questionNumbers: range(451, 460),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "High self-awareness.",
              careerImplication: "Leadership, counseling, entrepreneurship",
            },
            moderate: {
              interpretation: "Moderate self-awareness.",
              careerImplication: "Most professional roles",
            },
            low: {
              interpretation: "Self-awareness needs more development.",
              careerImplication: "Structured support roles initially",
            },
          }),
        },
        {
          key: "self_regulation",
          label: "5.2 Self-Regulation",
          displayOrder: 2,
          questionNumbers: range(461, 470),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Excellent emotional control.",
              careerImplication: "High-stress careers, leadership, healthcare",
            },
            moderate: {
              interpretation: "Good self-regulation.",
              careerImplication: "General professional work",
            },
            low: {
              interpretation: "Support systems are likely important early on.",
              careerImplication: "Avoid high-stress environments initially",
            },
          }),
        },
        {
          key: "motivation",
          label: "5.3 Motivation",
          displayOrder: 3,
          questionNumbers: range(471, 480),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "High intrinsic motivation.",
              careerImplication: "Entrepreneurship, research, challenging roles",
            },
            moderate: {
              interpretation: "Good motivation.",
              careerImplication: "Career growth potential across many fields",
            },
            low: {
              interpretation: "External structure may currently help sustain momentum.",
              careerImplication: "Supportive, team-based environments",
            },
          }),
        },
        {
          key: "empathy",
          label: "5.4 Empathy",
          displayOrder: 4,
          questionNumbers: range(481, 490),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "High empathy.",
              careerImplication: "Healthcare, counseling, teaching, social work",
            },
            moderate: {
              interpretation: "Good social sensitivity.",
              careerImplication: "Customer service, team roles",
            },
            low: {
              interpretation: "Task-oriented work may feel easier than empathic load-bearing roles.",
              careerImplication: "Technical, analytical work",
            },
          }),
        },
        {
          key: "social_skills",
          label: "5.5 Social Skills",
          displayOrder: 5,
          questionNumbers: range(491, 500),
          answerType: "likert",
          scoringMethod: "banded_likert_average",
          scoreType: "average",
          bands: likertBands({
            high: {
              interpretation: "Strong social skills.",
              careerImplication: "Sales, management, public relations, education",
            },
            moderate: {
              interpretation: "Good interpersonal abilities.",
              careerImplication: "Collaborative work environments",
            },
            low: {
              interpretation: "Independent work may currently fit better than high-social-load roles.",
              careerImplication: "Research, technical, creative roles",
            },
          }),
        },
      ],
    },
  ],
  streamIndicators: [
    {
      key: "science",
      label: "Science Stream",
      interpretation:
        "High logical-mathematical intelligence, investigative interests, and strong numerical/abstract reasoning align with science-oriented pathways.",
      requiredSignals: [
        "logicalMathematical",
        "investigative",
        "quantitativeReasoning",
        "logicalReasoning",
      ],
    },
    {
      key: "commerce",
      label: "Commerce Stream",
      interpretation:
        "High numerical ability with enterprising/conventional interests and strong social execution align with commerce-oriented pathways.",
      requiredSignals: [
        "quantitativeReasoning",
        "enterprising",
        "conventional",
        "socialSkills",
      ],
    },
    {
      key: "arts_humanities",
      label: "Arts / Humanities Stream",
      interpretation:
        "High linguistic strength with artistic/social interests and empathy align with arts and humanities pathways.",
      requiredSignals: ["linguistic", "artistic", "social", "empathy"],
    },
    {
      key: "technical_vocational",
      label: "Technical / Vocational Track",
      interpretation:
        "High spatial or kinesthetic strengths with realistic interests and mechanical reasoning align with technical-vocational pathways.",
      requiredSignals: [
        "visualSpatial",
        "bodilyKinesthetic",
        "realistic",
        "mechanicalReasoning",
      ],
    },
  ],
  redFlags: [
    {
      key: "low_motivation",
      message: "Very low motivation scores suggest targeted career counseling support.",
    },
    {
      key: "high_neuroticism_low_regulation",
      message:
        "High neuroticism paired with low emotional regulation suggests stress-management support is important.",
    },
    {
      key: "flat_profile",
      message:
        "Flat profiles with no clear peaks suggest broader career exploration before narrowing options.",
    },
  ],
};

export default CAREER_500Q_CONFIG;
